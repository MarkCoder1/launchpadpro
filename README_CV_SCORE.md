# CV Score Checker

This project includes a full-featured CV Score Checker integrated in the Dashboard > CV Builder.

Features:
- Upload PDF/DOCX or paste resume text
- Provide a Job Description
- Analyze and score: Keyword Match, Structure, Grammar & Clarity, Experience Relevance, Design & Layout
- Weighted total score with detailed suggestions and charts
- Download the report as a PDF

## Where to find it
- Frontend: `components/dashboard/CVScoreChecker.tsx` (rendered from `components/dashboard/CVBuilder.tsx`)
- API: `app/api/cv/score/route.ts`
- Helpers: `lib/cvscore/*`
- Types: `types/cvscore.ts`

## Environment
Groq-powered LLM features (set `GROQ_API_KEY`):
- Grammar & clarity analysis
- Intelligent keyword extraction from Job Description (fallback to heuristic if no key)
- Readability metrics refinement (Flesch, FK Grade, CLI, etc.)
- Structure & formatting score (sections, bullets, header clarity) with fallback to heuristic

If `GROQ_API_KEY` is not set, heuristic fallbacks are used for grammar (baseline score), keyword extraction (token-based), readability (local formulas), and structure (local heuristic).

No special setup is required for PDF/DOCX extraction. Dependencies are already in `package.json` (`pdf-parse`, `mammoth`).

Optional (not required): If you'd like to experiment later with AI vision-based design checks, add `OPENAI_API_KEY` to `.env.local`. The current implementation uses robust text-only design heuristics by default.

## API usage
`POST /api/cv/score` with `multipart/form-data` fields:
- `file`: PDF or DOCX file (optional if `text` is provided)
- `text`: Pasted resume text (optional if `file` is provided)
- `jobDescription`: Required string
- `userSkills`: Optional comma-separated string (e.g., `React, Node, SQL`)

Returns JSON with the full report shape defined in `types/cvscore.ts`.

## Notes
- Design/Layout scoring uses robust text-only heuristics. Vision analysis is left as an extension point.
- Readability and Structure now attempt Groq-enhanced analysis when the API key is present; safe heuristics apply otherwise.
- The linter is strict in this repo; if ESLint blocks build due to pre-existing rules unrelated to this feature, consider running `next build` with the repo's lint settings or temporarily adjusting them.
