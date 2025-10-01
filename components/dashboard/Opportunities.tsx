'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Briefcase, MapPin, Clock, ExternalLink, Search, Loader2, Home, Users } from "lucide-react"
import { useState, useEffect } from "react"

interface Opportunity {
  id: string
  title: string
  company: string
  location: string
  type: 'Job' | 'Internship' | 'Volunteer'
  workType: 'Remote' | 'On-site' | 'Hybrid'
  salary?: string
  description: string
  url?: string
  tags: string[]
  duration?: string
  dates?: string
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    type: 'all' as 'all' | 'jobs' | 'internships' | 'volunteers',
    remote: '' as '' | 'true' | 'false',
    company: '',
    excludeCompany: '',
    description: '',
    source: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests

  // Fetch opportunities from API with rate limiting
  const fetchOpportunities = async (resetData = false, pageToFetch = 1) => {
    try {
      // Rate limiting - wait if last request was too recent
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime
      if (timeSinceLastFetch < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastFetch))
      }

      if (resetData) {
        setLoading(true)
        setOpportunities([])
        setCurrentPage(1)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        type: filters.type,
        ...(filters.query && { query: filters.query }),
        ...(filters.location && { location: filters.location }),
        ...(filters.remote && { remote: filters.remote }),
        ...(filters.company && { company: filters.company }),
        ...(filters.excludeCompany && { excludeCompany: filters.excludeCompany }),
        ...(filters.description && { description: filters.description }),
        ...(filters.source && { source: filters.source })
      })

      setLastFetchTime(Date.now())
      const response = await fetch(`/api/opportunities?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch opportunities')
      }

      if (resetData) {
        setOpportunities(data.opportunities || [])
        setCurrentPage(pageToFetch)
      } else {
        // Filter out duplicates by ID before adding new opportunities
        const existingIds = new Set(opportunities.map(opp => opp.id))
        const newOpportunities = (data.opportunities || []).filter(opp => !existingIds.has(opp.id))
        setOpportunities(prev => [...prev, ...newOpportunities])
        setCurrentPage(pageToFetch)
      }

      // Use pagination info from the unified API response
      const pagination = data.pagination || {}
      setTotalPages(pagination.totalPages || 1)
      setHasMore(pagination.hasNextPage || false)

    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchOpportunities(true)
  }, [])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchOpportunities(true)
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      type: 'all',
      remote: '',
      company: '',
      excludeCompany: '',
      description: '',
      source: ''
    })
    // Auto-apply cleared filters
    setTimeout(() => fetchOpportunities(true), 100)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOpportunities(true)
  }

  const loadMore = () => {
    if (!loadingMore && hasMore && currentPage < totalPages) {
      fetchOpportunities(false, currentPage + 1)
    }
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      fetchOpportunities(true, pageNumber)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Internship': return 'bg-blue-100 text-blue-800'
      case 'Job': return 'bg-purple-100 text-purple-800'
      case 'Volunteer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Opportunities</h1>
          <p className="text-muted-foreground mt-2">Discover internships and job opportunities.</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={() => fetchOpportunities(true)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Opportunities</h1>
        <p className="text-muted-foreground mt-2">Discover jobs, internships, and volunteer opportunities with advanced filtering by location, company, remote work, and more.</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, skills..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <select 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="jobs">Jobs</option>
                <option value="internships">Internships</option>
                <option value="volunteers">Volunteers</option>
              </select>
              
              {filters.type !== 'volunteers' && (
                <input
                  type="text"
                  placeholder="Location (e.g., New York, Remote)"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              
              {filters.type !== 'volunteers' && (
                <select 
                  value={filters.remote} 
                  onChange={(e) => handleFilterChange('remote', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Work Types</option>
                  <option value="true">Remote Only</option>
                  <option value="false">On-site Only</option>
                </select>
              )}
              
              {filters.type !== 'volunteers' && (
                <input
                  type="text"
                  placeholder="Company (e.g., Google, Microsoft)"
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filters.type !== 'volunteers' && (
                <select 
                  value={filters.source} 
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Job Boards</option>
                  <option value="workday">Workday</option>
                  <option value="greenhouse">Greenhouse</option>
                  <option value="lever.co">Lever</option>
                  <option value="smartrecruiters">SmartRecruiters</option>
                  <option value="workable">Workable</option>
                  <option value="bamboohr">BambooHR</option>
                  <option value="icims">iCIMS</option>
                  <option value="successfactors">SuccessFactors</option>
                </select>
              )}
              
              {filters.type !== 'volunteers' && (
                <input
                  type="text"
                  placeholder="Exclude Company (e.g., Avoid this company)"
                  value={filters.excludeCompany}
                  onChange={(e) => handleFilterChange('excludeCompany', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  title="Exclude jobs from specific companies"
                />
              )}
              
              {filters.type !== 'volunteers' && (
                <input
                  type="text"
                  placeholder="Description keywords (e.g., JavaScript, React)"
                  value={filters.description}
                  onChange={(e) => handleFilterChange('description', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  title="Search within job descriptions"
                />
              )}
              
              <Button type="button" onClick={applyFilters} variant="outline" disabled={loading}>
                Apply All Filters
              </Button>
              
              <Button type="button" onClick={clearFilters} variant="ghost" disabled={loading}>
                Clear Filters
              </Button>
            </div>
            
            {/* Volunteer-specific note */}
            {filters.type === 'volunteers' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📍 <strong>Note:</strong> Volunteer opportunities are currently available in Canada only.
                </p>
              </div>
            )}
            
            {/* Filter Summary */}
            {(filters.query || (filters.type !== 'volunteers' && filters.location) || (filters.type !== 'volunteers' && filters.remote) || (filters.type !== 'volunteers' && filters.company) || (filters.type !== 'volunteers' && filters.excludeCompany) || (filters.type !== 'volunteers' && filters.description) || (filters.type !== 'volunteers' && filters.source) || filters.type !== 'all') && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.type !== 'all' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Type: {filters.type}
                  </span>
                )}
                {filters.query && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Search: {filters.query}
                  </span>
                )}
                {filters.location && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Location: {filters.location}
                  </span>
                )}
                {filters.remote && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Remote: {filters.remote === 'true' ? 'Yes' : 'No'}
                  </span>
                )}
                {filters.company && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Company: {filters.company}
                  </span>
                )}
                {filters.excludeCompany && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Exclude: {filters.excludeCompany}
                  </span>
                )}
                {filters.description && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Keywords: {filters.description}
                  </span>
                )}
                {filters.source && filters.type !== 'volunteers' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Source: {filters.source}
                  </span>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {loading && opportunities.length === 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading opportunities...
              </span>
            ) : (
              `${opportunities.length} Opportunities Found`
            )}
          </h2>
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        
        <div className="grid gap-6">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{typeof opportunity.title === 'string' ? opportunity.title : String(opportunity.title)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(opportunity.type)}`}>
                        {opportunity.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-medium">{typeof opportunity.company === 'string' ? opportunity.company : String(opportunity.company)}</p>
                  </div>
                  {opportunity.url && (
                    <Button size="sm" asChild>
                      <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                        Apply Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{typeof opportunity.location === 'string' ? opportunity.location : String(opportunity.location)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      opportunity.workType === 'Remote' ? 'bg-green-100 text-green-800' :
                      opportunity.workType === 'Hybrid' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {opportunity.workType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.type}</span>
                  </div>
                </div>

                {/* Volunteer-specific information */}
                {opportunity.type === 'Volunteer' && (opportunity.duration || opportunity.dates) && (
                  <div className="grid gap-3 md:grid-cols-2 mb-4 text-sm">
                    {opportunity.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{opportunity.duration}</span>
                      </div>
                    )}
                    {opportunity.dates && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{opportunity.dates}</span>
                      </div>
                    )}
                  </div>
                )}

                {opportunity.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {typeof opportunity.description === 'string' ? opportunity.description : String(opportunity.description)}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {opportunity.tags && Array.isArray(opportunity.tags) && opportunity.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {typeof tag === 'string' ? tag : String(tag)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {opportunities.length === 0 && !loading && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No opportunities found. Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  disabled={loading}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Page Info */}
      <div className="text-center text-sm text-muted-foreground py-2">
        Page {currentPage} of {totalPages} • Showing {opportunities.length} opportunities
      </div>

      {/* Load More */}
      {hasMore && currentPage < totalPages && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={loadMore} 
            disabled={loading || loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              `Load More Opportunities (Page ${currentPage + 1})`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}