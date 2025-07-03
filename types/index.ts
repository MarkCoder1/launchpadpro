interface SearchFilters {
  type: string;
  country: string;
  keyword: string;
  postDate: string;
  offset: number;
}

interface SearchResult {
  id: string;
  title: string;
  type: "internship" | "scholarship" | "remote-job";
  company: string;
  country: string;
  description: string;
  postDate: string;
  salary?: string;
  duration?: string;
  deadline?: string;
  tags: string[];
}

interface Internship {
  id: string;
  date_posted: string;
  title: string;
  organization: string;
  organization_url: string;
  date_validthrough: string;
  locations_derived: string[];
  employment_type: string[];
  url: string;
  external_apply_url: string | null;
  organization_logo: string;
  seniority: string;
  recruiter_name: string | null;
  recruiter_title: string | null;
  linkedin_org_size: string;
  linkedin_org_industry: string;
  linkedin_org_headquarters: string;
  linkedin_org_slogan: string | null;
}
