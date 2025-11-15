const userData = {
    "personalInfo": {
        "firstName": "marc",
        "lastName": "alber",
        "email": "marcalber59@gmail.com",
        "phone": "2222559566",
        "location": "kj nmjnm",
        "title": "dd",
        "summary": "",
        "linkedin": "",
        "website": ""
    },
    "education": [
        {
            "institution": "Univeristy of Technology",
            "degree": "Bachelor of Computer Science",
            "field": "wef",
            "startDate": "2025-09",
            "endDate": "",
            "gpa": "",
            "description": ""
        }
    ],
    "workExperience": [
        {
            "company": "jhkl",
            "position": ".,",
            "startDate": "999",
            "endDate": "1000",
            "description": "sds",
            "location": "99",
            "current": false
        }
    ],
    "skills": [
        {
            "name": "",
            "level": "",
            "category": ""
        }
    ],
    "projects": [],
    "achievements": [],
    "generatedAt": "2025-11-09T20:56:03.200Z"
}
async function analyzeImage() {
  try {
    // Prefer an environment variable for the API key. Do not commit keys to source.
    const apiKey = process.env.HF_API_KEY || "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";
    const response = await fetch("https://router.huggingface.co/hf-inference/mistralai/Mixtral-8x7B", {
      headers: { Authorization: `Bearer ${apiKey}` },
      method: "POST",
      body: JSON.stringify({
        inputs: `Write a professional resume using this data: ${JSON.stringify(userData)}`,
      }),
    });

    console.log("statusCode:", response.status);
    const ct = response.headers.get("content-type") || "";
    console.log("content-type:", ct);

    // If the response isn't JSON, print a truncated text body to help diagnose (e.g. HTML error page).
    const bodyText = await response.text();
    if (!ct.includes("application/json")) {
      console.error("Non-JSON response (first 2000 chars):\n", bodyText.slice(0, 2000));
      return;
    }

    // Parse JSON only when content-type indicates JSON
    const result = JSON.parse(bodyText);
    // The shape of the response might vary by model/endpoint. Log it for debugging.
    console.log("response json:", result);
    const aiText = Array.isArray(result) && result[0] && result[0].generated_text ? result[0].generated_text : (result.generated_text || JSON.stringify(result));
    console.log("aiText (first 1000 chars):\n", aiText && aiText.toString().slice(0, 1000));
    return aiText;
  } catch (err) {
    console.error("request failed:", err);
  }
}
// Example usage
analyzeImage();
