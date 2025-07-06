import { Dispatch, SetStateAction } from "react";

export const getInternships = async (
  filters: SearchFilters,
  setTotalResults: Dispatch<SetStateAction<number>>,
  setInternships: Dispatch<SetStateAction<Internship[]>>
) => {
  // Prepare the request data
  const requestData = {
    keyword: filters.keyword || "",
    country: filters.country || "",
    postDate: filters.postDate || "",
    offset: filters.offset || 0,
    LogicalOperator: filters.LogicalOperator || "AND",
  };

  console.log("Sending request data:", requestData);

  const response = await fetch("/api/internships", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestData),
  });

  console.log("Response status:", response.status);
  console.log(
    "Response headers:",
    Object.fromEntries(response.headers.entries())
  );

  // Get response text first to see what we're getting
  const responseText = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { error: responseText };
    }

    console.error("API Error Response:", errorData);
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${
        errorData.error || "Unknown error"
      }`
    );
  }

  // Parse the response
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    throw new Error("Invalid JSON response from server");
  }

  console.log("Parsed internship API Response:", data);

  // Handle the response based on the actual API structure
  if (data.error) {
    throw new Error(data.error);
  }

  // Update results based on the actual response structure
  // You might need to adjust this based on what the API actually returns
  if (data && Array.isArray(data)) {
    setInternships(data);
    setTotalResults(data.length);
  } else {
    console.log("Unexpected response structure:", data);
    setInternships([]);
    setTotalResults(0);
  }
};
