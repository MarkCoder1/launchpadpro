import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!API_KEY) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Improved prompt (explicitly asks for cross-industry results unless query constrains)
const buildPrompt = (
  query: string
) => `You are a career advisor with access to labor market data as of October 2025.
Based on the user's search query "${query}", recommend 10 emerging, in-demand careers that are growing rapidly and offer good prospects.

Important instructions:
- If the user query explicitly specifies an industry (e.g., "healthcare jobs", "AI careers"), focus on that industry only.
- If the query is general (e.g., "in-demand jobs", "good careers"), return a diverse set across multiple industries (Technology, Healthcare, Finance, Renewable Energy, Education, Construction, Public Services, Design, etc.). Do NOT default all results to Technology unless the query requests it.
- Return ONLY a valid JSON array that follows the schema provided in the request config. Do NOT include any prose, code fences, or extra text.

For each career object include EXACTLY these fields:
- title (string)
- industry (string)
- keySkills (array of strings, 3-5 items)
- avgSalary (object: { currency: string, low: number, high: number })
- growthRate (string, e.g., "15% by 2030")
- demandLevel (string: "High" | "Moderate" | "Low")
- description (string, 1-2 sentences)
- sources (array of strings)

Return the JSON array only.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { error: "'query' is required" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(query);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // example shows contents can be a string
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              industry: { type: Type.STRING },
              keySkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              avgSalary: {
                type: Type.OBJECT,
                properties: {
                  currency: { type: Type.STRING },
                  low: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                },
                propertyOrdering: ["currency", "low", "high"],
              },
              growthRate: { type: Type.STRING },
              demandLevel: { type: Type.STRING },
              description: { type: Type.STRING },
              sources: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            propertyOrdering: [
              "title",
              "industry",
              "keySkills",
              "avgSalary",
              "growthRate",
              "demandLevel",
              "description",
              "sources",
            ],
          },
        },
      },
    });

    // response.text is what the docs example uses; handle whatever form we get
    let raw: string = response.text ?? String(response);

    // ensure string
    if (typeof raw !== "string") raw = String(raw);

    // Strip typical markdown/json fences if they somehow appear
    raw = raw
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Try parse, fallback to jsonrepair
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse JSON from AI. raw response:", raw, err);
      try {
        const repaired = jsonrepair(raw);
        parsed = JSON.parse(repaired);
      } catch (err2) {
        console.error("Failed to parse JSON from AI. raw response:", raw, err2);
        return NextResponse.json(
          { error: "AI returned invalid JSON and repair failed", raw },
          { status: 500 }
        );
      }
    }

    // Optional: Very light server-side validation/enforcement (ensure array and required fields)
    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI response is not an array as expected", parsed },
        { status: 500 }
      );
    }

    // (Optional) enforce non-tech diversity for generic queries:
    // If query is generic (no industry word) ensure there are at least 3 distinct industries.
    const genericQuery =
      !/(healthcare|finance|technology|tech|ai|legal|education|construction|energy|renewable)/i.test(
        query
      );
    if (genericQuery) {
      const industries = new Set(
        parsed.map((c) =>
          String(c.industry || "")
            .split("/")[0]
            .trim()
        )
      );
      if (industries.size < 3 && parsed.length >= 5) {
        // Try to respond anyway but warn in logs — we don't reject client response
        console.warn(
          "AI returned few distinct industries for a generic query. Industries:",
          Array.from(industries)
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error in /api/careers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
