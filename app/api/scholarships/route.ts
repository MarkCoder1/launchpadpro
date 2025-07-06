import { NextRequest, NextResponse } from "next/server";

const API_KEY = "AIzaSyD3Nt_hgz-Sy8gJYQ-1P0xzAluXjhEQ9Wk";
const CSE_ID = "110be6093d25642f5";

async function fetchScholarshipsFromGoogle(query: string, start = 1) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}&start=${start}`;
  const response = await fetch(url);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google API error: ${err}`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const start = (page - 1) * 10 + 1;
    const results = await fetchScholarshipsFromGoogle(query, start);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Scholarships API Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
