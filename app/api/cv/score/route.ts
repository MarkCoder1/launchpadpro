import { NextRequest, NextResponse } from "next/server";
import {
  CVScoreApiResponse,
  CVInputType,
  CVScoreReport,
} from "../../../../types/cvscore";
import puppeteer, { Browser, PuppeteerLaunchOptions } from "puppeteer";
import mammoth from "mammoth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Converts a Buffer to a data URL string
function bufferToDataUrl(mime: string, buf: Buffer): string {
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

// Launch Puppeteer with safe defaults for diverse environments
async function launchBrowser(): Promise<Browser> {
  const launchOptions: PuppeteerLaunchOptions = {
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(launchOptions);
}

// Render all PDF pages to PNG data URLs inside a headless browser using pdf.js
async function pdfBufferToImages(buf: Buffer): Promise<string[]> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto("about:blank");
    const pdfJsVersion = "5.4.394";
    try {
      await page.addScriptTag({
        url: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.min.js`,
      });
      await page.addScriptTag({
        content: `window.__PDFJS_WORKER__ = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js'`,
      });

      const dataUrls: string[] = await page.evaluate(
        async ({ pdfBytes }) => {
          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = (
            window as any
          ).__PDFJS_WORKER__;
          const uint8 = new Uint8Array(pdfBytes);
          const loadingTask = pdfjsLib.getDocument({ data: uint8 });
          const pdf = await loadingTask.promise;
          const out: string[] = [];
          const scale = 2;
          for (let i = 1; i <= pdf.numPages; i++) {
            const p = await pdf.getPage(i);
            const viewport = p.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await p.render({ canvasContext: ctx, viewport }).promise;
            out.push(canvas.toDataURL("image/png"));
          }
          return out;
        },
        { pdfBytes: Array.from(buf.values()) }
      );
      if (dataUrls.length) return dataUrls;
    } catch {
      const dataUrl = `data:application/pdf;base64,${buf.toString("base64")}`;
      const html = `<!doctype html><html><head><meta charset="utf-8"/><style>html,body{margin:0;height:100%}</style></head><body><embed id="pdf" type="application/pdf" src="${dataUrl}" style="width:100vw;height:100vh;"/></body></html>`;
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await page.evaluate(async () => {
        for (let i = 0; i < 12; i++) {
          window.scrollBy(0, window.innerHeight);
          await new Promise((r) => setTimeout(r, 250));
          if (
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight
          )
            break;
        }
        window.scrollTo(0, 0);
      });
      const shot = (await page.screenshot({ fullPage: true })) as Buffer;
      return [bufferToDataUrl("image/png", shot)];
    }
    const shot = (await page.screenshot({ fullPage: true })) as Buffer;
    return [bufferToDataUrl("image/png", shot)];
  } finally {
    await browser.close();
  }
}

// Convert DOCX -> HTML with mammoth, then screenshot the content as images (slice tall pages)
async function docxBufferToImages(buf: Buffer): Promise<string[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer: buf });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 2 });

    const fullHtml = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; margin: 0; background: white; line-height: 1.5; }
          h1, h2, h3 { color: #1e40af; margin: 16px 0 8px; }
          ul { padding-left: 24px; }
          li { margin: 6px 0; }
        </style>
      </head>
      <body>${html}</body></html>`;

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    await page.waitForTimeout(500);

    const screenshot = (await page.screenshot({ fullPage: true })) as Buffer;
    return [bufferToDataUrl("image/png", screenshot)];
  } finally {
    await browser.close();
  }
}

// Call Groq Vision to score the resume images and return a CVScoreReport
async function scoreResumeWithGroqVision(params: {
  images: string[];
  jobDescription: string;
  userSkills?: string[];
  inputType: CVInputType;
  fileName?: string;
}): Promise<CVScoreReport> {
  const { images, jobDescription, userSkills, inputType, fileName } = params;
  const apiKey = process.env.GROQ_API_KEY;
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set");
  }

  const systemPrompt = `You are an expert resume reviewer. You will receive only resume IMAGES and a job description.

Tasks:
1) Visually read (OCR mentally) the resume images and identify key content, sections, and layout.
2) Compare the resume content against the job description to assess relevance.
3) Compute scores for each category (0-100) based on visible evidence.

Output rules (strict):
- Return EXACTLY one valid JSON object; no prose, no markdown, no code fences.
- Use realistic, non-zero scores whenever the resume contains readable content; only return all zeros if the resume is truly empty/unreadable. and try to use common sense
- Keep arrays concise (<= 20 items) and values grounded in the images.
- For extractedText, transcribe up to 1200 characters of the most relevant visible text; if unreadable, use an empty string.
- If a metric is not inferable (like readability indices), use null.
- Follow the schema below exactly; do not add or remove keys. Don't Be So Strict and Literal, and Be Generous`;

  const userPrompt = `Analyze the following resume images against this job description and user skills:

JOB DESCRIPTION:
${jobDescription}

USER SKILLS: ${(userSkills || []).join(", ")}

You must return a JSON object with this EXACT structure (fill all fields with appropriate values):

{
  "total": <calculated weighted total score 0-100>,
  "weights": {
    "keywordMatch": 25,
    "structureFormatting": 15,
    "grammarClarity": 15,
    "experienceRelevance": 20,
    "designLayout": 25
  },
  "inputType": "${inputType}",
  "fileName": ${fileName ? `"${fileName}"` : "null"},
  "extractedText": "<extract all visible text from the resume images>",
  "sections": {
    "experience": <true/false>,
    "education": <true/false>,
    "skills": <true/false>,
    "projects": <true/false>,
    "achievements": <true/false>,
    "certifications": <true/false>,
    "contact": <true/false>
  },
  "keywords": {
    "extractedKeywords": [<up to 30 key terms found in resume>],
    "present": [<subset of job keywords detected in resume (exact or close match)>],
    "missing": [<job keywords not detected in resume>],
    "coveragePercent": <0-100, round(100*present.length/(present.length+missing.length))>
  },
  "readability": {
    "fleschKincaidGrade": <number or null>,
    "colemanLiauIndex": <number or null>,
    "readingEase": <0-100 or null>,
    "avgSentenceLength": <number or null>,
    "complexSentenceRatio": <0-1 or null>
  },
  "design": {
    "fontVariety": <estimated number of font styles>,
    "bulletUsage": <count of bullet points>,
    "hasConsistentHeaders": <true/false>,
    "excessiveWhitespace": <true/false>,
    "alignmentSignals": "<good/mixed/poor>"
  },
  "categories": {
    "keywordMatch": {
      "score": <0-100>,
      "reasons": [<array of strings explaining score>],
      "suggestions": [<array of improvement suggestions>]
    },
    "structureFormatting": {
      "score": <0-100>,
      "reasons": [<array of strings>],
      "suggestions": [<array of strings>]
    },
    "grammarClarity": {
      "score": <0-100>,
      "reasons": [<array of strings>],
      "suggestions": [<array of strings>],
      "issues": [
        {
          "type": "<spelling/grammar/clarity/style>",
          "message": "<description>",
          "example": "<optional example>",
          "suggestion": "<optional fix>"
        }
      ]
    },
    "experienceRelevance": {
      "score": <0-100>,
      "reasons": [<array of strings>],
      "suggestions": [<array of strings>]
    },
    "designLayout": {
      "score": <0-100>,
      "reasons": [<array of strings>],
      "suggestions": [<array of strings>]
    }
  },
  "recommendations": {
    "quickWins": [<up to 6 short, actionable items tailored to the JD, e.g., "Add 'Figma' to Skills and Summary">],
    "addKeywords": [<subset of JD keywords to add or emphasize; deduplicate; <= 12>],
    "addSections": [<sections to add if missing, e.g., "Projects", "Achievements", "Portfolio Link">],
    "bulletExamples": [<1-4 concise, ready-to-copy bullet statements tailored to the JD>]
  },
  "meta": {
    "createdAt": "${new Date().toISOString()}",
    "aiProviders": {
      "grammar": "groq",
      "vision": "groq"
    },
    "processingMs": 0,
    "debug": {}
  }
}

Scoring: total = keywordMatch*0.25 + structureFormatting*0.15 + grammarClarity*0.15 + experienceRelevance*0.20 + designLayout*0.25. Clamp total to [0,100]. Avoid returning all zeros unless the resume is blank or unreadable.

Return ONLY the JSON object, no other text.`;

  // Build content array with text and images
  const content: any[] = [{ type: "text", text: userPrompt }];

  // Add each image
  for (const imageUrl of images) {
    content.push({
      type: "image_url",
      image_url: { url: imageUrl },
    });
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content },
  ];

  console.log(
    "[CVScore] Calling Groq with model:",
    model,
    "images:",
    images.length
  );

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CVScore] Groq API error:", errorText);
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content_text = data?.choices?.[0]?.message?.content;

  if (!content_text) {
    throw new Error("No content in Groq response");
  }

  console.log(
    "[CVScore] Groq response preview:",
    content_text.substring(0, 500)
  );

  // Parse the JSON response
  let parsed: CVScoreReport;
  try {
    // Remove markdown code blocks if present
    let cleanedContent = content_text.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/^```\n/, "")
        .replace(/\n```$/, "");
    }

    parsed = JSON.parse(cleanedContent);
  } catch (e) {
    console.error("[CVScore] JSON parse error:", e);
    console.error("[CVScore] Raw content:", content_text);
    throw new Error("Failed to parse Groq response as JSON");
  }

  // Ensure required fields
  parsed.inputType = inputType;
  if (fileName) parsed.fileName = fileName;

  if (!parsed.meta) {
    parsed.meta = {
      createdAt: new Date().toISOString(),
      aiProviders: { grammar: "groq", vision: "groq" },
      processingMs: 0,
      debug: {},
    };
  }

  parsed.meta.aiProviders = { grammar: "groq", vision: "groq" };
  parsed.meta.debug = parsed.meta.debug || {};
  parsed.meta.debug.imageCount = images.length;

  // Fill recommendations if missing with sensible defaults so UI always has content
  try {
    if (!('recommendations' in parsed) || !parsed.recommendations) {
      const missing = parsed.keywords?.missing || [];
      const absentSections: string[] = [];
      const sec = parsed.sections || ({} as any);
      const possible = [
        ['projects', 'Projects'],
        ['achievements', 'Achievements'],
        ['certifications', 'Certifications'],
        ['contact', 'Contact'],
        ['skills', 'Skills'],
        ['experience', 'Experience'],
        ['education', 'Education'],
      ] as const;
      for (const [k, label] of possible) {
        if (typeof (sec as any)[k] === 'boolean' && !(sec as any)[k]) absentSections.push(label);
      }
      const kwSuggestions = (parsed.categories?.keywordMatch?.suggestions || []).slice(0, 3);
      const quickWinsBase = [
        ...missing.slice(0, 3).map((k) => `Add or emphasize "${k}" in Skills and Summary.`),
        ...kwSuggestions,
      ].filter(Boolean);
      (parsed as any).recommendations = {
        quickWins: quickWinsBase.slice(0, 6),
        addKeywords: Array.from(new Set(missing)).slice(0, 12),
        addSections: Array.from(new Set(absentSections)).slice(0, 6),
        bulletExamples: [],
      };
    }
  } catch {}

  return parsed;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<CVScoreApiResponse>> {
  const t0 = Date.now();
  try {
    const form = await req.formData();
    const jd = String(form.get("jobDescription") || "").trim();
    const textInput = String(form.get("text") || "").trim();
    const file = form.get("file") as File | null;
    const skillsRaw = String(form.get("userSkills") || "").trim();
    const userSkills = skillsRaw
      ? skillsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (!jd) {
      return NextResponse.json(
        { ok: false, error: "Missing jobDescription" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "GROQ_API_KEY not set" },
        { status: 500 }
      );
    }

    let inputType: CVInputType = "text";
    let fileName: string | undefined;
    let images: string[] = [];

    // Handle file upload
    if (file && typeof file.arrayBuffer === "function") {
      const ab = await file.arrayBuffer();
      const buf = Buffer.from(ab);
      fileName = file.name;

      if (
        file.type === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf")
      ) {
        inputType = "pdf";
        images = await pdfBufferToImages(buf);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.toLowerCase().endsWith(".docx")
      ) {
        inputType = "docx";
        images = await docxBufferToImages(buf);
      } else {
        // Fallback: render as text
        inputType = "text";
        const browser = await launchBrowser();
        try {
          const page = await browser.newPage();
          await page.setViewport({
            width: 900,
            height: 1200,
            deviceScaleFactor: 2,
          });
          const txt = buf.toString("utf8");
          await page.setContent(
            `<pre style="white-space:pre-wrap;font:14px Arial;padding:24px;max-width:800px;">${txt.replace(
              /</g,
              "&lt;"
            )}</pre>`
          );
          const shot = (await page.screenshot({ fullPage: true })) as Buffer;
          images = [bufferToDataUrl("image/png", shot)];
        } finally {
          await browser.close();
        }
      }
    }
    // Handle text input
    else if (textInput) {
      inputType = "text";
      const browser = await launchBrowser();
      try {
        const page = await browser.newPage();
        await page.setViewport({
          width: 900,
          height: 1200,
          deviceScaleFactor: 2,
        });
        await page.setContent(
          `<pre style="white-space:pre-wrap;font:14px Arial;padding:24px;max-width:800px;">${textInput.replace(
            /</g,
            "&lt;"
          )}</pre>`
        );
        const shot = (await page.screenshot({ fullPage: true })) as Buffer;
        images = [bufferToDataUrl("image/png", shot)];
      } finally {
        await browser.close();
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Provide a file (PDF/DOCX) or text." },
        { status: 400 }
      );
    }

    if (!images.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to render resume to images." },
        { status: 500 }
      );
    }

    const report = await scoreResumeWithGroqVision({
      images,
      jobDescription: jd,
      userSkills,
      inputType,
      fileName,
    });

    report.meta.processingMs = Date.now() - t0;

    return NextResponse.json({ ok: true, report }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    console.error("[CVScore] Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
