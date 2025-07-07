import { Dispatch, SetStateAction } from "react";

export const getScholarships = async (
  page: number,
  filters: SearchFilters,
  setTotalResults: Dispatch<SetStateAction<number>>,
  setScholarships: Dispatch<SetStateAction<Scholarship[]>>
) => {
  const currentDate = new Date();
  const userQuery = `${filters.keyword || "fully funded"} scholarships ${
    filters.country ? "in " + filters.country : ""
  } ${filters.postDate ? "posted after " + filters.postDate : "posted after " + currentDate.getFullYear()}`;

  console.log("query ad ", userQuery);

  const requestData = {
    query: userQuery,
    page: page || 1,
  };
  console.log("📤 Sending scholarships request data:", requestData);

  const response = await fetch("/api/scholarships", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestData),
  });

  console.log("📥 Response status:", response.status);

  const responseText = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { error: responseText };
    }

    console.error("❌ Scholarships API Error Response:", errorData);
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${
        errorData.error || "Unknown error"
      }`
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error("🛑 JSON Parse Error:", parseError);
    throw new Error("Invalid JSON response from /api/scholarships");
  }

  console.log("✅ Parsed scholarship API Response:", data);

  if (data && Array.isArray(data)) {
    setScholarships(data);
    setTotalResults(data.length);
  } else {
    console.warn("⚠️ Unexpected response structure:", data);
    setScholarships([]);
    setTotalResults(0);
  }
};
