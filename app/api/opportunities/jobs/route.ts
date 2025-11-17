import { NextRequest, NextResponse } from "next/server";

// Unified opportunity shape (matches /api/opportunities)
interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Job' | 'Internship' | 'Volunteer';
  workType: 'Remote' | 'On-site' | 'Hybrid';
  description: string;
  url?: string;
  tags: string[];
}

// Jooble response types (subset)
interface JoobleJob {
  title: string;
  location: string;
  company: string;
  snippet?: string;
  link: string;
  updated?: string;
  salary?: string;
}

interface JoobleResponse {
  totalCount?: number;
  jobs?: JoobleJob[];
  error?: string;
}

// GET /api/opportunities/jobs - Fetch jobs from Jobicy
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const locationRaw = searchParams.get('location') || '';
    const remoteFlag = (searchParams.get('remote') || '').toLowerCase() === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const company = searchParams.get('company') || '';
    const description = searchParams.get('description') || '';
    const includeDebug = (searchParams.get('debug') || '').toLowerCase() === 'true';
    const date = searchParams.get('date');

    // Build Jooble request body
    const keywordsParts = [query, company, description].map(s => s.trim()).filter(Boolean);
    let keywords = keywordsParts.join(' ');
    if (!keywords && !locationRaw && !remoteFlag) {
      keywords = 'developer';
    }
    const body: any = {
      ...(keywords ? { keywords } : {}),
      ...(locationRaw ? { location: locationRaw } : {}),
      page,
      ...(remoteFlag ? { is_remote: true } : {}),
      ...(date ? { date: Number(date) } : {}),
    };

    const apiKey = process.env.JOOBLE_KEY;
    if (!apiKey) {
      console.error('[Jobs] Missing JOOBLE_KEY env var');
      return NextResponse.json({
        opportunities: [],
        pagination: { currentPage: page, totalPages: 1, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPrevPage: page > 1 },
        error: 'Server not configured: set JOOBLE_KEY in environment.'
      }, { status: 500 });
    }

    const url = `https://jooble.org/api/${apiKey}`;
    console.log('[Jobs] Jooble request:', { url, body });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'LaunchpadPro/1.0 (+https://github.com/lionzak/launchpadpro)'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('[Jobs] Jooble response error:', response.status, errorText);
      return NextResponse.json(
        {
          opportunities: [],
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: page > 1
          },
          error: 'Failed to fetch jobs from Jooble. Provide a search term or location.'
        },
        { status: response.status }
      );
    }

    let rows: JoobleJob[] = [];
    let totalCount = 0;
    try {
      const data: JoobleResponse = await response.json();
      rows = Array.isArray(data.jobs) ? data.jobs : [];
      totalCount = typeof data.totalCount === 'number' ? data.totalCount : rows.length;
      console.log('[Jobs] Jooble received:', rows.length, 'totalCount:', totalCount);
    } catch (e) {
      const text = await response.text().catch(() => '<unreadable>');
      console.warn('[Jobs] Parse error, first 200 chars:', text.slice(0, 200));
      rows = [];
    }
    // Apply strict location inclusion post-filter if location provided (Jooble should filter, this ensures consistency)
    let filteredRows = rows;
    if (!remoteFlag && locationRaw.trim()) {
      const needle = locationRaw.trim().toLowerCase();
      filteredRows = filteredRows.filter(j => (j.location || '').toLowerCase().includes(needle));
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    // Jooble already paginates; don't re-slice beyond current page size but keep guard
    const pageRows = start < filteredRows.length ? filteredRows.slice(start, end) : filteredRows;

    const opportunities: Opportunity[] = pageRows.map((job: JoobleJob, index: number) => {
      const uniqueId = `jooble-${hashString(job.link || job.title || '')}-p${page}-${index}`;
      const loc = job.location || (remoteFlag ? 'Remote' : 'Various Locations');
      const snippet = (job.snippet && job.snippet.trim()) ? job.snippet.trim() : '';
      const derived = extractTags(`${job.title || ''} ${snippet}`);
      const tags = [...derived].filter(Boolean).slice(0, 5);
      const workType: 'Remote' | 'On-site' | 'Hybrid' = remoteFlag || /remote|anywhere/i.test(loc) ? 'Remote' : 'On-site';

      return {
        id: uniqueId,
        title: job.title || 'Job Opportunity',
        company: job.company || 'Company',
        location: loc,
        type: isInternshipTitle(job.title || '') ? 'Internship' : 'Job',
        workType,
        description: snippet || 'No description available',
        url: job.link || undefined,
        tags: tags.length ? tags : [workType]
      };
    });

    // Pagination based on locally sliced rows
    const pageSize = rows.length || limit;
    const totalItems = totalCount;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (pageSize || 1)));
    const hasNextPage = page < totalPages;

    const payload: any = {
      opportunities,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalItems || opportunities.length,
        itemsPerPage: pageSize,
        hasNextPage,
        hasPrevPage: page > 1
      },
      filters: {
        query,
        location: locationRaw,
        remote: remoteFlag || undefined
      }
    };

    if (includeDebug) {
      payload.debug = {
        url,
        received: rows.length,
        totalCount,
        afterFilter: filteredRows.length,
        pageInfo: { page, itemsPerPage: pageSize }
      };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      {
        opportunities: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPrevPage: false
        },
        error: 'Internal server error while fetching jobs'
      },
      { status: 500 }
    );
  }
}

function extractTags(description: string): string[] {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
    'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'HTML', 'CSS', 'Git', 'Linux', 'REST', 'GraphQL'
  ];
  const found = techKeywords.filter(k => description.toLowerCase().includes(k.toLowerCase()));
  return [...new Set(found)].slice(0, 5);
}

function isInternshipTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return lower.includes('intern') || lower.includes('internship') || lower.includes('graduate') || lower.includes('entry level') || lower.includes('junior') || lower.includes('trainee');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Simple non-crypto hash for stable IDs
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}