'use client';

import InternshipCard from '@/components/InternshipCard';
import { countries } from '@/utils/countries';
import { useEffect, useState } from 'react';


export default function SearchWithFilters() {
    const [filters, setFilters] = useState<SearchFilters>({
        type: 'internship',
        country: 'United States',
        keyword: '',
        postDate: '',
        offset: 0,
    });

    const [internships, setInternships] = useState<Internship[]>([]);
    const [scholarships, setScholarships] = useState<[]>([]);
    const [remoteJobs, setRemoteJobs] = useState<[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);


    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            console.log('Current filters state:', filters);

            // Validate filters before sending
            if (!filters.keyword && !filters.country) {
                alert('Please enter at least a keyword or select a country');
                setLoading(false);
                return;
            }

            if (filters.type === "internship") {
                console.log("Searching for internships...");

                // Prepare the request data
                const requestData = {
                    keyword: filters.keyword || '',
                    country: filters.country || '',
                    postDate: filters.postDate || '',
                    offset: filters.offset || 0,
                };

                console.log("Sending request data:", requestData);

                const response = await fetch('/api/internships', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                console.log("Response status:", response.status);
                console.log("Response headers:", Object.fromEntries(response.headers.entries()));

                // Get response text first to see what we're getting
                const responseText = await response.text();

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch {
                        errorData = { error: responseText };
                    }

                    console.error("API Error Response:", errorData);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
                }

                // Parse the response
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("JSON Parse Error:", parseError);
                    throw new Error("Invalid JSON response from server");
                }

                console.log("Parsed API Response:", data);

                // Handle the response based on the actual API structure
                if (data.error) {
                    throw new Error(data.error);
                }

                // Update results based on the actual response structure
                // You might need to adjust this based on what the API actually returns
                if (data && Array.isArray(data)) {
                    setInternships(data);
                    setTotalResults(data.length);
                } else if (data && data.internships && Array.isArray(data.internships)) {
                    setInternships(data.internships);
                    setTotalResults(data.internships.length);
                } else if (data && data.data && Array.isArray(data.data)) {
                    setInternships(data.data);
                    setTotalResults(data.data.length);
                } else {
                    console.log("Unexpected response structure:", data);
                    setInternships([]);
                    setTotalResults(0);
                }
            }

        } catch (error) {
            console.error('Search error:', error);

            if (error instanceof Error) {
                console.error('Error message:', error.message);
                // Show user-friendly error message
                alert(`Search failed: ${error.message}`);
            } else {
                console.error('Unknown error:', error);
                alert('An unexpected error occurred during search');
            }

            setInternships([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    };


    const clearFilters = () => {
        setFilters({
            type: '',
            country: '',
            keyword: '',
            postDate: '',
            offset: 0,
        });
        setInternships([]);
        setTotalResults(0);
    };

    useEffect(() => {
        handleSearch();
    }, [filters.offset]);


    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Search Opportunities
                </h1>

                {/* Search Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="internship">Internship</option>
                                <option value="scholarship">Scholarship</option>
                                <option value="remote-job">Remote Job</option>
                            </select>
                        </div>

                        {/* Country Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                            </label>
                            <select
                                value={filters.country}
                                onChange={(e) => handleFilterChange('country', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {countries.map(country => (
                                    <option key={country.name} value={country.name}>{country.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Keyword Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Keyword
                            </label>
                            <input
                                type="text"
                                value={filters.keyword}
                                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                                placeholder="Search keywords..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Post Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Posted After
                            </label>
                            <input
                                type="date"
                                value={filters.postDate}
                                onChange={(e) => handleFilterChange('postDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Search Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Results Header */}
                {totalResults > 0 && (
                    <div className="mb-6">
                        <p className="text-gray-600">
                            Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-4 my-6">
                    <button
                        onClick={() => {
                            if (filters.offset >= 10) {
                                setFilters(prev => ({ ...prev, offset: prev.offset - 10 }));
                                handleSearch(); // manually re-trigger search
                            }
                        }}
                        disabled={filters.offset === 0}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span>Page {Math.floor(filters.offset / 10) + 1}</span>
                    <button
                    disabled={internships.length < 10}
                        onClick={() => {
                            setFilters(prev => ({ ...prev, offset: prev.offset + 10 }));
                            handleSearch();
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filters.type === 'internship' && internships.map((item, idx) => (
                        <InternshipCard key={item.id || idx} internship={item} />
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