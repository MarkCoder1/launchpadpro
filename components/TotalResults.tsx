import React from 'react'

const TotalResults = ({totalResults}: {totalResults: number}) => {
    return (
        <div>
            {totalResults > 0 && (
                <div className="mb-6">
                    <p className="text-gray-600">
                        Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    )
}

export default TotalResults
