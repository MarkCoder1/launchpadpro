import { NextRequest, NextResponse } from "next/server";

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
  job_location_pattern_or?: string[];
  remote?: boolean;
  company_name_case_insensitive_or?: string[];
  job_description_contains_or?: string[];
  url_domain_or?: string[];
};

// GET /api/opportunities/jobs - Fetch jobs from TheirStack
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const remote = searchParams.get('remote'); // 'true' | 'false' | null
    const company = searchParams.get('company') || '';
    const description = searchParams.get('description') || '';
    const source = searchParams.get('source') || '';

    const theirstackKey = process.env.THEIRSTACK_API_KEY;
    if (!theirstackKey) {
      return NextResponse.json(
        { error: 'TheirStack API key not configured (set THEIRSTACK_API_KEY)' },
        { status: 500 }
      );
    }

    // Build TheirStack search body (page is 0-based)
    const body: TheirStackSearchBody = {
      page: Math.max(0, page - 1),
      limit,
      posted_at_max_age_days: 7,
    };

    if (query) body.job_title_or = [query];
    if (location) body.job_location_pattern_or = [location];
    if (remote === 'true') body.remote = true;
    if (remote === 'false') body.remote = false;
    if (company) body.company_name_case_insensitive_or = [company];
    if (description) body.job_description_contains_or = [description];
    if (source) body.url_domain_or = [source];

    console.log('Fetching jobs from TheirStack with body:', JSON.stringify(body));

    const response = await fetch('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${theirstackKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('TheirStack jobs response error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from TheirStack', jobs: [] },
        { status: response.status }
      );
    }

    const tsData: { data?: TheirStackJob[]; metadata?: { total_results?: number } } = await response.json();
    const rows: TheirStackJob[] = Array.isArray(tsData?.data) ? tsData.data! : [];
    console.log('TheirStack jobs received:', rows.length);

    const jobs = rows.map((job: TheirStackJob, index: number) => {
      const uniqueId = `job-${job.id ?? `${Date.now()}-${index}`}-p${page}-${index}`;
      const workType = job.remote ? 'Remote' : (job.hybrid ? 'Hybrid' : 'On-site');
      const loc = job.remote ? 'Remote' : (job.locations?.[0]?.display_name || 'Not specified');
      const tagsFromTech = Array.isArray(job.technology_slugs) ? job.technology_slugs.slice(0, 5) : [];
      const tags = tagsFromTech.length > 0 ? tagsFromTech : extractTags(job.description || '');

      return {
        id: uniqueId,
        title: job.job_title || 'Software Developer',
        company: job.company_object?.name || job.company_domain || job.company_object?.domain || 'Unknown Company',
        location: loc,
        type: 'Job' as const,
        workType,
        description: job.description ? job.description.substring(0, 200) + '...' : '',
        url: job.final_url || job.url || job.source_url || undefined,
        tags: tags.length > 0 ? tags : ['Technology', 'Engineering']
      };
    });

    const total = tsData?.metadata?.total_results ?? (page - 1) * limit + jobs.length;
    const hasMore = jobs.length === limit;

    return NextResponse.json({
      jobs,
      total,
      page,
      limit,
      hasMore,
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