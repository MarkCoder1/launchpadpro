import { formatDate } from '@/utils/dateformat';
import Image from 'next/image';

type InternshipCardProps = {
    internship: Internship;
};

function InternshipCard({ internship }: InternshipCardProps) {
    const location = internship.locations_derived?.[0] || 'Location not specified';

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">INTERNSHIP</span>
                <span className="text-xs text-gray-500">Posted {formatDate(internship.date_posted)}</span>
            </div>
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                    {internship.organization_logo ? (
                        <Image
                            src={internship.organization_logo}
                            alt={`${internship.organization} logo`}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                    ) : (
                        <div className="w-15 h-15 bg-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-gray-600 text-xs font-medium">
                                {internship.organization.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{internship.title}</h3>
                    <p className="text-lg text-gray-700 font-medium mb-2">{internship.organization}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">📍 {location}</span>
                        <span className="flex items-center gap-1">📅 Posted {formatDate(internship.date_posted)}</span>
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    {internship.linkedin_org_size && <span>🏢 {internship.linkedin_org_size}</span>}
                    {internship.linkedin_org_industry && <span>🏭 {internship.linkedin_org_industry}</span>}
                    {internship.linkedin_org_headquarters && <span>📍 HQ: {internship.linkedin_org_headquarters}</span>}
                </div>
                {internship.linkedin_org_slogan && (
                    <p className="text-sm text-gray-600 italic mb-2">"{internship.linkedin_org_slogan}"</p>
                )}
            </div>
            <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                    {internship.employment_type.map((type, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {type}
                        </span>
                    ))}
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {internship.seniority}
                    </span>
                </div>
                <p className="text-sm text-gray-600">Valid until: {formatDate(internship.date_validthrough)}</p>
            </div>
            {internship.recruiter_name && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">👤 {internship.recruiter_name}</p>
                    {internship.recruiter_title && (
                        <p className="text-xs text-gray-600 mt-1">{internship.recruiter_title}</p>
                    )}
                </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                    href={internship.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                    View on LinkedIn
                </a>
                {internship.external_apply_url && (
                    <a
                        href={internship.external_apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                        Apply Direct
                    </a>
                )}
                {internship.organization_url && (
                    <a
                        href={internship.organization_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 items-center flex"
                    >
                        Company
                    </a>
                )}
            </div>
        </div>
    );
}

export default InternshipCard;