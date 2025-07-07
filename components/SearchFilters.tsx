import React from 'react'
import SelectElement from './SelectElement'
import { opportunitiesType } from '@/utils/opportunitesTypes'
import { countries } from '@/utils/countries'

const SearchFilters = ({ handleFilterChange, filters, handleSearch, loading, clearFilters }: { handleFilterChange: (arg0: keyof SearchFilters, arg1: string) => void, filters: SearchFilters, handleSearch: () => void, loading: boolean, clearFilters: () => void }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
                {/* Type Filter */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                        Type
                        {filters.type === "job" && <label>
                            <input className='mr-1' type="checkbox" onChange={() => handleFilterChange("isRemote", `${!filters.isRemote}`)} />
                            Remote
                        </label>}
                    </label>
                    <SelectElement
                        options={opportunitiesType.map(type => ({
                            name: type,
                        }))}
                        value={filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                        onChange={(val) => handleFilterChange('type', val)}
                        placeholder="Select type"
                    />

                </div>

                {/* Country Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                    </label>
                    <SelectElement options={countries} value={filters.country.charAt(0).toUpperCase() + filters.country.slice(1)}
                        onChange={(val) => handleFilterChange('country', val)} />
                </div>

                {/* Keyword Filter */}
                <div>
                    <div className='flex justify-between'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keyword
                        </label>
                        {filters.type !== "scholarship" && <div className='space-x-3'>
                            <label>
                                <input className='mr-1' type="checkbox" checked={filters.LogicalOperator === "AND"} onChange={() => handleFilterChange("LogicalOperator", "AND")} />
                                AND
                            </label>
                            <label >
                                <input className='mr-1' type="checkbox" checked={filters.LogicalOperator === "OR"} onChange={() => handleFilterChange("LogicalOperator", "OR")} />
                                OR
                            </label>
                        </div>}
                    </div>
                    <input
                        type="text"
                        value={filters.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                        placeholder="Search keywords..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-sky-400 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 x     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sky-500 hover:text-gray-800 transition-colors"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    )
}

export default SearchFilters
