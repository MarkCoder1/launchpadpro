import { NextRequest, NextResponse } from "next/server";

// GET /api/opportunities/jobs - Fetch jobs from RapidAPI
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Default 20, max 100
    const remote = searchParams.get('remote'); // true, false, or null
    const company = searchParams.get('company') || '';
    const dateFilter = searchParams.get('dateFilter') || '';
    const source = searchParams.get('source') || '';

    const rapidApiKey = process.env.RAPID_API_KEY || process.env['X-RAPIDAPI-KEY'];
    if (!rapidApiKey) {
      return NextResponse.json(
        { error: 'RapidAPI key not configured' },
        { status: 500 }
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build API URL with comprehensive parameters
    const apiUrl = new URL('https://active-jobs-db.p.rapidapi.com/active-ats-7d');
    
    // Pagination parameters - use larger limit to get more data for better pagination
    apiUrl.searchParams.append('limit', '100'); // Get max to have enough data
    apiUrl.searchParams.append('offset', offset.toString());
    
    // Search filters
    if (query) {
      apiUrl.searchParams.append('title_filter', `"${query}"`);
    }
    
    if (location) {
      apiUrl.searchParams.append('location_filter', `"${location}" OR "United Kingdom" OR "United States"`);
    }
    
    // Remote work filter
    if (remote === 'true') {
      apiUrl.searchParams.append('remote', 'true');
    } else if (remote === 'false') {
      apiUrl.searchParams.append('remote', 'false');
    }
    
    // Company filter
    if (company) {
      apiUrl.searchParams.append('organization_filter', company);
    }
    
    // Date filter (recent jobs)
    if (dateFilter) {
      apiUrl.searchParams.append('date_filter', dateFilter);
    }
    
    // Source filter (ATS platforms)
    if (source) {
      apiUrl.searchParams.append('source', source);
    }
    
    // Always include description text
    apiUrl.searchParams.append('description_type', 'text');

    console.log('Fetching jobs from:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('RapidAPI response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from API', jobs: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('RapidAPI jobs response received:', Array.isArray(data) ? data.length : 'not array');

    // Transform the API response to match our interface
    const jobsArray = Array.isArray(data) ? data : [];
    
    // Apply client-side pagination to the received data
    const clientSideLimit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const startIndex = 0; // We already used offset in API call
    const endIndex = clientSideLimit;
    const paginatedJobs = jobsArray.slice(startIndex, endIndex);
    
    const jobs = paginatedJobs.map((job, index: number) => {
      // Create unique ID using job ID, page, and index to prevent duplicates
      const uniqueId = job.id ? `job-${job.id}-p${page}-${index}` : `job-${Date.now()}-p${page}-${index}`;
      
      // Extract skills/tags from description text
      const description = job.description_text || '';
      const skillsMatch = description.match(/(?:skills?|technologies?|experience)[^.]*(?:SQL|Python|JavaScript|React|Node|Azure|AWS|Java|C\+\+|HTML|CSS)/gi) || [];
      const tags = [...new Set(skillsMatch.flatMap(match => 
        match.match(/\b(?:SQL|Python|JavaScript|React|Node|Azure|AWS|Java|C\+\+|HTML|CSS|Angular|Vue|TypeScript|Docker|Kubernetes)\b/gi) || []
      ))].slice(0, 5);

      // Handle salary object properly
      let salaryString = undefined;
      if (job.salary_raw) {
        if (typeof job.salary_raw === 'object' && job.salary_raw.value) {
          // Handle salary object with currency
          const currency = job.salary_raw.currency || '$';
          const value = job.salary_raw.value;
          salaryString = `${currency}${value}`;
        } else if (typeof job.salary_raw === 'string') {
          salaryString = job.salary_raw;
        }
      }

      // Determine work type based on location_type and remote_derived
      let workType = 'On-site';
      if (job.location_type === 'TELECOMMUTE' || job.remote_derived === true) {
        workType = 'Remote';
      } else if (job.location_type === 'HYBRID') {
        workType = 'Hybrid';
      }

      return {
        id: uniqueId,
        title: job.title || 'Software Developer',
        company: job.organization || 'Unknown Company',
        location: job.location_type === 'TELECOMMUTE' ? 'Remote' : (job.locations_derived?.[0] || job.cities_derived?.[0] || 'Not specified'),
        type: 'Job' as const,
        workType,
        salary: salaryString,
        description: job.description_text ? job.description_text.substring(0, 200) + '...' : '',
        url: job.url || undefined,
        tags: tags.length > 0 ? tags : ['Technology', 'Engineering']
      };
    });

    return NextResponse.json({
      jobs,
      total: 1000, // Estimate since API doesn't provide total count
      page,
      limit: clientSideLimit,
      hasMore: jobs.length === clientSideLimit, // Has more if we got full page
      currentCount: jobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching jobs', jobs: [] },
      { status: 500 }
    );
  }
}