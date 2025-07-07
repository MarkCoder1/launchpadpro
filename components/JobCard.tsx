import { formatDate } from '@/utils/dateformat';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';


type JobCardProps = {
  job: Job;
};
function JobCard({ job }: JobCardProps) {
  const location = job.locations_derived?.[0] || 'Location not specified';
  const organizationLogo = job.organization_logo;
  const organizationUrl = job.organization_url || job.url;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">{job.remote_derived ? "Remote" : ""} job</span>
        <span className="text-xs text-gray-500">Posted {formatDate(job.date_posted)}</span>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {organizationLogo ? (
            <Link href={organizationUrl} target="_blank" rel="noopener noreferrer">
              <Image
                src={organizationLogo}
                alt={`${job.organization} logo`}
                width={60}
                height={60}
                className="rounded-lg object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </Link>
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {job.organization.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
          <p className="text-lg text-gray-700 font-medium mb-2">{job.organization}</p>
          {job.organization_url && <Link href={job.organization_url} target="_blank" className="translate-y-5px">
            <ExternalLink size={20} />
          </Link>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">📍 {location}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {job.employment_type ? job.employment_type.map((type, i) =>
          (<span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {type}</span>))
            : <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Unknown
            </span>}
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            {job.remote_derived ? "Remote" : "On-site"}
          </span>

        </div>
        <p className="text-sm text-gray-600">Valid until: {formatDate(job.date_validthrough)}</p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          View Job
        </a>
        {job.organization_url && job.organization_url !== job.url && (
          <a
            href={job.organization_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
          >
            Company Site
          </a>
        )}
      </div>
    </div>
  );
}

export default JobCard;
