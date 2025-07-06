import React from 'react'

const Pagination = ({ setFilters, filters, handleSearch, totalResults }: {
    setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
    , filters: SearchFilters, handleSearch: () => void, totalResults: number
}) => {
    return (
        <div className="flex items-center gap-4 my-6">
            <button
                onClick={() => {
                    if (filters.offset >= 10) {
                        setFilters(prev => ({ ...prev, offset: prev.offset - 10 }));
                        handleSearch()
                    }
                }}
                disabled={filters.offset === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
                Previous
            </button>
            <span>Page {Math.floor(filters.offset / 10) + 1}</span>
            <button
                disabled={totalResults <= 1}
                onClick={() => {
                    setFilters(prev => ({ ...prev, offset: prev.offset + 10 }));
                    try {
                        handleSearch();
                    } catch (e) {
                        setFilters(prev => ({ ...prev, offset: prev.offset - 10 }));
                        console.log("errorer ", e);
                    }
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
                Next
            </button>
        </div>
    )
}

export default Pagination
