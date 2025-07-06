// app/api/remote-jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { Trykker } from "next/font/google";

export async function POST(request: NextRequest) {
  try {
    const removeDuplicateByTitle = (arr: Job[]) => {
      const seen = new Set();
      return arr.filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      });
    };

    // Parse the request body
    const body = await request.json();
    console.log("Received request body:", body);

    const { keyword, country, postDate, offset, LogicalOperator, isRemote } =
      body;

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
    const buildParams = () => {
      const searchParams = new URLSearchParams();

      if (keyword && keyword.trim()) {
        console.log("logical operator ", LogicalOperator);

        if (LogicalOperator === "AND") {
          searchParams.set(
            "advanced_title_filter",
            keyword.split(" ").join(" & ")
          );
        } else if (LogicalOperator === "OR") {
          searchParams.set(
            "advanced_title_filter",
            keyword.split(" ").join(" | ")
          );
        }
      }

      if (country && country.trim()) {
        searchParams.set("location_filter", country);
      }

      if (postDate && postDate.trim()) {
        searchParams.set("date_filter", postDate.trim());
      }
      if (isRemote === "true") {
        searchParams.set("remote", "true");
      } else {
        searchParams.delete("remote");
      }

      searchParams.set("offset", offset?.toString() || "0");

      console.log("API Query params:", searchParams.toString());
      return searchParams;
    };

    const options = {
      method: "GET",
      hostname: "active-jobs-db.p.rapidapi.com",
      port: null,
      path: `/active-ats-7d?limit=12&${buildParams().toString()}`,
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "active-jobs-db.p.rapidapi.com",
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

    const uniqueResults = removeDuplicateByTitle(data);

    return NextResponse.json(uniqueResults);
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
