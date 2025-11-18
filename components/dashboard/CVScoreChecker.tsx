"use client"

import React, { useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Upload, Loader2, Download, BarChart2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { CVScoreApiResponse, CVScoreReport } from '../../types/cvscore'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const CVScoreChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [userSkills, setUserSkills] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<CVScoreReport | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)
    const [showRaw, setShowRaw] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const onSubmit = async () => {
    setError(null)
    setLoading(true)
    setReport(null)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      if (!file && text.trim()) fd.append('text', text.trim())
      fd.append('jobDescription', jobDescription.trim())
      if (userSkills.trim()) fd.append('userSkills', userSkills)

      const res = await fetch('/api/cv/score', { method: 'POST', body: fd })
      const json = (await res.json()) as CVScoreApiResponse
      if (!res.ok || !json || (json as { ok?: boolean }).ok === false) {
        const errMsg = (json as { error?: string })?.error || `Failed to score CV (HTTP ${res.status})`
        throw new Error(errMsg)
      }
      if ('report' in json && json.ok) setReport(json.report)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    if (!report) return null
    return {
      labels: ['Keyword Match', 'Structure', 'Grammar', 'Relevance', 'Design'],
      datasets: [
        {
          label: 'Score',
          data: [
            report.categories.keywordMatch.score,
            report.categories.structureFormatting.score,
            report.categories.grammarClarity.score,
            report.categories.experienceRelevance.score,
            report.categories.designLayout.score,
          ],
          backgroundColor: ['#0ea5e9', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'],
        },
      ],
    }
  }, [report])

  const downloadPDF = async () => {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
    const imgWidth = canvas.width * ratio
    const imgHeight = canvas.height * ratio
    const x = (pageWidth - imgWidth) / 2
    const y = 20
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    const name = report?.fileName || 'cv-score-report.pdf'
    pdf.save(name)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart2 className="h-5 w-5 mr-2"/> CV Score Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="file">Upload CV (PDF or DOCX)</Label>
              <Input id="file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFile} />
              <div className="text-xs text-muted-foreground">Or paste your resume text below.</div>
              <Label htmlFor="text">Paste Resume Text</Label>
              <textarea id="text" className="w-full min-h-[120px] border rounded p-2" value={text} onChange={e => setText(e.target.value)} placeholder="Paste your resume text here..." />
            </div>
            <div className="space-y-3">
              <Label htmlFor="jd">Job Description (required)</Label>
              <textarea id="jd" className="w-full min-h-[180px] border rounded p-2" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description here..." />
              <Label htmlFor="skills">Your Skills (comma-separated)</Label>
              <Input id="skills" value={userSkills} onChange={e => setUserSkills(e.target.value)} placeholder="e.g., React, Node.js, SQL, Docker" />
              <Button onClick={onSubmit} disabled={loading || (!file && !text.trim()) || !jobDescription.trim()} className="w-full">
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Scoring...</>) : (<><Upload className="mr-2 h-4 w-4"/> Analyze CV</>)}
              </Button>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card ref={reportRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Score Report</span>
              <Button variant="outline" onClick={downloadPDF}><Download className="h-4 w-4 mr-2"/> Download PDF</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Total Score</div>
                <div className="text-3xl font-bold">{report.total}</div>
                <div className="text-xs text-muted-foreground">Weighted: keywords {report.weights.keywordMatch}%, structure {report.weights.structureFormatting}%, grammar {report.weights.grammarClarity}%, relevance {report.weights.experienceRelevance}%, design {report.weights.designLayout}%</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Input</div>
                <div className="text-sm">Type: <span className="font-medium uppercase">{report.inputType}</span></div>
                {report.fileName && <div className="text-sm break-words">File: {report.fileName}</div>}
                <div className="text-xs text-muted-foreground">Processed in {report.meta.processingMs} ms • Vision: {report.meta.aiProviders?.vision || 'none'}</div>
                {report.meta.createdAt && (
                  <div className="text-xs text-muted-foreground">Generated: {new Date(report.meta.createdAt).toLocaleString()}</div>
                )}
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Sections</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(report.sections).map(([k,v]) => (
                    <span key={k} className={`px-2 py-1 text-xs rounded border ${v? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>{k}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded border overflow-x-auto">
              <div className="min-w-[420px]">
                {chartData && (
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, title: { display: true, text: 'Category Scores' } },
                      scales: { y: { min: 0, max: 100 } },
                    }}
                    height={220}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Keywords</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Coverage: <span className="font-semibold">{report.keywords.coveragePercent}%</span></div>
                  {report.keywords.missing.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(report.keywords.missing.join(', '))
                          setCopiedKey('ALL')
                          setTimeout(() => setCopiedKey(null), 1200)
                        } catch {}
                      }}
                    >
                      {copiedKey === 'ALL' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                    </Button>
                  )}
                </div>
                {report.keywords.present.length > 0 && (
                  <div className="text-sm mt-2">
                    <div className="text-muted-foreground mb-1">Present:</div>
                    <div className="flex flex-wrap gap-2">{report.keywords.present.slice(0, 30).map(k => <span key={k} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded break-words">{k}</span>)}</div>
                  </div>
                )}
                {report.keywords.missing.length > 0 && (
                  <div className="text-sm mt-2">
                    <div className="text-muted-foreground mb-1">Missing examples:</div>
                    <div className="flex flex-wrap gap-2">
                      {report.keywords.missing.slice(0, 30).map(k => (
                        <span key={k} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded break-words">
                          <span>{k}</span>
                          <button
                            type="button"
                            aria-label={`Copy ${k}`}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(k)
                                setCopiedKey(k)
                                setTimeout(() => setCopiedKey(null), 1200)
                              } catch {}
                            }}
                            className="opacity-70 hover:opacity-100"
                          >
                            {copiedKey === k ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Grammar & Clarity</div>
                <div className="text-sm">Score: <span className="font-semibold">{report.categories.grammarClarity.score}</span></div>
                {report.categories.grammarClarity.issues && report.categories.grammarClarity.issues.length > 0 && (
                  <ul className="list-disc pl-4 text-sm mt-2">
                    {report.categories.grammarClarity.issues.slice(0, 8).map((i, idx) => (
                      <li key={idx} className="break-words"><span className="uppercase text-xs text-muted-foreground">{i.type}</span>: {i.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Structure & Formatting</div>
                <ul className="list-disc pl-4 text-sm">
                  {report.categories.structureFormatting.suggestions.map((s, i) => <li key={i} className="break-words">{s}</li>)}
                </ul>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Design & Layout</div>
                <div className="text-xs text-muted-foreground mb-1">Signals: fonts {report.design.fontVariety}, bullets {report.design.bulletUsage}, headers {report.design.hasConsistentHeaders ? 'consistent' : 'inconsistent'}, whitespace {report.design.excessiveWhitespace ? 'excessive' : 'balanced'}, alignment {report.design.alignmentSignals}</div>
                <ul className="list-disc pl-4 text-sm">
                  {report.categories.designLayout.suggestions.map((s, i) => <li key={i} className="break-words">{s}</li>)}
                </ul>
              </div>
            </div>

            {report.recommendations && (
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Recommendations</div>
                {report.recommendations.quickWins && report.recommendations.quickWins.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground mb-1">Quick Wins</div>
                    <ul className="list-disc pl-4 text-sm">
                      {report.recommendations.quickWins.slice(0, 6).map((s, i) => <li key={i} className="break-words">{s}</li>)}
                    </ul>
                  </div>
                )}
                {(report.recommendations.addKeywords?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground mb-1">Add Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {report.recommendations.addKeywords.slice(0, 24).map((k) => (
                        <span key={k} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded">
                          <span>{k}</span>
                          <button
                            type="button"
                            aria-label={`Copy ${k}`}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(k)
                                setCopiedKey(`rec_kw_${k}`)
                                setTimeout(() => setCopiedKey(null), 1200)
                              } catch {}
                            }}
                            className="opacity-70 hover:opacity-100"
                          >
                            {copiedKey === `rec_kw_${k}` ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(report.recommendations.addSections?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground mb-1">Add Sections</div>
                    <div className="flex flex-wrap gap-2">
                      {report.recommendations.addSections.slice(0, 12).map((s) => (
                        <span key={s} className="px-2 py-1 text-xs bg-sky-50 text-sky-800 border border-sky-200 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(report.recommendations.bulletExamples?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Bullet Examples</div>
                    <ul className="list-disc pl-4 text-sm">
                      {report.recommendations.bulletExamples.slice(0, 6).map((b, i) => (
                        <li key={i} className="break-words flex items-start gap-2">
                          <span className="flex-1">{b}</span>
                          <button
                            type="button"
                            aria-label="Copy bullet"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(b)
                                setCopiedKey(`rec_b_${i}`)
                                setTimeout(() => setCopiedKey(null), 1200)
                              } catch {}
                            }}
                            className="opacity-70 hover:opacity-100 mt-[-2px]"
                          >
                            {copiedKey === `rec_b_${i}` ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 border rounded">
              <div className="font-medium mb-2">Experience & Skills Relevance</div>
              <ul className="list-disc pl-4 text-sm">
                {report.categories.experienceRelevance.reasons.map((r, i) => <li key={i} className="break-words">{r}</li>)}
                {report.categories.experienceRelevance.suggestions.map((s, i) => <li key={`s-${i}`} className="break-words">{s}</li>)}
              </ul>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Readability</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>Flesch-Kincaid Grade:</div><div className="font-medium">{report.readability.fleschKincaidGrade ?? '—'}</div>
                  <div>Coleman-Liau Index:</div><div className="font-medium">{report.readability.colemanLiauIndex ?? '—'}</div>
                  <div>Reading Ease:</div><div className="font-medium">{report.readability.readingEase ?? '—'}</div>
                  <div>Avg Sentence Length:</div><div className="font-medium">{report.readability.avgSentenceLength ?? '—'}</div>
                  <div>Complex Sentence Ratio:</div><div className="font-medium">{report.readability.complexSentenceRatio ?? '—'}</div>
                </div>
              </div>
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Extracted Text (preview)</div>
                <div className="text-xs text-muted-foreground mb-1">First 600 chars</div>
                <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-auto border rounded p-2 bg-muted/30">{(report.extractedText || '').slice(0, 600) || '—'}</pre>
              </div>
            </div>

            
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CVScoreChecker
