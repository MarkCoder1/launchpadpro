interface SearchFilters {
  type: string;
  country: string;
  keyword: string;
  postDate: string;
  offset: number;
  LogicalOperator: string;
  isRemote: boolean
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
}

interface Job {
  id: string;
  date_posted: string;
  title: string;
  organization: string;
  organization_url: string;
  date_validthrough?: string;
  locations_derived?: string[];
  employment_type?: string[];
  url: string;
  organization_logo: string | null;
  remote_derived: boolean;
}

interface Scholarship {
  title: string;
  link: string;
  snippet: string;
}