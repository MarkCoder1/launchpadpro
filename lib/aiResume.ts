import { HfInference } from '@huggingface/inference'
// Using relative path to avoid path alias issues
import type { ResumeData, PolishedResume, Provider } from '../types/resume'
import { jsonrepair } from 'jsonrepair'

// Simple section prompts to improve each set of fields.
// We keep prompts short to reduce token usage for free tiers.
const SECTION_PROMPTS: Record<string, (data: any) => string> = {
  summary: (d) => `Rewrite this resume professional summary in a concise, energetic style (<= 60 words). If empty, propose one based on title, skills, and experience context. Output plain text only. Data: ${JSON.stringify({title: d.personalInfo?.title, skills: d.skills, experience: d.workExperience?.map((w:any)=>({position:w.position, company:w.company}))})}`,
  skills: (d) => `From the provided skills, return a single comma-separated line of the most relevant skills (<= 25 items). Output plain text only. Data: ${JSON.stringify(d.skills)}`,
  achievements: (d) => `Polish achievements into concise resume bullets (max 5). Output JSON array of strings. Data: ${JSON.stringify(d.achievements)}`,
  projects: (d) => `Summarize projects with impact, stack, and role. Output JSON array of strings. Data: ${JSON.stringify(d.projects)}`,
}

interface AIOptions {
  provider?: Provider
  model?: string
}

// Attempts to parse JSON; if fails returns trimmed text.
function safeJSONParse<T=any>(text: string): T | string {
  try { return JSON.parse(text) } catch { return text.trim() }
}

export async function polishResume(data: ResumeData, options: AIOptions = {}): Promise<PolishedResume> {
  const provider: Provider = options.provider || 'huggingface'
  if (provider === 'huggingface') {
    return polishWithHuggingFace(data, options)
  }
  if (provider === 'groq') {
    return polishWithGroq(data, options)
  }
  // default fallback
  return polishWithHuggingFace(data, options)
}

async function callHF(prompt: string, model?: string): Promise<string> {
  const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY
  if (!apiKey) throw new Error('Missing HF_API_KEY/HUGGINGFACE_API_KEY')
  const inference = new HfInference(apiKey)
  const modelId = model || process.env.HF_MODEL || process.env.HUGGINGFACE_MODEL_ID || 'gpt2'
  // Using textGeneration for simplicity; for instruct models, textGeneration works with plain prompts.
  const res = await inference.textGeneration({
    model: modelId,
    inputs: prompt,
    parameters: {
      max_new_tokens: 256,
      temperature: 0.7,
    }
  })
  // API returns { generated_text }
  // Some models echo prompt – remove prompt prefix if present
  const out = (res as any).generated_text || ''
  const cleaned = out.startsWith(prompt) ? out.slice(prompt.length) : out
  return cleaned.trim()
}

async function polishWithHuggingFace(data: ResumeData, options: AIOptions): Promise<PolishedResume> {
  const errors: string[] = []
  const polished: any = { ...data }
  // Summary
  try {
    const raw = await callHF(SECTION_PROMPTS.summary(data), options.model)
    if (raw) polished.personalInfo.summary = raw
  } catch (e:any) { errors.push(`summary: ${e?.message || e}`) }
  // Experience bullets (per item)
  try {
    const exps = await Promise.all((data.workExperience || []).map(async (w) => {
      try {
        const prompt = `Rewrite this single work experience into 3-5 quantified, action-oriented bullets. Output JSON array of strings. Data: ${JSON.stringify(w)}`
        const raw = await callHF(prompt, options.model)
        const bullets = safeJSONParse<string[] | string>(raw)
        return { ...w, bullets }
      } catch (e:any) {
        errors.push(`experience(${w.company || w.position || ''}): ${e?.message || e}`)
        return { ...w }
      }
    }))
    polished.workExperience = exps
  } catch (e:any) { errors.push(`experience: ${e?.message || e}`) }
  // Education bullets (per item)
  try {
    const eds = await Promise.all((data.education || []).map(async (ed) => {
      try {
        const prompt = `Create 1-3 concise bullets highlighting achievements or focus areas for this education entry. Output JSON array of strings. Data: ${JSON.stringify(ed)}`
        const raw = await callHF(prompt, options.model)
        const bullets = safeJSONParse<string[] | string>(raw)
        return { ...ed, bullets }
      } catch (e:any) {
        errors.push(`education(${ed.institution || ''}): ${e?.message || e}`)
        return { ...ed }
      }
    }))
    polished.education = eds
  } catch (e:any) { errors.push(`education: ${e?.message || e}`) }
  // Skills line
  try {
    const raw = await callHF(SECTION_PROMPTS.skills(data), options.model)
    polished.skillsLine = raw
  } catch (e:any) { errors.push(`skills: ${e?.message || e}`) }
  // Achievements
  try {
    if (data.achievements?.length) {
      const raw = await callHF(SECTION_PROMPTS.achievements(data), options.model)
      polished.achievementsPolished = safeJSONParse(raw)
    }
  } catch (e:any) { errors.push(`achievements: ${e?.message || e}`) }
  // Projects
  try {
    if (data.projects?.length) {
      const raw = await callHF(SECTION_PROMPTS.projects(data), options.model)
      polished.projectsPolished = safeJSONParse(raw)
    }
  } catch (e:any) { errors.push(`projects: ${e?.message || e}`) }
  polished.meta = {
    model: options.model || process.env.HF_MODEL || process.env.HUGGINGFACE_MODEL_ID,
    provider: 'huggingface',
    polishedAt: new Date().toISOString(),
    errors: errors.length ? errors : undefined,
  }
  return polished
}

async function polishWithGroq(data: ResumeData, options: AIOptions): Promise<PolishedResume> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Missing GROQ_API_KEY for Groq provider')
  const model = options.model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  // Strong instruction to prefer JSON without markdown, but we will also sanitize just in case.
  const system = `You are a resume writing assistant. Improve resume content: summary, per-experience bullet points (3-5 each, quantified), education bullets, grouped skills (comma separated), polished projects and achievements. IMPORTANT: Return ONLY a single JSON object following the provided schema. DO NOT include code fences, markdown, or any explanatory text. If a field has no data, enrich it sensibly.`
  const user = JSON.stringify(data)

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      // Avoid strict JSON enforcement errors; we'll parse/repair client-side
      max_tokens: 1200,
    })
  })
  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Groq API error ${resp.status}: ${txt}`)
  }
  const json = await resp.json()
  const content: string = json.choices?.[0]?.message?.content || ''
  // Sanitize possible markdown fences or preambles
  const unfenced = stripCodeFences(content).trim()
  const jsonText = extractJSONObjectText(unfenced)
  let parsed: any | null = null
  if (jsonText) {
    try { parsed = JSON.parse(jsonrepair(jsonText)) } catch { parsed = null }
  }
  const polished: any = { ...data }
  // If we parsed a JSON object, merge data back
  if (parsed && typeof parsed === 'object') {
    if (parsed.personalInfo?.summary) {
      polished.personalInfo = { ...polished.personalInfo, summary: sanitizeSummary(parsed.personalInfo.summary) }
    } else {
      // Try to salvage a plain summary from the cleaned content
      const fallback = extractSummaryFromText(unfenced)
      if (fallback) polished.personalInfo.summary = sanitizeSummary(fallback)
    }
    // Merge experience bullets if present
    if (Array.isArray(parsed.workExperience)) {
      polished.workExperience = (polished.workExperience || []).map((w: any, i: number) => {
        const src = parsed.workExperience[i]
        if (src?.bullets && Array.isArray(src.bullets)) return { ...w, bullets: src.bullets }
        if (Array.isArray(src?.description)) return { ...w, bullets: src.description }
        return w
      })
    }
    // Merge education bullets
    if (Array.isArray(parsed.education)) {
      polished.education = (polished.education || []).map((e: any, i: number) => {
        const src = parsed.education[i]
        if (src?.bullets && Array.isArray(src.bullets)) return { ...e, bullets: src.bullets }
        if (Array.isArray(src?.description)) return { ...e, bullets: src.description }
        return e
      })
    }
    // If skills were returned as a string line, capture it; else build from array in input
    if (typeof parsed.skills === 'string') {
      polished.skillsLine = parsed.skills
    }
    if (!polished.skillsLine) {
      const arr = Array.isArray(data.skills) ? data.skills : []
      const names = arr.map((s:any)=>s?.name).filter(Boolean)
      if (names.length) polished.skillsLine = names.join(', ')
    }
    // Optional projects/achievements
    if (Array.isArray(parsed.projects)) polished.projectsPolished = parsed.projects
    if (Array.isArray(parsed.achievements)) polished.achievementsPolished = parsed.achievements
  } else {
    // Could not parse JSON; salvage summary and build minimum viable polish
    const fallback = extractSummaryFromText(unfenced) || unfenced
    polished.personalInfo.summary = sanitizeSummary(fallback)
    const arr = Array.isArray(data.skills) ? data.skills : []
    const names = arr.map((s:any)=>s?.name).filter(Boolean)
    if (names.length) polished.skillsLine = names.join(', ')
  }
  const result: PolishedResume = {
    ...polished,
    meta: { provider: 'groq', model, polishedAt: new Date().toISOString() }
  }
  // Always refine summary with a focused prompt for specificity
  try {
    const refined = await groqGenerateSummary(data, apiKey, model)
    if (refined) result.personalInfo.summary = sanitizeSummary(refined)
  } catch {}

  // Generate bullets per experience using Groq to avoid generic descriptions
  try {
    if (Array.isArray(result.workExperience)) {
      const updated = [] as any[]
      for (const w of result.workExperience) {
        try {
          const bullets = await groqExperienceBullets(w, apiKey, model)
          updated.push({ ...w, bullets })
        } catch {
          updated.push(w)
        }
      }
      result.workExperience = updated
    }
  } catch {}

  // Generate concise bullets for education entries
  try {
    if (Array.isArray(result.education)) {
      const updated = [] as any[]
      for (const e of result.education) {
        try {
          const bullets = await groqEducationBullets(e, apiKey, model)
          updated.push({ ...e, bullets })
        } catch {
          updated.push(e)
        }
      }
      result.education = updated
    }
  } catch {}

  // Do not hallucinate achievements if user provided none
  if (!Array.isArray(data.achievements) || data.achievements.length === 0) {
    if (Array.isArray((result as any).achievementsPolished) && (result as any).achievementsPolished.length > 0) {
      delete (result as any).achievementsPolished
    }
  }
  return result
}

// Helpers to clean and extract usable content from Groq outputs
function stripCodeFences(s: string): string {
  if (!s) return ''
  // Remove triple backtick fences with optional language
  return s.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '$1')
}

function extractJSONObjectText(s: string): string | null {
  if (!s) return null
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return s.slice(start, end + 1)
}

function extractSummaryFromText(s: string): string | null {
  if (!s) return null
  // If the text contains a JSON-like "summary": "..." capture it
  const m = s.match(/"summary"\s*:\s*"([\s\S]*?)"/)
  if (m) return m[1]
  // else try to take the first two sentences from plain text
  const cleaned = s.replace(/\s+/g, ' ').trim()
  const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')
  return sentences || cleaned.slice(0, 300)
}

function sanitizeSummary(s: string): string {
  if (!s) return ''
  let out = stripCodeFences(String(s))
  out = out.replace(/^here\'s[^:]*:\s*/i, '')
  out = out.replace(/^here is[^:]*:\s*/i, '')
  out = out.replace(/^the following[^:]*:\s*/i, '')
  out = out.replace(/\s+/g, ' ').trim()
  // Limit to ~70 words
  const words = out.split(' ')
  if (words.length > 70) out = words.slice(0,70).join(' ')
  return out
}

// ===== Groq helpers for targeted generations =====
async function groqChat(messages: { role: 'system'|'user'|'assistant', content: string }[], apiKey: string, model: string) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: 600 })
  })
  if (!resp.ok) throw new Error(`Groq chat error ${resp.status}: ${await resp.text()}`)
  const json = await resp.json()
  return json.choices?.[0]?.message?.content || ''
}

async function groqGenerateSummary(data: ResumeData, apiKey: string, model: string) {
  const p = data.personalInfo
  const firstExp = (data.workExperience || [])[0]
  const sys = 'You refine resume summaries. Keep it specific to the candidate, avoid generic clichés, <= 55 words, no headings.'
  const usr = JSON.stringify({
    title: p?.title,
    providedSummary: p?.summary,
    keyExp: firstExp ? { position: firstExp.position, company: firstExp.company, description: firstExp.description } : null,
    skills: (data.skills||[]).map((s:any)=>s?.name).filter(Boolean).slice(0,10)
  })
  const text = await groqChat([
    { role: 'system', content: sys },
    { role: 'user', content: `Rewrite this into a sharp resume summary: ${usr}` }
  ], apiKey, model)
  return stripCodeFences(text).trim()
}

async function groqExperienceBullets(w: any, apiKey: string, model: string): Promise<string[]> {
  const sys = 'You create quantified, action-oriented resume bullets (3-5) strictly as a JSON array of strings. No markdown.'
  const usr = JSON.stringify(w)
  const text = await groqChat([
    { role: 'system', content: sys },
    { role: 'user', content: `From this single experience, output bullets: ${usr}` }
  ], apiKey, model)
  const cleaned = stripCodeFences(text)
  let arr: any
  try { arr = JSON.parse(jsonrepair(extractJSONObjectText(cleaned) || cleaned)) } catch { arr = null }
  if (Array.isArray(arr)) return arr.map(String)
  // fallback: split lines
  return cleaned.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,5)
}

async function groqEducationBullets(e: any, apiKey: string, model: string): Promise<string[]> {
  const sys = 'You produce 1-2 concise education bullets focusing on achievements or focus areas, JSON array only.'
  const usr = JSON.stringify(e)
  const text = await groqChat([
    { role: 'system', content: sys },
    { role: 'user', content: `From this education entry, output bullets: ${usr}` }
  ], apiKey, model)
  const cleaned = stripCodeFences(text)
  let arr: any
  try { arr = JSON.parse(jsonrepair(extractJSONObjectText(cleaned) || cleaned)) } catch { arr = null }
  if (Array.isArray(arr)) return arr.map(String).slice(0,2)
  return cleaned.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,2)
}
