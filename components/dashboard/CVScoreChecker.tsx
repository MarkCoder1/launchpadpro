"use client"

import React, { useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Upload, Loader2, Download, BarChart2 } from 'lucide-react'
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
                <div className="text-xs text-muted-foreground">Processed in {report.meta.processingMs} ms (AI: {report.meta.aiProviders?.grammar || 'none'})</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Sections</div>
                <ul className="text-sm list-disc pl-4">
                  {Object.entries(report.sections).map(([k,v]) => (
                    <li key={k} className={v? 'text-green-600' : 'text-muted-foreground'}>
                      {k}: {v? 'yes' : 'no'}
                    </li>
                  ))}
                </ul>
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
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="font-medium mb-2">Keywords</div>
                <div className="text-sm">Coverage: <span className="font-semibold">{report.keywords.coveragePercent}%</span></div>
                {report.keywords.missing.length > 0 && (
                  <div className="text-sm mt-2">
                    <div className="text-muted-foreground mb-1">Missing examples:</div>
                    <div className="flex flex-wrap gap-2">{report.keywords.missing.slice(0, 15).map(k => <span key={k} className="px-2 py-1 text-xs bg-muted rounded break-words">{k}</span>)}</div>
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
                <ul className="list-disc pl-4 text-sm">
                  {report.categories.designLayout.suggestions.map((s, i) => <li key={i} className="break-words">{s}</li>)}
                </ul>
              </div>
            </div>

            <div className="p-4 border rounded">
              <div className="font-medium mb-2">Experience & Skills Relevance</div>
              <ul className="list-disc pl-4 text-sm">
                {report.categories.experienceRelevance.reasons.map((r, i) => <li key={i} className="break-words">{r}</li>)}
                {report.categories.experienceRelevance.suggestions.map((s, i) => <li key={`s-${i}`} className="break-words">{s}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CVScoreChecker
