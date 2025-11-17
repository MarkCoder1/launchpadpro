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

interface TheirStackJob {
  id?: number | string;
  job_title?: string;
  url?: string;
  final_url?: string;
  source_url?: string;
  date_posted?: string;
  remote?: boolean;
  hybrid?: boolean;
  salary_string?: string;
  description?: string;
  company_domain?: string;
  company_object?: {
    name?: string;
    domain?: string;
    linkedin_url?: string;
  };
  locations?: Array<{ display_name?: string }>;
  technology_slugs?: string[];
}

type TheirStackSearchBody = {
  page: number;
  limit: number;
  posted_at_max_age_days: number;
  job_title_or?: string[];
  job_title_pattern_or?: string[];
  job_location_pattern_or?: string[];
  remote?: boolean;
  company_name_case_insensitive_or?: string[];
  company_name_not?: string[];
  job_description_contains_or?: string[];
  url_domain_or?: string[];
  employment_statuses_or?: string[];
};

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

    // TheirStack API key
    const theirstackKey = process.env.THEIRSTACK_API_KEY;
    if (!theirstackKey) {
      return NextResponse.json(
        { error: 'TheirStack API key not configured (set THEIRSTACK_API_KEY)' },
        { status: 500 }
      );
    }

    // Build TheirStack body (page is 0-based)
    const body: TheirStackSearchBody = {
      page: Math.max(0, filters.page - 1),
      limit: filters.limit,
      posted_at_max_age_days: 7,
    };

    if (filters.query) body.job_title_or = [filters.query];
    if (filters.type === 'internships') {
      body.employment_statuses_or = ['internship'];
      body.job_title_pattern_or = ['intern', 'internship', 'graduate', 'entry level', 'junior', 'trainee'];
    }
    if (filters.location) body.job_location_pattern_or = [filters.location];
    if (filters.remote) body.remote = filters.remote === 'true';
    if (filters.company) body.company_name_case_insensitive_or = [filters.company];
    if (filters.excludeCompany) body.company_name_not = [filters.excludeCompany];
    if (filters.description) body.job_description_contains_or = [filters.description];
    if (filters.source) body.url_domain_or = [filters.source];

    console.log('Fetching opportunities from TheirStack with body:', JSON.stringify(body));

    const response = await fetch('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${theirstackKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TheirStack response error:', response.status, response.statusText, errorText);
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
        error: `API Error: ${response.status} ${response.statusText}`
      });
    }

    const tsData: { data?: TheirStackJob[]; metadata?: { total_results?: number } } = await response.json();
    const rawJobs: TheirStackJob[] = Array.isArray(tsData?.data) ? tsData.data! : [];
    console.log('TheirStack response received:', rawJobs.length);

    // Filter by type ('jobs' excludes internships)
    const filteredJobs = filters.type === 'jobs'
      ? rawJobs.filter(job => !isInternshipTitle((job.job_title || '').toString()))
      : rawJobs;

    // Transform to our interface
    const opportunities: Opportunity[] = filteredJobs.map((job, index) => {
      const uniqueId = `${job.id ?? Date.now()}-${filters.page}-${index}`;
      const isIntern = isInternshipTitle((job.job_title || '').toString());
      const type: 'Job' | 'Internship' = (filters.type === 'internships' || isIntern) ? 'Internship' : 'Job';

      let workType: 'Remote' | 'On-site' | 'Hybrid' = 'On-site';
      if (job.remote) workType = 'Remote';
      else if (job.hybrid) workType = 'Hybrid';

      const location = job.remote ? 'Remote' : (job.locations?.[0]?.display_name || 'Not specified');
      const tagsFromTech = Array.isArray(job.technology_slugs) ? job.technology_slugs.slice(0, 5) : [];
      const tags = tagsFromTech.length > 0 ? tagsFromTech : extractTags(job.description || '');

      return {
        id: uniqueId,
        title: job.job_title || 'Position Available',
        company: job.company_object?.name || job.company_domain || job.company_object?.domain || 'Company',
        location,
        type,
        workType,
        description: job.description ? job.description.substring(0, 200) + '...' : 'No description available',
        url: job.final_url || job.url || job.source_url,
        tags: tags.length > 0 ? tags : [type === 'Internship' ? 'Internship' : 'Full-time']
      };
    });

    // Pagination
    const totalResults = (tsData?.metadata?.total_results ?? null);
    const hasFullPage = opportunities.length === filters.limit;
    const estimatedTotal = totalResults !== null && totalResults !== undefined
      ? totalResults
      : (hasFullPage ? (filters.page * filters.limit) + filters.limit : (filters.page - 1) * filters.limit + opportunities.length);
    const totalPages = Math.max(1, Math.ceil(estimatedTotal / filters.limit));

    const pagination = {
      currentPage: filters.page,
      totalPages,
      totalItems: estimatedTotal,
      itemsPerPage: filters.limit,
      hasNextPage: hasFullPage,
      hasPrevPage: filters.page > 1
    };

    return NextResponse.json({
      opportunities,
      pagination,
      filters: {
        type: filters.type,
        query: filters.query,
        location: filters.location,
        remote: filters.remote,
        company: filters.company
      }
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