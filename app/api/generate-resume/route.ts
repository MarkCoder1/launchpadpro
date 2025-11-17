import { NextRequest, NextResponse } from 'next/server'
import { polishResume } from '../../../lib/aiResume'
import { buildResumeHTML } from '../../../lib/resumeTemplate'
import type { ResumeStyle } from '../../../types/resume'
import { htmlToPDFBuffer } from '../../../lib/pdf'
import type { ResumeData } from '../../../types/resume'

export const runtime = 'nodejs'

// POST /api/generate-resume
// Body: ResumeData JSON (see types)
// Query: ?download=true to force Content-Disposition attachment
export async function POST(req: NextRequest) {
try {
    const start = Date.now()
    const url = new URL(req.url)
    const forceDownload = url.searchParams.get('download') === 'true'
    const debugMode = url.searchParams.get('debug') === 'true'

    console.debug('[generate-resume] request url:', req.url)
    console.debug('[generate-resume] query:', Object.fromEntries(url.searchParams.entries()))
    const body = await req.json()
    console.debug('[generate-resume] raw body type:', typeof body)

    // Basic validation with more detailed error messages for debugging
    const validationErrors: string[] = []
    if (!body) validationErrors.push('body is empty')
    if (!body?.personalInfo) validationErrors.push('missing personalInfo')
    if (!Array.isArray(body?.education)) validationErrors.push('education is not an array')
    if (!Array.isArray(body?.workExperience)) validationErrors.push('workExperience is not an array')

    if (validationErrors.length > 0) {
        console.warn('[generate-resume] validation failed:', validationErrors)
        return NextResponse.json(
            { error: 'Invalid resume data', details: validationErrors },
            { status: 400 }
        )
    }

    const data = body as ResumeData
    console.debug(
        '[generate-resume] incoming resume for:',
        (data.personalInfo?.firstName || '') + ' ' + (data.personalInfo?.lastName || '')
    )

    // 1) AI polish - choose provider-specific model correctly
    const aiProvider = (process.env.AI_PROVIDER as any) || 'huggingface'
    let aiModel: string | undefined
    if (aiProvider === 'huggingface') {
        aiModel = process.env.HF_MODEL || process.env.HUGGINGFACE_MODEL_ID || process.env.HF_MODEL_ID
    } else if (aiProvider === 'groq') {
        aiModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    }
    console.debug('[generate-resume] AI provider:', aiProvider, 'model:', aiModel)

    const t1 = Date.now()
    const polished = await polishResume(data, {
        provider: aiProvider,
        model: aiModel,
    })
    const t2 = Date.now()
    console.debug('[generate-resume] polishResume completed in', t2 - t1, 'ms')

    // Debug mode: return polished JSON instead of PDF for inspection
    if (debugMode) {
        // report timings and sizes for debugging
        const polishedJson = JSON.stringify(polished || {})
        const htmlPreview = buildResumeHTML(polished)
        const debugInfo = {
            timings: {
                start,
                polishMs: t2 - t1,
                totalMs: Date.now() - start,
            },
            provider: aiProvider,
            model: aiModel,
            polishedSize: polishedJson.length,
            htmlPreviewLength: htmlPreview.length,
            samplePersonalInfo: {
                firstName: polished?.personalInfo?.firstName,
                lastName: polished?.personalInfo?.lastName,
            },
        }
        console.debug('[generate-resume] debug info:', debugInfo)
        return NextResponse.json({ polished, debug: debugInfo }, { status: 200 })
    }

    // 2) HTML template
    const t3 = Date.now()
    const style: ResumeStyle = (data.templateStyle as ResumeStyle) || 'classic'
    const html = buildResumeHTML(polished, style)
    const t4 = Date.now()
    console.debug('[generate-resume] buildResumeHTML completed in', t4 - t3, 'ms', 'html length:', html.length)

    // 3) PDF buffer
    const t5 = Date.now()
    const pdf = await htmlToPDFBuffer(html, { format: 'A4', printBackground: true })
    const t6 = Date.now()
    console.debug('[generate-resume] htmlToPDFBuffer completed in', t6 - t5, 'ms')

    const filename = `${safeFileName(polished.personalInfo.firstName + '-' + polished.personalInfo.lastName)}-resume.pdf`
    const bytes = new Uint8Array(pdf)
    const totalMs = Date.now() - start

    console.info(
        `[generate-resume] generated PDF for ${polished.personalInfo?.firstName} ${polished.personalInfo?.lastName}: bytes=${bytes.length} totalMs=${totalMs}`
    )

    return new NextResponse(bytes, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': String(bytes.length),
            'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
            'Cache-Control': 'no-store',
            'X-Generate-Duration': String(totalMs),
            'X-Polish-Duration': String(t2 - t1),
            'X-Render-Duration': String(t4 - t3),
            'X-Pdf-Duration': String(t6 - t5),
        },
    })
} catch (err: any) {
    const url = new URL(req.url)
    console.error('[generate-resume] error:', err)
    // Only include stack in response when debug flag is set
    const debugMode = url.searchParams.get('debug') === 'true'
    const payload: any = { error: err?.message || 'Failed to generate resume' }
    if (debugMode && err?.stack) payload.stack = err.stack.split('\n').slice(0, 10)
    return NextResponse.json(payload, { status: 500 })
}
}

function safeFileName(s: string) {
  return (s || 'resume').toLowerCase().replace(/[^a-z0-9-_]+/g, '-')
}
