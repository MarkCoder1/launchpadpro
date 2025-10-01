import { NextRequest, NextResponse } from "next/server";

// GET /api/opportunities/internships - Fetch internships from RapidAPI
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
    const offset = (page - 1) * 50; // Use larger offset for internships

    // For internships, we'll use the same jobs API but filter for internship titles
    // since the internships-api endpoint may have limited data
    const apiUrl = new URL('https://active-jobs-db.p.rapidapi.com/active-ats-7d');
    
    // Pagination parameters - get more results to filter for internships
    apiUrl.searchParams.append('limit', '100'); // Get more to have enough internships
    apiUrl.searchParams.append('offset', offset.toString());
    
    // Search for internship-related titles
    let titleFilter = '';
    if (query) {
      titleFilter = `("${query}" AND (intern OR internship OR graduate OR "entry level" OR junior OR trainee))`;
    } else {
      titleFilter = 'intern OR internship OR graduate OR "entry level" OR junior OR trainee';
    }
    apiUrl.searchParams.append('advanced_title_filter', titleFilter);
    
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

    console.log('Fetching internships from:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('RapidAPI internships response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch internships from API', internships: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('RapidAPI internships response received:', Array.isArray(data) ? data.length : 'not array');

    // The API should already return filtered results, but we'll apply client-side pagination
    const allJobs = Array.isArray(data) ? data : [];
    
    // Filter for internship-related positions
    const internshipJobs = allJobs.filter((job: any) => 
      job.title && (
        job.title.toLowerCase().includes('intern') ||
        job.title.toLowerCase().includes('graduate') ||
        job.title.toLowerCase().includes('entry level') ||
        job.title.toLowerCase().includes('junior') ||
        job.title.toLowerCase().includes('trainee')
      )
    );
    
    // Apply client-side pagination to filtered internships
    const clientSideLimit = Math.min(parseInt(searchParams.get('limit') || '20'), 30);
    const paginatedInternships = internshipJobs.slice(0, clientSideLimit);

    const internships = paginatedInternships.map((job: any, index: number) => {
      // Create unique ID using job ID, page, and index to prevent duplicates
      const uniqueId = job.id ? `internship-${job.id}-p${page}-${index}` : `internship-${Date.now()}-p${page}-${index}`;
      // Extract skills/tags from description
      const description = job.description_text || '';
      const skillsMatch = description.match(/(?:skills?|technologies?|experience)[^.]*(?:SQL|Python|JavaScript|React|Node|Azure|AWS|Java|C\+\+|HTML|CSS)/gi) || [];
      const tags = [...new Set(skillsMatch.flatMap(match => 
        match.match(/\b(?:SQL|Python|JavaScript|React|Node|Azure|AWS|Java|C\+\+|HTML|CSS|Angular|Vue|TypeScript)\b/gi) || []
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
        title: job.title || 'Software Development Intern',
        company: job.organization || 'Unknown Company',
        location: job.location_type === 'TELECOMMUTE' ? 'Remote' : (job.locations_derived?.[0] || job.cities_derived?.[0] || 'Not specified'),
        type: 'Internship' as const,
        workType,
        salary: salaryString,
        description: job.description_text ? job.description_text.substring(0, 200) + '...' : '',
        url: job.url || undefined,
        tags: tags.length > 0 ? tags : ['Internship', 'Training']
      };
    });

    return NextResponse.json({
      internships,
      total: 500, // Estimate for internships
      page,
      limit: clientSideLimit,
      hasMore: internships.length === clientSideLimit,
      currentCount: internships.length
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching internships', internships: [] },
      { status: 500 }
    );
  }
}