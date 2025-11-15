// Simple Node test script to exercise the /api/generate-resume endpoint.
// Usage (PowerShell):
//   node .\scripts\test-generate-resume.mjs --pdf
//   node .\scripts\test-generate-resume.mjs --debug
// Optional: pass a custom file: --file example_user.json
// Will output resume.pdf (for --pdf) or polished.json (for --debug)

import fs from 'fs'
import path from 'path'
import http from 'http'

const args = process.argv.slice(2)
const wantPDF = args.includes('--pdf')
const wantDebug = args.includes('--debug')
const fileArg = args.find(a => a.startsWith('--file='))
const fileName = fileArg ? fileArg.split('=')[1] : 'example_user.json'
const filePath = path.resolve(process.cwd(), fileName)

if (!fs.existsSync(filePath)) {
  console.error(`Input file not found: ${filePath}`)
  process.exit(1)
}

const json = fs.readFileSync(filePath, 'utf8')

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
const endpoint = `/api/generate-resume${wantDebug ? '?debug=true' : (wantPDF ? '?download=true' : '')}`

function main() {
  console.log(`→ POST ${baseUrl}${endpoint}`)
  const req = http.request(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json)
    }
  }, (res) => {
    console.log(`Status: ${res.statusCode}`)
    const ctype = res.headers['content-type']
    if (ctype) console.log(`Content-Type: ${ctype}`)
    const chunks = []
    res.on('data', d => chunks.push(d))
    res.on('end', () => {
      const buffer = Buffer.concat(chunks)
      if (wantDebug) {
        const out = 'polished.json'
        fs.writeFileSync(out, buffer)
        console.log(`✔ Polished JSON saved: ${out}`)
        try {
          const parsed = JSON.parse(buffer.toString())
          const obj = parsed.polished || parsed // API returns { polished, debug }
          const dbg = parsed.debug || {}
          console.log('summary:', obj.personalInfo?.summary)
          console.log('skillsLine:', obj.skillsLine)
          console.log('provider/model:', obj.meta?.provider, obj.meta?.model)
          if (obj.meta?.errors) console.log('errors:', obj.meta.errors)
          if (dbg.timings) console.log('timings(ms):', dbg.timings)
        } catch (e) {
          console.warn('Could not parse JSON response:', e.message)
        }
      } else if (wantPDF) {
        if (res.statusCode !== 200 || !String(ctype || '').includes('application/pdf')) {
          const out = 'error.json'
          fs.writeFileSync(out, buffer)
          console.error(`✖ Expected PDF but got status=${res.statusCode} content-type=${ctype}. Saved body to ${out}`)
          try { console.error('Body:', buffer.toString().slice(0, 800)) } catch {}
          process.exit(1)
        }
        const out = 'resume.pdf'
        fs.writeFileSync(out, buffer)
        console.log(`✔ PDF saved: ${out} (${buffer.length} bytes)`) 
      } else {
        console.log(buffer.toString())
      }
    })
  })
  req.on('error', (err) => {
    console.error('Request error:', err.message)
    process.exit(1)
  })
  req.write(json)
  req.end()
}

main()
