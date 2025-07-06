import { extractCountryName } from "@/utils/ExtractCountryName";

type ScholarshipCardProps = {
    scholarship: Scholarship;
};

function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Scholarship
                </span>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {scholarship.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                    {scholarship.snippet}
                </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                    href={scholarship.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200"
                >
                    View Scholarship
                </a>
            </div>
        </div >
    );
}

export default ScholarshipCard;