AI Resume Builder (Next.js backend)
=================================

This folder contains a small backend implementation that accepts user resume JSON, calls a Hugging Face model to polish/rewrite the resume, embeds the AI text into an HTML template, and returns a generated PDF.

Files added
- `app/api/generate-resume/route.ts` — POST API route that accepts JSON and returns a PDF.
- `lib/aiResume.ts` — AI helper. Supports Groq (free) or Hugging Face Inference API.
- `lib/resumeTemplate.ts` — simple HTML resume template generator.
- `lib/pdf.ts` — uses Puppeteer to render HTML into a PDF buffer.
- `types/resume.ts` — TypeScript types for the resume schema.
- `.env.example` — sample env variables (Groq and Hugging Face).

Install
-------
Dependencies already include `puppeteer` and `@huggingface/inference`. Just run:

```powershell
cd D:\NextJS\launchpadpro
npm install
```

Environment
-----------
Copy `.env.example` to `.env.local` (Next.js will load `.env.local`). You can use either Groq (recommended free) or Hugging Face.

Example `.env.local` (Groq):

```
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
```

Or (Hugging Face):

```
AI_PROVIDER=huggingface
HF_API_KEY=hf_your_token_here
HF_MODEL=HuggingFaceH4/zephyr-7b-beta
```

Notes on models
---------------
- Groq: `llama-3.1-8b-instant` is a good default and fast. You can also try `llama-3.1-70b-versatile` if your quota allows.
- Hugging Face: Some models are gated or unavailable via the Inference API and will return HTTP 410. Try public instruct models like `HuggingFaceH4/zephyr-7b-beta` or `mistralai/Mistral-7B-Instruct-v0.3`.

Usage
-----
Start the dev server:

```powershell
npm run dev
```

Send a POST request with JSON body matching the schema to `/api/generate-resume`. The endpoint returns a PDF stream. Add `?download=true` to force download.

PowerShell example:

```powershell
$json = Get-Content .\example_user.json -Raw
Invoke-WebRequest -Method Post -Uri "http://localhost:3000/api/generate-resume?download=true" -ContentType 'application/json' -Body $json -OutFile resume.pdf
```

curl example:

```bash
curl -X POST "http://localhost:3000/api/generate-resume?download=true" \
  -H "Content-Type: application/json" \
  -d @example_user.json --output resume.pdf
```

Troubleshooting
---------------
- If the response is HTML or 410 with Hugging Face: use a public model or switch to Groq provider.
- Puppeteer errors on some environments may require system packages (fonts, libX11). On Windows/macOS, defaults generally work.
- If you deployed to a serverless host, consider `puppeteer-core` + a compatible chromium binary. This setup targets local Node runtime.

Security
--------
- Keep your `HF_API_KEY` secret. Do not commit `.env.local`.
- Keep your `GROQ_API_KEY` secret as well.
