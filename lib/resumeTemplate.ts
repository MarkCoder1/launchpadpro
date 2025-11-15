import type { PolishedResume } from '../types/resume'

// Basic clean HTML template. Keep inline CSS for portability in headless Chrome.
export function buildResumeHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' · ')
  const skillsLine = (data as any).skillsLine as string | undefined
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as any).achievementsPolished || data.achievements || []
  const projects = (data as any).projectsPolished || data.projects || []
  const skills = Array.isArray((data as any).skills) ? (data as any).skills : []
  const groupedSkills = groupSkillsByCategory(skills)

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullName)} - Resume</title>
    <style>
  /* Further reduced outer margin for denser layout; inner PDF margins handled by Puppeteer */
  body { font-family: Arial, Helvetica, sans-serif; margin: 6px 10px; color: #111; line-height: 1.30; font-size: 12.2px; }
      h1 { font-size: 22px; margin: 0 0 2px; }
      h2 { font-size: 11.8px; text-transform: uppercase; letter-spacing: .08em; color: #333; margin: 8px 0 0; border-bottom: 0.5px solid #cfcfcf; padding-bottom: 2px; }
      .title { font-weight: 700; color: #222; }
      .muted { color: #555; }
      .section { margin-top: 8px; }
      .section-content { margin-left: 10px; margin-top: 3px; }
      p { margin: 0; }
      ul { margin: 2px 0 0 16px; padding: 0; }
      li { margin: 2px 0; }
      .exp-header { font-weight: 700; }
      .line { margin-top: 1px; }
      .meta { color: #555; }
      .spacer { height: 4px; }
      @media print { a { color: black !important; text-decoration: none } }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(fullName)}</h1>
      ${p.title ? `<div class="title">${escapeHtml(p.title)}</div>` : ''}
      <div class="muted">${escapeHtml(contact)}</div>
    </header>

  ${p.summary ? `<section class="section"><h2>Summary</h2><div class="section-content"><p>${escapeHtml(normalizeWhitespace(p.summary))}</p></div></section>` : ''}

  ${renderSkillsSection(groupedSkills, skillsLine)}

    ${work.length ? `<section class="section"><h2>Experience</h2>
      <div class="section-content">${work.map(w => renderExperience(w)).join('<div class="spacer"></div>')}</div>
    </section>` : ''}

    ${education.length ? `<section class="section"><h2>Education</h2>
      <div class="section-content">${education.map(e => renderEducation(e)).join('<div class="spacer"></div>')}</div>
    </section>` : ''}

    ${Array.isArray(achievements) && achievements.length ? `<section class="section"><h2>Achievements</h2>
      <div class="section-content"><ul>${(achievements as any[]).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></div>
    </section>` : ''}

    ${Array.isArray(projects) && projects.length ? `<section class="section"><h2>Projects</h2>
      <div class="section-content">${projects.map(pr => renderProject(pr)).join('')}</div>
    </section>` : ''}

  </body>
  </html>`
}

function renderExperience(w: any): string {
  const title = [w.position, w.company].filter(Boolean).map(escapeHtml).join(' · ')
  const dates = [w.startDate, w.endDate || (w.current ? 'Present' : '')].filter(Boolean).join(' – ')
  const metaLine = [dates, w.location].filter(Boolean).map(escapeHtml).join(' · ')
  const rawBullets = Array.isArray(w.bullets) ? w.bullets : sentenceSplit(w.description)
  const bullets = (rawBullets || []).map((b:any)=>String(b)).filter(Boolean)
  return `<div>
    <div class="exp-header">${title}</div>
    ${metaLine ? `<div class="meta line">${metaLine}</div>` : ''}
    ${bullets.length ? `<ul>${bullets.map((b: any) => `<li>${escapeHtml(String(b))}</li>`).join('')}</ul>` : ''}
  </div>`
}

function renderEducation(e: any): string {
  const title = `${escapeHtml(e.degree || '')}${e.field ? ' — ' + escapeHtml(e.field) : ''}`
  const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
  const bullets = Array.isArray(e.bullets) ? e.bullets : sentenceSplit(e.description)
  return `<div>
    <div><strong>${escapeHtml(e.institution || '')}</strong></div>
    ${title ? `<div class="muted line">${title}</div>` : ''}
    ${dates ? `<div class="meta line">${escapeHtml(dates)}</div>` : ''}
    ${bullets && bullets.length ? `<ul>${bullets.map((b: any) => `<li>${escapeHtml(String(b))}</li>`).join('')}</ul>` : ''}
  </div>`
}

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function capitalize(s?: string) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function groupSkillsByCategory(skills: any[]) {
  const map = new Map<string, { name: string, level?: string }[]>()
  for (const s of skills) {
    const cat = (s?.category || 'Other').toString()
    const arr = map.get(cat) || []
    arr.push({ name: s?.name || '', level: s?.level })
    map.set(cat, arr)
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
}

function renderSkillsSection(groups: { category: string, items: { name: string, level?: string }[] }[], fallbackLine?: string) {
  if ((!groups || groups.length === 0) && !fallbackLine) return ''
  if (!groups || groups.length === 0) {
    return `<section class="section"><h2>Skills</h2><div class="section-content"><p>${escapeHtml(fallbackLine || '')}</p></div></section>`
  }
  const content = groups.map(g => {
    const items = g.items
      .filter(i => i.name)
      .map(i => `${escapeHtml(i.name)}${i.level ? ` (${escapeHtml(i.level)})` : ''}`)
      .join(', ')
    return `<div><strong>${escapeHtml(g.category)}</strong>: ${items}</div>`
  }).join('')
  return `<section class="section"><h2>Skills</h2><div class="section-content">${content}</div></section>`
}

function renderProject(p: any): string {
  if (!p) return ''
  if (typeof p === 'string') return `<div>• ${escapeHtml(p)}</div>`
  const name = p.name ? `<strong>${escapeHtml(p.name)}</strong>` : ''
  const techs = p.technologies ? escapeHtml(p.technologies) : ''
  const link = p.url ? escapeHtml(p.url) : ''
  const headerParts = [name]
  if (techs) headerParts.push(techs)
  if (link) headerParts.push(link.replace(/^https?:\/\//,'').replace(/\/$/,''))
  const headerLine = headerParts.filter(Boolean).join(' | ')
  // Split description into sentences and turn into bullet points
  const descBullets = sentenceSplit(p.description).map(d => d.trim()).filter(Boolean)
  // If achievements array exists, append those as additional bullets
  const achBullets = Array.isArray(p.achievements) ? p.achievements.map((a:any)=> typeof a === 'string' ? a : (a.description || a.title || '')).filter(Boolean) : []
  const allBullets = [...descBullets, ...achBullets]
  const bulletsHtml = allBullets.length ? `<ul>${allBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''
  return `<div><div>${headerLine}</div>${bulletsHtml}</div>`
}

function sentenceSplit(s?: string) {
  if (!s) return []
  const cleaned = s.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const parts = cleaned.split(/(?<=[.!?])\s+/)
  return parts.filter(Boolean)
}

function normalizeWhitespace(s?: string) {
  if (!s) return ''
  return s.replace(/\s+/g, ' ').trim()
}
