import { NextRequest, NextResponse } from "next/server";

interface OpportunityFilters {
  query?: string;
  location?: string;
  type: 'all' | 'jobs' | 'internships' | 'volunteers';
  remote?: 'true' | 'false';
  company?: string;
  source?: string;
  description?: string;
  excludeCompany?: string;
  page: number;
  limit: number;
}

// Jooble response shapes (subset)
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

interface VolunteerOpportunity {
  id: number;
  title: string;
  description: string;
  url: string;
  remote_or_online: boolean;
  organization: {
    name: string;
    logo?: string;
    url?: string;
  };
  activities: Array<{
    name: string;
    category: string;
  }>;
  dates: string;
  duration: string;
  audience: {
    scope: string;
    regions: string[];
  };
}

interface VolunteerAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VolunteerOpportunity[];
}

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
  duration?: string;
  dates?: string;
}

// GET /api/opportunities - Unified opportunities endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters
    const filters: OpportunityFilters = {
      query: searchParams.get('query') || '',
      location: searchParams.get('location') || '',
      type: (searchParams.get('type') as 'all' | 'jobs' | 'internships' | 'volunteers') || 'all',
      remote: searchParams.get('remote') as 'true' | 'false' | undefined,
      company: searchParams.get('company') || '',
      source: searchParams.get('source') || '',
      description: searchParams.get('description') || '',
      excludeCompany: searchParams.get('excludeCompany') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    };

    // Handle volunteers separately
    if (filters.type === 'volunteers') {
      return await fetchVolunteers(filters);
    }

    // Build Jooble body and request
    const limit = Math.min(Math.max(1, filters.limit), 50);
    const remoteFlag = (filters.remote || '').toString().toLowerCase() === 'true';
    const keywordsParts = [filters.query || '', filters.company || '', filters.description || ''];
    if (filters.type === 'internships') keywordsParts.push('intern internship graduate junior trainee entry level');
    let keywords = keywordsParts.map(s => s.trim()).filter(Boolean).join(' ');
    if (!keywords && !(filters.location || '').trim() && !remoteFlag) {
      keywords = 'developer';
    }

    const body: any = {
      ...(keywords ? { keywords } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      page: filters.page,
      ...(remoteFlag ? { is_remote: true } : {}),
    };

    const apiKey = process.env.JOOBLE_KEY;
    if (!apiKey) {
      console.error('[Opportunities] Missing JOOBLE_KEY env var');
      return NextResponse.json({
        opportunities: [],
        pagination: {
          currentPage: filters.page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: filters.page > 1
        },
        error: 'Server not configured: set JOOBLE_KEY in environment.'
      }, { status: 500 });
    }

    const url = `https://jooble.org/api/${apiKey}`;
    console.log('[Opportunities] Jooble request:', { url, body });

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
      console.error('[Opportunities] Jooble response error:', response.status, errorText);
      return NextResponse.json({
        opportunities: [],
        pagination: {
          currentPage: filters.page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: filters.page > 1
        },
        error: `API Error: ${response.status}. Provide a search term or location.`
      });
    }

    let rawJobs: JoobleJob[] = [];
    let totalCount = 0;
    try {
      const json: JoobleResponse = await response.json();
      rawJobs = Array.isArray(json.jobs) ? json.jobs : [];
      totalCount = typeof json.totalCount === 'number' ? json.totalCount : rawJobs.length;
      console.log('[Opportunities] Jooble received:', rawJobs.length, 'totalCount:', totalCount);
    } catch (e) {
      const text = await response.text().catch(() => '<unreadable>');
      console.warn('[Opportunities] Non-JSON or parse error, first 200 chars:', text.slice(0, 200));
      rawJobs = [];
    }
    // Filter internships if specifically requested
    const filteredJobs = filters.type === 'internships'
      ? rawJobs.filter(j => isInternshipTitle(j.title || ''))
      : (filters.type === 'jobs' ? rawJobs.filter(j => !isInternshipTitle(j.title || '')) : rawJobs);

    // Apply strict location include filter for consistency when location provided
    let pageJobs = filteredJobs;
    if (!remoteFlag && (filters.location || '').trim()) {
      const needle = (filters.location || '').trim().toLowerCase();
      pageJobs = pageJobs.filter(j => (j.location || '').toLowerCase().includes(needle));
    }

    const opportunities: Opportunity[] = pageJobs.map((job, index) => {
      const uniqueId = `jooble-${hashString(job.link || job.title || '')}-p${filters.page}-${index}`;
      const loc = job.location || (remoteFlag ? 'Remote' : 'Various Locations');
      const snippet = (job.snippet && job.snippet.trim()) ? job.snippet.trim() : '';
      const derivedTags = extractTags(`${job.title || ''} ${snippet}`);
      const tags = [...derivedTags].filter(Boolean).slice(0,5);
      const isIntern = isInternshipTitle(job.title || '');
      const type: 'Job' | 'Internship' = (filters.type === 'internships' || isIntern) ? 'Internship' : 'Job';
      const workType: 'Remote' | 'On-site' | 'Hybrid' = remoteFlag || /remote|anywhere/i.test(loc) ? 'Remote' : 'On-site';

      return {
        id: uniqueId,
        title: job.title || 'Position Available',
        company: job.company || 'Company',
        location: loc,
        type,
        workType,
        description: snippet || 'No description available',
        url: job.link,
        tags: tags.length ? tags : [type]
      };
    });

    // Pagination based on Jooble totalCount
    const pageSize = rawJobs.length || limit;
    const totalItems = totalCount;
    const totalPages = Math.max(1, Math.ceil((totalItems || opportunities.length) / (pageSize || 1)));
    const hasNextPage = filters.page < totalPages;

    const pagination = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage: filters.page > 1
    };

    // Optional debug passthrough
    const includeDebug = (new URL(req.url).searchParams.get('debug') || '').toLowerCase() === 'true';
    const debug = includeDebug ? {
      url,
      received: rawJobs.length,
      totalCount,
      afterFilter: opportunities.length,
      pageInfo: { page: filters.page, itemsPerPage: pageSize },
      sampleIds: opportunities.slice(0, 5).map(o => o.id)
    } : undefined;

    return NextResponse.json({
      opportunities,
      pagination,
      filters: {
        type: filters.type,
        query: filters.query,
        location: filters.location,
        remote: filters.remote,
        company: filters.company
      },
      ...(includeDebug ? { debug } : {})
    });

  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({
      opportunities: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false
      },
      error: 'Internal server error while fetching opportunities'
    }, { status: 500 });
  }
}

// Fetch volunteers from VolunteerConnector API
async function fetchVolunteers(filters: OpportunityFilters) {
  try {
    // Build volunteer API URL
    const volunteerUrl = new URL('https://www.volunteerconnector.org/api/search/');
    volunteerUrl.searchParams.append('page', filters.page.toString());
    
    // Add activity category filter if query is provided
    if (filters.query) {
      // Map common search terms to activity categories
      const activityMapping: { [key: string]: string } = {
        'tech': '5', // IT Support
        'technology': '5',
        'education': '5',
        'marketing': '13',
        'admin': '1',
        'administration': '1',
        'event': '8',
        'community': '4'
      };
      
      const queryLower = filters.query.toLowerCase();
      for (const [term, categoryId] of Object.entries(activityMapping)) {
        if (queryLower.includes(term)) {
          volunteerUrl.searchParams.append('ac', categoryId);
          break;
        }
      }
    }
    
    // Location mapping for common cities (you can expand this)
    if (filters.location) {
      const locationMapping: { [key: string]: string } = {
        'vancouver': '64',
        'toronto': '70',
        'calgary': '60',
        'edmonton': '61',
        'montreal': '69',
        'ottawa': '68'
      };
      
      const locationLower = filters.location.toLowerCase();
      for (const [city, cityId] of Object.entries(locationMapping)) {
        if (locationLower.includes(city)) {
          volunteerUrl.searchParams.append('cc', cityId);
          break;
        }
      }
    }

    console.log('Fetching volunteers from:', volunteerUrl.toString());

    const response = await fetch(volunteerUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Volunteer API error: ${response.status}`);
    }

    const data: VolunteerAPIResponse = await response.json();
    console.log('Volunteer API response received:', data.count, 'total opportunities');

    // Transform volunteer data to our interface
    const opportunities: Opportunity[] = data.results.map((volunteer, index) => {
      const uniqueId = `volunteer-${volunteer.id}-p${filters.page}-${index}`;
      
      // Extract work type
      const workType = volunteer.remote_or_online ? 'Remote' : 'On-site';
      
      // Extract tags from activities - with null checks
      const tags = volunteer.activities && Array.isArray(volunteer.activities)
        ? volunteer.activities.map(activity => activity?.name).filter(Boolean).slice(0, 5)
        : ['Volunteer', 'Community'];
      
      // Extract location with proper null checks
      const location = volunteer.remote_or_online 
        ? 'Remote' 
        : (volunteer.audience?.regions && Array.isArray(volunteer.audience.regions) 
            ? volunteer.audience.regions.join(', ') 
            : 'Various Locations');

      return {
        id: uniqueId,
        title: volunteer.title || 'Volunteer Opportunity',
        company: volunteer.organization?.name || 'Organization',
        location,
        type: 'Volunteer' as const,
        workType,
        description: volunteer.description && volunteer.description.length > 200 
          ? volunteer.description.substring(0, 200) + '...'
          : volunteer.description || 'No description available',
        url: volunteer.url,
        tags: tags.length > 0 ? tags : ['Volunteer', 'Community'],
        duration: volunteer.duration || undefined,
        dates: volunteer.dates || undefined
      };
    });

    // Calculate pagination
    const totalItems = data.count;
    const totalPages = Math.ceil(totalItems / filters.limit);
    const hasNextPage = !!data.next;
    const hasPrevPage = !!data.previous;

    return NextResponse.json({
      opportunities,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalItems,
        itemsPerPage: filters.limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type: filters.type,
        query: filters.query,
        location: filters.location
      }
    });

  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({
      opportunities: [],
      pagination: {
        currentPage: filters.page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: filters.limit,
        hasNextPage: false,
        hasPrevPage: false
      },
      error: 'Failed to fetch volunteer opportunities'
    }, { status: 500 });
  }
}

// Helper functions
function isInternshipTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('intern') ||
         lowerTitle.includes('internship') ||
         lowerTitle.includes('graduate') ||
         lowerTitle.includes('entry level') ||
         lowerTitle.includes('junior') ||
         lowerTitle.includes('trainee');
}

function extractTags(description: string): string[] {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
    'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'HTML', 'CSS', 'Git', 'Linux', 'REST', 'GraphQL'
  ];
  
  const found = techKeywords.filter(keyword => 
    description.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return [...new Set(found)].slice(0, 5);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Simple hash for stable IDs based on link/title
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}