import type { PolishedResume, ResumeStyle, ResumeData } from '../types/resume'

// Basic clean HTML template. Keep inline CSS for portability in headless Chrome.
export function buildResumeHTML(data: PolishedResume, style: ResumeStyle = 'classic'): string {
  switch (style) {
    case 'modern':
      return buildModernHTML(data)
    case 'minimal':
      return buildMinimalHTML(data)
    case 'elegant':
      return buildElegantHTML(data)
    case 'compact':
      return buildCompactHTML(data)
    case 'creative':
      return buildCreativeHTML(data)
    case 'classic':
    default:
      return buildClassicHTML(data)
  }
}

function buildClassicHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' · ')
  const skillsLine = (data as PolishedResume & { skillsLine?: string }).skillsLine
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
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
      <div class="section-content"><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></div>
    </section>` : ''}

    ${Array.isArray(projects) && projects.length ? `<section class="section"><h2>Projects</h2>
      <div class="section-content">${projects.map(pr => renderProject(pr)).join('')}</div>
    </section>` : ''}

  </body>
  </html>`
}

// A more visual, two-column modern template with accent color
function buildModernHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location].filter(Boolean).join(' · ')
  const links = [p.linkedin, p.website].filter(Boolean).join(' · ')
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const groupedSkills = groupSkillsByCategory(skills)

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullName)} - Resume</title>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; margin: 8px; color: #0f172a; line-height: 1.4; font-size: 12.5px; }
      .grid { display: grid; grid-template-columns: 2.1fr 1fr; gap: 14px; }
      header { border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; }
      h1 { font-size: 26px; margin: 0; letter-spacing: .3px; }
      .subtitle { color: #334155; font-weight: 600; }
      .muted { color: #475569; }
      .chip { display:inline-block; background:#e2e8f0; color:#0f172a; padding:1px 6px; border-radius:9999px; margin: 0 4px 4px 0; }
      h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .14em; color: #0ea5e9; margin: 10px 0 4px; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
      .meta { color:#64748b }
      ul { margin: 4px 0 0 16px; padding: 0; }
      li { margin: 2px 0; }
      .right h3 { margin: 6px 0 2px; font-size: 12.5px; }
    </style>
  </head>
  <body>
    <header>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px;">
        <div>
          <h1>${escapeHtml(fullName)}</h1>
          ${p.title ? `<div class="subtitle">${escapeHtml(p.title)}</div>` : ''}
        </div>
        <div class="muted" style="text-align:right;">
          <div>${escapeHtml(contact)}</div>
          ${links ? `<div>${escapeHtml(links)}</div>` : ''}
        </div>
      </div>
    </header>
    <div class="grid">
      <div>
        ${p.summary ? `<div class="card"><h2>Summary</h2><div>${escapeHtml(normalizeWhitespace(p.summary))}</div></div>` : ''}
        ${work.length ? `<div class="card"><h2>Experience</h2>${work.map(w => renderExperience(w)).join('<div style="height:6px"></div>')}</div>` : ''}
        ${projects.length ? `<div class="card"><h2>Projects</h2>${projects.map(pr => renderProject(pr)).join('')}</div>` : ''}
      </div>
      <div class="right">
        ${education.length ? `<div class="card"><h2>Education</h2>${education.map(e => renderEducation(e)).join('<div style="height:6px"></div>')}</div>` : ''}
        ${renderSkillsCards(groupedSkills)}
        ${Array.isArray(achievements) && achievements.length ? `<div class="card"><h2>Achievements</h2><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>
  </body>
  </html>`
}

function renderSkillsCards(groups: { category: string, items: { name: string, level?: string }[] }[]) {
  if (!groups || !groups.length) return ''
  return `<div class="card"><h2>Skills</h2>${groups.map(g => {
    const chips = g.items.filter(i=>i.name).map(i => `<span class="chip">${escapeHtml(i.name)}${i.level?` · ${escapeHtml(i.level)}`:''}</span>`).join(' ')
    return `<div><h3>${escapeHtml(g.category)}</h3><div>${chips}</div></div>`
  }).join('')}</div>`
}

// Ultra minimal, typographic-first layout
function buildMinimalHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' · ')
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const groupedSkills = groupSkillsByCategory(skills)

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullName)} - Resume</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; margin: 16px 18px; color: #111; line-height: 1.35; font-size: 12.2px; }
      header { text-align:center; margin-bottom: 10px; }
      h1 { font-size: 22px; margin: 0; font-weight: 700; letter-spacing:.3px; }
      .muted { color: #444; }
      h2 { font-size: 12px; margin: 10px 0 6px; font-weight:700; }
      .section { margin-top: 8px; }
      .section-content { margin-top: 2px; }
      ul { margin: 2px 0 0 16px; padding: 0; }
      li { margin: 2px 0; }
      .rule { border-top: 1px solid #ddd; margin: 6px 0; }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(fullName)}</h1>
      ${p.title ? `<div>${escapeHtml(p.title)}</div>` : ''}
      <div class="muted">${escapeHtml(contact)}</div>
      <div class="rule"></div>
    </header>

    ${p.summary ? `<section class="section"><h2>Summary</h2><div class="section-content"><p>${escapeHtml(normalizeWhitespace(p.summary))}</p></div></section>` : ''}
    ${renderSkillsSection(groupedSkills)}
    ${work.length ? `<section class="section"><h2>Experience</h2><div class="section-content">${work.map(w => renderExperience(w)).join('<div style="height:6px"></div>')}</div></section>` : ''}
    ${education.length ? `<section class="section"><h2>Education</h2><div class="section-content">${education.map(e => renderEducation(e)).join('<div style=\"height:6px\"></div>')}</div></section>` : ''}
    ${Array.isArray(achievements) && achievements.length ? `<section class="section"><h2>Achievements</h2><div class="section-content"><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></div></section>` : ''}
    ${Array.isArray(projects) && projects.length ? `<section class="section"><h2>Projects</h2><div class="section-content">${projects.map(pr => renderProject(pr)).join('')}</div></section>` : ''}
  </body>
  </html>`
}

// Elegant: single column with subtle separators, great typography
function buildElegantHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' · ')
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const groupedSkills = groupSkillsByCategory(skills)
  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <title>${escapeHtml(fullName)} - Resume</title>
  <style>
    @page { margin: 14mm }
    body { font-family: 'Georgia', 'Times New Roman', serif; color:#0b0b0b; font-size: 12.3px; }
    header { text-align:center; margin-bottom: 8px; }
    h1 { font-size: 26px; letter-spacing:.4px; margin: 0; }
    .title { font-style: italic; color:#374151 }
    .contact { color:#4b5563 }
    h2 { font-size: 12.2px; text-transform: uppercase; letter-spacing:.18em; color:#111; margin: 10px 0 4px; }
    .rule { height:1px; background: linear-gradient(90deg,#000,transparent); margin: 6px 0 8px; opacity:.15 }
    .section { margin-top: 6px; }
    ul{ margin:2px 0 0 16px; padding:0 } li{ margin:2px 0 }
  </style></head>
  <body>
    <header>
      <h1>${escapeHtml(fullName)}</h1>
      ${p.title ? `<div class="title">${escapeHtml(p.title)}</div>` : ''}
      <div class="contact">${escapeHtml(contact)}</div>
      <div class="rule"></div>
    </header>
    ${p.summary ? `<section class="section"><h2>Summary</h2><div>${escapeHtml(normalizeWhitespace(p.summary))}</div></section>` : ''}
    ${renderSkillsSection(groupedSkills)}
    ${work.length ? `<section class="section"><h2>Experience</h2>${work.map(w => renderExperience(w)).join('<div style="height:5px"></div>')}</section>` : ''}
    ${education.length ? `<section class="section"><h2>Education</h2>${education.map(e => renderEducation(e)).join('<div style="height:5px"></div>')}</section>` : ''}
    ${Array.isArray(achievements) && achievements.length ? `<section class="section"><h2>Achievements</h2><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></section>` : ''}
    ${Array.isArray(projects) && projects.length ? `<section class="section"><h2>Projects</h2>${projects.map(pr => renderProject(pr)).join('')}</section>` : ''}
  </body></html>`
}

// Compact: tight spacing to squeeze into one page
function buildCompactHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(' · ')
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const groupedSkills = groupSkillsByCategory(skills)
  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <title>${escapeHtml(fullName)} - Resume</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 8px 10px; color:#111; line-height:1.18; font-size: 11.6px; }
    h1 { font-size: 20px; margin:0 0 2px }
    h2 { font-size: 11px; text-transform: uppercase; letter-spacing:.1em; margin:6px 0 2px; color:#333 }
    .muted{ color:#555 }
    ul{ margin: 0 0 0 14px; padding:0 } li{ margin:1px 0 }
    .section{ margin-top:6px }
  </style></head>
  <body>
    <header>
      <h1>${escapeHtml(fullName)}</h1>
      ${p.title ? `<div class="muted">${escapeHtml(p.title)}</div>` : ''}
      <div class="muted">${escapeHtml(contact)}</div>
    </header>
    ${p.summary ? `<section class="section"><h2>Summary</h2><div>${escapeHtml(normalizeWhitespace(p.summary))}</div></section>` : ''}
    ${renderSkillsSection(groupedSkills)}
    ${work.length ? `<section class="section"><h2>Experience</h2><div>${work.map(w => renderExperience(w)).join('<div style="height:3px"></div>')}</div></section>` : ''}
    ${education.length ? `<section class="section"><h2>Education</h2><div>${education.map(e => renderEducation(e)).join('<div style="height:3px"></div>')}</div></section>` : ''}
    ${Array.isArray(achievements) && achievements.length ? `<section class="section"><h2>Achievements</h2><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></section>` : ''}
    ${Array.isArray(projects) && projects.length ? `<section class="section"><h2>Projects</h2><div>${projects.map(pr => renderProject(pr)).join('')}</div></section>` : ''}
  </body></html>`
}

// Creative: visual headers and separators; good for portfolios (still ATS-friendly)
function buildCreativeHTML(data: PolishedResume): string {
  const p = data.personalInfo
  const fullName = `${capitalize(p.firstName)} ${capitalize(p.lastName)}`.trim()
  const contact = [p.email, p.phone, p.location].filter(Boolean).join(' · ')
  const links = [p.linkedin, p.website].filter(Boolean).join(' · ')
  const work = data.workExperience || []
  const education = data.education || []
  const achievements = (data as PolishedResume & { achievementsPolished?: Array<string | { title?: string; award?: string; year?: string; description?: string }> }).achievementsPolished || data.achievements || []
  const projects = (data as PolishedResume & { projectsPolished?: Array<string | { name?: string; description?: string; technologies?: string[]; url?: string; achievements?: Array<string | { title?: string; description?: string }> }> }).projectsPolished || data.projects || []
  const skills = Array.isArray(data.skills) ? data.skills : []
  const groupedSkills = groupSkillsByCategory(skills)
  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <title>${escapeHtml(fullName)} - Resume</title>
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; margin: 8px; color:#0b1220; font-size: 12.4px; }
    header { background: linear-gradient(90deg,#6ee7b7,#3b82f6); color:#0b1220; padding:10px 12px; border-radius:8px; }
    h1 { margin: 0; font-size: 24px; }
    .subtitle{ opacity:.9; }
    .links{ opacity:.85 }
    h2 { font-size: 12px; letter-spacing:.12em; text-transform: uppercase; color:#2563eb; margin:10px 0 4px }
    .section{ background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px; margin-top:8px }
    ul{ margin: 2px 0 0 16px; padding:0 } li{ margin:2px 0 }
  </style></head>
  <body>
    <header>
      <h1>${escapeHtml(fullName)}</h1>
      ${p.title ? `<div class="subtitle">${escapeHtml(p.title)}</div>` : ''}
      <div class="links">${escapeHtml(contact)}${links ? ' · ' + escapeHtml(links) : ''}</div>
    </header>
    ${p.summary ? `<div class="section"><h2>Summary</h2><div>${escapeHtml(normalizeWhitespace(p.summary))}</div></div>` : ''}
    ${renderSkillsSection(groupedSkills)}
    ${work.length ? `<div class="section"><h2>Experience</h2>${work.map(w => renderExperience(w)).join('<div style="height:6px"></div>')}</div>` : ''}
    ${education.length ? `<div class="section"><h2>Education</h2>${education.map(e => renderEducation(e)).join('<div style="height:6px"></div>')}</div>` : ''}
    ${Array.isArray(achievements) && achievements.length ? `<div class="section"><h2>Achievements</h2><ul>${(achievements as Array<string | { title?: string; award?: string; year?: string; description?: string }>).map(a => typeof a === 'string' ? `<li>${escapeHtml(a)}</li>` : `<li>${escapeHtml(a.title || a.award || '')}${a.year ? ` (${escapeHtml(a.year)})` : ''}${a.description ? ` — ${escapeHtml(a.description)}` : ''}</li>`).join('')}</ul></div>` : ''}
    ${Array.isArray(projects) && projects.length ? `<div class="section"><h2>Projects</h2>${projects.map(pr => renderProject(pr)).join('')}</div>` : ''}
  </body></html>`
}

type WorkItem = ResumeData['workExperience'][number] & { bullets?: Array<string | unknown> };
function renderExperience(w: WorkItem): string {
  const title = [w.position, w.company].filter(Boolean).map(escapeHtml).join(' · ')
  const dates = [w.startDate, w.endDate || (w.current ? 'Present' : '')].filter(Boolean).join(' – ')
  const metaLine = [dates, w.location].filter(Boolean).map(escapeHtml).join(' · ')
  const rawBullets = Array.isArray(w.bullets) ? w.bullets : sentenceSplit(w.description)
  const bullets = (rawBullets || []).map((b)=>String(b as string)).filter(Boolean)
  return `<div>
    <div class="exp-header">${title}</div>
    ${metaLine ? `<div class="meta line">${metaLine}</div>` : ''}
    ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(String(b))}</li>`).join('')}</ul>` : ''}
  </div>`
}

type EducationItem = ResumeData['education'][number] & { bullets?: Array<string | unknown> };
function renderEducation(e: EducationItem): string {
  const title = `${escapeHtml(e.degree || '')}${e.field ? ' — ' + escapeHtml(e.field) : ''}`
  const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
  const bullets = Array.isArray(e.bullets) ? e.bullets : sentenceSplit(e.description)
  return `<div>
    <div><strong>${escapeHtml(e.institution || '')}</strong></div>
    ${title ? `<div class="muted line">${title}</div>` : ''}
    ${dates ? `<div class="meta line">${escapeHtml(dates)}</div>` : ''}
    ${bullets && bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(String(b as string))}</li>`).join('')}</ul>` : ''}
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

function groupSkillsByCategory(skills: ResumeData['skills']) {
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

type ProjectItem = string | (ResumeData['projects'][number] & { achievements?: Array<string | { title?: string; description?: string }>; url?: string });
function renderProject(p: ProjectItem): string {
  if (!p) return ''
  if (typeof p === 'string') return `<div>• ${escapeHtml(p)}</div>`
  const name = p.name ? `<strong>${escapeHtml(p.name)}</strong>` : ''
  const techs = p.technologies ? escapeHtml(Array.isArray(p.technologies) ? p.technologies.join(', ') : String(p.technologies)) : ''
  const link = p.url ? escapeHtml(p.url) : ''
  const headerParts = [name]
  if (techs) headerParts.push(techs)
  if (link) headerParts.push(link.replace(/^https?:\/\//,'').replace(/\/$/,''))
  const headerLine = headerParts.filter(Boolean).join(' | ')
  // Split description into sentences and turn into bullet points
  const descBullets = sentenceSplit(p.description).map(d => d.trim()).filter(Boolean)
  // If achievements array exists, append those as additional bullets
  const achBullets = Array.isArray(p.achievements) ? p.achievements.map((a)=> typeof a === 'string' ? a : (a.description || a.title || '')).filter(Boolean) : []
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
