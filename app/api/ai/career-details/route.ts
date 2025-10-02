import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const buildPrompt = (career: string) => `
You are a professional career coach. The user is interested in learning more about the career: "${career}".

Return a JSON object with the following fields:
- title: the career title
- overview: short 2–3 sentence summary of the role
- education: recommended degrees, certifications, or training paths
- keySkills: list of 5–8 critical skills to succeed in this career
- entryPath: practical steps to break into this career (e.g., internships, projects, bootcamps)
- careerProgression: outline of how this career advances (entry → mid-level → senior → leadership)
- resources: list of recommended learning resources (books, online courses, communities, etc.)
- futureOutlook: insights into how this career is expected to grow or change by 2030

⚠️ Return ONLY valid JSON. No markdown, no code fences.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const career = typeof body?.career === "string" ? body.career.trim() : "";

    if (!career) {
      return NextResponse.json(
        { error: "'career' is required" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(career),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            education: { type: Type.ARRAY, items: { type: Type.STRING } },
            keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            entryPath: { type: Type.ARRAY, items: { type: Type.STRING } },
            careerProgression: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            resources: { type: Type.ARRAY, items: { type: Type.STRING } },
            futureOutlook: { type: Type.STRING },
          },
          propertyOrdering: [
            "title",
            "overview",
            "education",
            "keySkills",
            "entryPath",
            "careerProgression",
            "resources",
            "futureOutlook",
          ],
        },
      },
    });

    let raw: string = (response as any).text ?? "";
    raw = raw
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const repaired = jsonrepair(raw);
      parsed = JSON.parse(repaired);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Error in /api/career-details:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
