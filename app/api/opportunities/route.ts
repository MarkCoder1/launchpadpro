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

interface RapidAPIJob {
  id: string;
  title: string;
  organization: string;
  location_type?: string;
  locations_derived?: string[];
  cities_derived?: string[];
  remote_derived?: boolean;
  salary_raw?: any;
  description_text?: string;
  url?: string;
  [key: string]: any;
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

    // Handle volunteers separately from jobs/internships
    if (filters.type === 'volunteers') {
      return await fetchVolunteers(filters);
    }

    // For jobs and internships, use RapidAPI
    const rapidApiKey = process.env.RAPID_API_KEY || process.env['X-RAPIDAPI-KEY'];
    if (!rapidApiKey) {
      return NextResponse.json(
        { error: 'RapidAPI key not configured' },
        { status: 500 }
      );
    }

    // Calculate offset for pagination
    const offset = (filters.page - 1) * filters.limit;

    // Build API URL with comprehensive filters
    const apiUrl = new URL('https://active-jobs-db.p.rapidapi.com/active-ats-7d');
    apiUrl.searchParams.append('limit', filters.limit.toString());
    apiUrl.searchParams.append('offset', offset.toString());
    apiUrl.searchParams.append('description_type', 'text');

    // Apply filters based on type
    if (filters.type === 'internships') {
      // For internships, search for internship-related terms
      if (filters.query) {
        apiUrl.searchParams.append('title_filter', `${filters.query} intern`);
      } else {
        apiUrl.searchParams.append('title_filter', 'intern');
      }
    } else if (filters.query) {
      // For jobs or all, use regular title filter
      apiUrl.searchParams.append('title_filter', filters.query);
    }

    // Location filter
    if (filters.location) {
      apiUrl.searchParams.append('location_filter', `"${filters.location}"`);
    }

    // Remote filter
    if (filters.remote) {
      apiUrl.searchParams.append('remote', filters.remote);
    }

    // Company filters
    if (filters.company) {
      apiUrl.searchParams.append('organization_filter', filters.company);
    }

    if (filters.excludeCompany) {
      apiUrl.searchParams.append('organization_exclusion_filter', filters.excludeCompany);
    }

    // Description filter
    if (filters.description) {
      apiUrl.searchParams.append('description_filter', filters.description);
    }

    // Source filter
    if (filters.source) {
      apiUrl.searchParams.append('source', filters.source);
    }

    console.log('Fetching opportunities from:', apiUrl.toString());

    // Make API call
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('RapidAPI response error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
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

    const data: RapidAPIJob[] = await response.json();
    console.log('RapidAPI response received:', Array.isArray(data) ? data.length : 'not array');
    console.log('Response type:', typeof data);
    console.log('Response sample:', Array.isArray(data) ? data.slice(0, 2) : data);

    // Transform the data
    const rawJobs = Array.isArray(data) ? data : [];
    
    if (!Array.isArray(data)) {
      console.warn('API returned non-array response for filters:', filters);
      console.warn('API URL was:', apiUrl.toString());
    }
    
    // Filter by type if needed (for 'all' type, we may need additional filtering)
    const filteredJobs = filters.type === 'jobs' 
      ? rawJobs.filter(job => !isInternshipTitle(job.title || ''))
      : rawJobs;

    // Transform to our interface
    const opportunities: Opportunity[] = filteredJobs.map((job, index) => {
      const uniqueId = `${job.id || Date.now()}-${filters.page}-${index}`;
      
      // Determine work type
      let workType: 'Remote' | 'On-site' | 'Hybrid' = 'On-site';
      if (job.location_type === 'TELECOMMUTE' || job.remote_derived === true) {
        workType = 'Remote';
      } else if (job.location_type === 'HYBRID') {
        workType = 'Hybrid';
      }

      // Determine job type
      const isInternship = isInternshipTitle(job.title || '');
      const type: 'Job' | 'Internship' = isInternship ? 'Internship' : 'Job';

      // Extract location
      const location = job.location_type === 'TELECOMMUTE' 
        ? 'Remote' 
        : (job.locations_derived?.[0] || job.cities_derived?.[0] || 'Not specified');

      // Extract skills/tags
      const tags = extractTags(job.description_text || '');

      return {
        id: uniqueId,
        title: job.title || 'Position Available',
        company: job.organization || 'Company',
        location,
        type,
        workType,
        description: job.description_text 
          ? job.description_text.substring(0, 200) + '...' 
          : 'No description available',
        url: job.url,
        tags: tags.length > 0 ? tags : [type === 'Internship' ? 'Internship' : 'Full-time']
      };
    });

    // Calculate pagination info
    // Since we don't get total count from API, we estimate based on results
    const hasFullPage = opportunities.length === filters.limit;
    const estimatedTotal = hasFullPage 
      ? (filters.page * filters.limit) + filters.limit // Estimate there's at least one more page
      : (filters.page - 1) * filters.limit + opportunities.length;
    
    const totalPages = Math.ceil(estimatedTotal / filters.limit);

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