import { NextRequest, NextResponse } from "next/server"
import { CVScoreApiResponse, CVInputType, CVScoreReport } from "../../../../types/cvscore"
import puppeteer, { Browser, PuppeteerLaunchOptions } from "puppeteer"
import mammoth from "mammoth"


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Converts a Buffer to a data URL string
function bufferToDataUrl(mime: string, buf: Buffer): string {
  const b64 = buf.toString('base64')
  return `data:${mime};base64,${b64}`
}

// Launch Puppeteer with safe defaults for diverse environments
async function launchBrowser(): Promise<Browser> {
  const launchOptions: PuppeteerLaunchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  }
  return puppeteer.launch(launchOptions)
}

// Render all PDF pages to PNG data URLs inside a headless browser using pdf.js
async function pdfBufferToImages(buf: Buffer): Promise<string[]> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.goto('about:blank')
    const pdfJsVersion = '5.4.394'
    try {
      await page.addScriptTag({ url: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.min.js` })
      await page.addScriptTag({ content: `window.__PDFJS_WORKER__ = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js'` })

      const dataUrls: string[] = await page.evaluate(async ({ pdfBytes }) => {
        // pdf.js non-module build attaches to window
        const pdfjsLib = (window as unknown as { pdfjsLib: {
          getDocument: (opts: { data: Uint8Array }) => { promise: Promise<{
            numPages: number,
            getPage: (n: number) => Promise<{
              getViewport: (o: { scale: number }) => { width: number; height: number },
              render: (args: { canvasContext: CanvasRenderingContext2D, viewport: { width: number; height: number } }) => { promise: Promise<void> }
            }>
          }> },
          GlobalWorkerOptions: { workerSrc: strin g }
        } }).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = (window as unknown as { __PDFJS_WORKER__: string }).__PDFJS_WORKER__
        const uint8 = new Uint8Array(pdfBytes)
        const loadingTask = pdfjsLib.getDocument({ data: uint8 })
        const pdf = await loadingTask.promise
        const out: string[] = []
        const scale = 2
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i)
          const viewport = p.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          canvas.width = viewport.width
          canvas.height = viewport.height
          await p.render({ canvasContext: ctx, viewport }).promise
          out.push(canvas.toDataURL('image/png'))
        }
        return out
      }, { pdfBytes: Array.from(buf.values()) })
      if (dataUrls.length) return dataUrls
    } catch {
      // Fallback to Chrome built-in PDF viewer screenshot
      // Render the PDF via an <embed> tag and take a fullPage screenshot
      const dataUrl = `data:application/pdf;base64,${buf.toString('base64')}`
      const html = `<!doctype html><html><head><meta charset="utf-8"/><style>html,body{margin:0;height:100%}</style></head><body><embed id="pdf" type="application/pdf" src="${dataUrl}" style="width:100vw;height:100vh;"/></body></html>`
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })
      await page.setContent(html, { waitUntil: 'domcontentloaded' })
      // Give the viewer some time to render then scroll to force more pages to rasterize
      await page.waitForTimeout(800)
      await page.evaluate(async () => {
        for (let i = 0; i < 12; i++) {
          window.scrollBy(0, window.innerHeight)
          await new Promise(r => setTimeout(r, 250))
          if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) break
        }
        window.scrollTo(0, 0)
      })
      const shot = await page.screenshot({ fullPage: true }) as Buffer
      return [bufferToDataUrl('image/png', shot)]
    }
    // If reached here without return, fallback to single-page screenshot
    const shot = await page.screenshot({ fullPage: true }) as Buffer
    return [bufferToDataUrl('image/png', shot)]
  } finally {
    await browser.close()
  }
}

// Convert DOCX -> HTML with mammoth, then screenshot the content as an image (single image)
async function docxBufferToImages(buf: Buffer): Promise<string[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer: buf })
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    // Constrain to A4-ish width for readability
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 })
    const wrappedHtml = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; margin: 0; }
            .page { width: 794px; /* ~A4 @ 96dpi */ margin: 0 auto; }
            h1,h2,h3 { margin: 12px 0; }
            ul { padding-left: 20px; }
            li { margin: 4px 0; }
          </style>
        </head>
        <body><div class="page">${html}</div></body>
      </html>`
    await page.setContent(wrappedHtml, { waitUntil: 'networkidle0' })
    const clipTarget = await page.$('.page')
    if (!clipTarget) {
      const bufPng = await page.screenshot({ fullPage: true }) as Buffer
      return [bufferToDataUrl('image/png', bufPng)]
    }
    const box = await clipTarget.boundingBox()
    if (!box) {
      const bufPng = await page.screenshot({ fullPage: true }) as Buffer
      return [bufferToDataUrl('image/png', bufPng)]
    }
    const shot = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 900), height: Math.min(box.height, 1200) } }) as Buffer
    return [bufferToDataUrl('image/png', shot)]
  } finally {
    await browser.close()
  }
}

// Call Groq Vision to score the resume images and return a CVScoreReport
async function scoreResumeWithGroqVision(params: {
  images: string[]
  jobDescription: string
  userSkills?: string[]
  inputType: CVInputType
  fileName?: string
}): Promise<CVScoreReport> {
  const { images, jobDescription, userSkills, inputType, fileName } = params
  const apiKey = process.env.GROQ_API_KEY
  const envModel = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set')
  }

  const system = `You are an expert resume reviewer. Analyze the provided resume IMAGES (not text) and the job description. Return ONLY a single JSON object that strictly matches this TypeScript schema keys and structure (values should be consistent): {"total":number,"weights":{"keywordMatch":25,"structureFormatting":15,"grammarClarity":15,"experienceRelevance":20,"designLayout":25},"inputType":"pdf"|"docx"|"text","fileName":string?|undefined,"extractedText":string,"sections":{"experience":boolean,"education":boolean,"skills":boolean,"projects":boolean,"achievements":boolean,"certifications":boolean,"contact":boolean},"keywords":{"extractedKeywords":string[],"present":string[],"missing":string[],"coveragePercent":number},"readability":{"fleschKincaidGrade":number|null,"colemanLiauIndex":number|null,"readingEase":number|null,"avgSentenceLength":number|null,"complexSentenceRatio":number|null},"design":{"fontVariety":number,"bulletUsage":number,"hasConsistentHeaders":boolean,"excessiveWhitespace":boolean,"alignmentSignals":"good"|"mixed"|"poor"},"categories":{"keywordMatch":{"score":number,"reasons":string[],"suggestions":string[]},"structureFormatting":{"score":number,"reasons":string[],"suggestions":string[]},"grammarClarity":{"score":number,"reasons":string[],"suggestions":string[],"issues"?:Array<{"type":"spelling"|"grammar"|"clarity"|"style","message":string,"example"?:string,"suggestion"?:string}>},"experienceRelevance":{"score":number,"reasons":string[],"suggestions":string[]},"designLayout":{"score":number,"reasons":string[],"suggestions":string[]}},"meta":{"createdAt":string,"aiProviders":{"grammar":"none"|"groq"|"openai"|"huggingface"|"none","vision":"groq"|"none"},"processingMs":number,"debug":{"extractedTextSample"?:string,"lineFeaturesSample"?:any[],"tokensSample"?:string[]}}}`

  type ContentPart = { type: 'text', text: string } | { type: 'image_url', image_url: { url: string } }
  const userTextParts: ContentPart[] = [
    { type: 'text', text: `Job description:\n${jobDescription}\n\nUser skills: ${(userSkills||[]).join(', ')}` },
  ]
  // Append images
  for (const url of images) {
    // Use OpenAI/Groq chat content part for images
    userTextParts.push({ type: 'image_url', image_url: { url } })
  }

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: userTextParts },
  ]

  // Try requesting Groq with model fallbacks when decommissioned or unsupported
  const candidateModels = [envModel, 'meta-llama/llama-4-scout-17b-16e-instruct']
  const tried: string[] = []
  let lastErrText = ''
  type GroqResponse = { choices?: Array<{ message?: { content?: string } }> }
  let json: GroqResponse | null = null
  for (const model of candidateModels) {
    tried.push(model)
    console.debug('[CVScore] Groq request model:', model, 'images:', images.length)
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, temperature: 0.1, messages, response_format: { type: 'json_object' } }),
    })
    if (res.ok) { json = await res.json(); break }
    const txt = await res.text().catch(() => String(res.status))
    lastErrText = txt
    try {
      const errObj = JSON.parse(txt)
      const code = errObj?.error?.code
      if (code === 'model_decommissioned' || code === 'model_not_found') {
        console.warn('[CVScore] Groq model issue (', code, '), trying next model...')
        continue
      }
    } catch {}
    throw new Error(`Groq vision error: ${res.status} ${txt}`)
  }
  if (!json) {
    throw new Error(`Groq vision error: model(s) unavailable ${lastErrText || ''}`)
  }
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') throw new Error('Invalid Groq response')
  let parsed: CVScoreReport
  try {
    parsed = JSON.parse(content)
  } catch {
    // Some providers may already return an object
    parsed = content as unknown as CVScoreReport
  }

  // Ensure some meta fields are set/overridden
  parsed.inputType = inputType
  if (fileName) parsed.fileName = fileName
  parsed.meta = parsed.meta || { createdAt: new Date().toISOString(), aiProviders: { grammar: 'none', vision: 'groq' }, processingMs: 0, debug: {} }
  if (!parsed.meta.createdAt) parsed.meta.createdAt = new Date().toISOString()
  parsed.meta.aiProviders = { ...(parsed.meta.aiProviders || {}), vision: 'groq' }
  parsed.meta.debug = parsed.meta.debug || {}
  parsed.meta.debug.aiResponseRaw = typeof content === 'string' ? (content.length > 2000 ? content.slice(0, 2000) + '…' : content) : undefined
  parsed.meta.debug.imageCount = images.length
  parsed.meta.debug.modelsTried = tried
  console.debug('[CVScore] Groq response snippet:', parsed.meta.debug.aiResponseRaw)
  return parsed
}

export async function POST(req: NextRequest): Promise<NextResponse<CVScoreApiResponse>> {
  const t0 = Date.now()
  try {
    const form = await req.formData()
    const jd = String(form.get('jobDescription') || '').trim()
    const textInput = String(form.get('text') || '').trim()
    const file = form.get('file') as File | null
    const skillsRaw = String(form.get('userSkills') || '').trim()
    const userSkills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined

    if (!jd) {
      return NextResponse.json({ ok: false, error: 'Missing jobDescription' }, { status: 400 })
    }

    // Preflight environment check for Groq
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY not set' }, { status: 500 })
    }

    let inputType: CVInputType = 'text'
    let fileName: string | undefined

    // If file provided, prefer vision flow (images -> Groq)
    if (file && typeof file.arrayBuffer === 'function') {
      const ab = await file.arrayBuffer()
      const buf = Buffer.from(ab)
      fileName = file.name
      let images: string[] = []
      if (file.type === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
        inputType = 'pdf'
        images = await pdfBufferToImages(buf)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (fileName && fileName.toLowerCase().endsWith('.docx'))) {
        inputType = 'docx'
        images = await docxBufferToImages(buf)
      } else {
        // Fallback: render raw text content into an image via headless browser
        inputType = 'text'
        const browser = await launchBrowser()
        try {
          const page = await browser.newPage()
          await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 })
          const txt = Buffer.from(buf).toString('utf8')
          await page.setContent(`<pre style="white-space:pre-wrap;font:14px Arial;padding:24px;max-width:800px;">${txt.replace(/</g,'&lt;')}</pre>`)
          const shot = await page.screenshot({ fullPage: true }) as Buffer
          images = [bufferToDataUrl('image/png', shot)]
        } finally {
          await browser.close()
        }
      }

      if (!images.length) {
        return NextResponse.json({ ok: false, error: 'Failed to render resume to images.' }, { status: 500 })
      }
      const report = await scoreResumeWithGroqVision({ images, jobDescription: jd, userSkills, inputType, fileName })
      // Set processing metrics
      report.meta = report.meta || { createdAt: new Date().toISOString() }
      report.meta.processingMs = Date.now() - t0
      report.meta.aiProviders = { ...(report.meta.aiProviders || {}), vision: 'groq' }
      return NextResponse.json({ ok: true, report }, { status: 200 })
    }

    // If only text provided, fall back to rendering text into an image and use vision flow
    if (textInput) {
      inputType = 'text'
      const browser = await launchBrowser()
      let images: string[] = []
      try {
        const page = await browser.newPage()
        await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 })
        await page.setContent(`<pre style="white-space:pre-wrap;font:14px Arial;padding:24px;max-width:800px;">${textInput.replace(/</g,'&lt;')}</pre>`)
        const shot = await page.screenshot({ fullPage: true }) as Buffer
        images = [bufferToDataUrl('image/png', shot)]
      } finally {
        await browser.close()
      }
      const report = await scoreResumeWithGroqVision({ images, jobDescription: jd, userSkills, inputType })
      report.meta = report.meta || { createdAt: new Date().toISOString() }
      report.meta.processingMs = Date.now() - t0
      report.meta.aiProviders = { ...(report.meta.aiProviders || {}), vision: 'groq' }
      return NextResponse.json({ ok: true, report }, { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Provide a file (PDF/DOCX) or text.' }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unexpected error'
    console.error('CV Score error:', e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
