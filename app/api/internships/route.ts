// app/api/internships/route.ts
import { NextRequest, NextResponse } from "next/server";
import https from "https";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Received request body:", body);

    const { keyword, country, postDate, offset} = body;

    // More flexible validation - allow search with just keyword OR country
    if (!keyword && !country) {
      return NextResponse.json(
        {
          error: "At least one of keyword or country is required",
          received: { keyword, country, postDate },
        },
        { status: 400 }
      );
    }

    // Build query parameters - handle empty values gracefully
    const searchParams = new URLSearchParams();

    if (keyword && keyword.trim()) {
      searchParams.set("title_filter", keyword);
    }

    if (country && country.trim()) {
      console.log("there is a country, ", country.replace(/[^\S ]/g, ""));

      searchParams.set("location_filter", country);
    }

    if (postDate && postDate.trim()) {
      searchParams.set("date_filter", postDate.trim());
    }

    searchParams.set("offset", offset?.toString() || "0");

    console.log("API Query params:", searchParams.toString());

    const options = {
      method: "GET",
      hostname: "internships-api.p.rapidapi.com",
      path: `/active-jb-7d?${searchParams.toString()}`,
      headers: {
        "x-rapidapi-host": "internships-api.p.rapidapi.com",
        "x-rapidapi-key": "7cfee5cb31mshd3df7a978936455p14b7fajsn8a5f4a940947",
      },
    };

    console.log(
      "Making request to:",
      `https://${options.hostname}${options.path}`
    );
    
    // Make the API request
    const response = await new Promise<{ data: string; statusCode: number }>(
      (resolve, reject) => {
        const req = https.request(options, (res) => {
          const chunks: Buffer[] = [];

          console.log("API Response Status:", res.statusCode);

          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const body = Buffer.concat(chunks).toString();
            resolve({
              data: body,
              statusCode: res.statusCode || 200,
            });
          });
        });

        req.on("error", (error: Error) => {
          console.error("HTTPS Request Error:", error);
          reject(error);
        });

        req.end();
      }
    );

    // Handle API response
    if (response.statusCode >= 400) {
      console.error("API returned error:", response.statusCode, response.data);
      return NextResponse.json(
        { error: "External API error", details: response.data },
        { status: response.statusCode }
      );
    }

    // Parse and return the response
    let data;
    try {
      data = JSON.parse(response.data);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid response from external API", raw: response.data },
        { status: 500 }
      );
    }

    console.log("Parsed API Response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
