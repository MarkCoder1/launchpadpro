'use client';

import InternshipCard from '@/components/InternshipCard';
import { useEffect, useState } from 'react';
import { getInternships } from '../../../utils/get_internships';
import { getJobs } from '@/utils/get_jobs';
import JobCard from '@/components/JobCard';
import SearchFilters from '../../../components/SearchFilters';
import TotalResults from '@/components/TotalResults';
import Pagination from '@/components/Pagination';
import Loading from '@/components/Loading';
import { ClearSearchFilters } from '@/utils/ClearSearchFilters';
import { getScholarships } from '@/utils/get_scholarships';
import ScholarshipCard from '@/components/ScholarshipCard';

export default function SearchWithFilters() {

    const [filters, setFilters] = useState<SearchFilters>({
        type: 'internship',
        country: 'United States',
        keyword: '',
        postDate: '',
        offset: 0,
        LogicalOperator: 'AND',
        isRemote: false
    });


    const [internships, setInternships] = useState<Internship[]>([]);
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);


    const handleFilterChange = async (key: keyof SearchFilters, value: string) => {
        const updatedFilters = { ...filters, [key]: value, offset: 0 };
        setFilters(updatedFilters);

        if (key !== "keyword" && key !== "postDate") handleSearch(updatedFilters);
    };



    const handleSearch = async (passedFilters?: SearchFilters) => {
        const activeFilters = passedFilters || filters;

        console.log("typos", activeFilters.type);
        setLoading(true);

        try {
            if (!activeFilters.keyword && !activeFilters.country) {
                alert('Please enter at least a keyword or select a country');
                setLoading(false);
                return;
            }

            if (activeFilters.type === "internship") {
                await getInternships(activeFilters, setTotalResults, setInternships);
            } else if (activeFilters.type === "job") {
                await getJobs(activeFilters, setTotalResults, setJobs);
            } else if (activeFilters.type === "scholarship") {
                const page = activeFilters.offset / 10 + 1;
                await getScholarships(page, activeFilters, setTotalResults, setScholarships);
            }

        } catch (error) {
            console.error('Search error:', error);
            alert('An unexpected error occurred during search');
            setInternships([]);
            setJobs([]);
            setScholarships([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    };





    useEffect(() => {
        handleSearch();
    }, [])

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Search Opportunities
                </h1>

                {/* Search Filters */}
                <SearchFilters
                    filters={filters}
                    loading={loading}
                    handleFilterChange={handleFilterChange}
                    handleSearch={handleSearch}
                    clearFilters={() =>
                        ClearSearchFilters({
                            setFilters,
                            setInternships,
                            setJobs,
                            setScholarships,
                            setTotalResults
                        })
                    }
                />

                {/*Pagination */}
                <Pagination setFilters={setFilters} filters={filters} handleSearch={handleSearch} totalResults={totalResults} />

                {/* Results Header */}
                <TotalResults totalResults={totalResults} />

                {/* Loading State */}
                {loading && <Loading />}

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filters.type === 'internship' && internships.map((item, idx) => (
                        <InternshipCard key={item.id || idx} internship={item} />
                    ))}

                    {(filters.type === 'job' && jobs.length > 0) && jobs.map((item, idx) => (
                        <JobCard key={item.id || idx} job={item} />
                    ))}

                    {(filters.type === 'scholarship' && scholarships.length > 0) && scholarships.map((item, idx) => (
                        <ScholarshipCard scholarship={item} key={idx} />
                    ))}

                </div>

                {/* No Results */}
                {!loading && internships.length === 0 && totalResults === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            No results found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your search filters or keywords
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}