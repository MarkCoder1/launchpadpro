'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Search, Loader2, TrendingUp, DollarSign, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import CareerDetailsModal from "./CareerDetailsModal"

interface Career {
  title: string
  industry: string
  keySkills: string[]
  avgSalary: {
    currency: string
    low: number
    high: number
  }
  growthRate: string
  demandLevel: "High" | "Moderate" | "Low"
  description: string
  sources: string[]
}

export default function CareerExplorer() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // Modal state
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Mobile popular buttons state
  const [showPopularButtons, setShowPopularButtons] = useState(false)

  // Load default careers on component mount
  useEffect(() => {
    searchCareers("in-demand jobs 2025")
  }, [])

  const searchCareers = async (query: string) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/ai/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch career recommendations')
      }

      const data = await response.json()
      setCareers(data)
    } catch (err) {
      console.error('Error fetching careers:', err)
      setError('Failed to load career recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchCareers(searchQuery.trim())
    }
  }

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query)
    searchCareers(query)
  }

  const formatSalary = (salary: Career['avgSalary']) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return `${formatter.format(salary.low)} - ${formatter.format(salary.high)}`
  }

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-green-600 bg-green-100'
      case 'Moderate': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleFindJobs = (career: Career) => {
    // Create a more targeted search query using career title and key skills
    const searchTerms = [career.title]
    const searchQuery = searchTerms.join(' ')

    // Navigate to opportunities page with pre-filled search for this career
    const searchParams = new URLSearchParams({
      search: searchQuery,
      type: 'jobs', // Filter to jobs specifically
      location: '' // User can fill this in on the opportunities page
    })

    router.push(`/dashboard?component=opportunities&${searchParams.toString()}`)
  }

  const handleViewDetails = (career: Career) => {
    setSelectedCareer(career)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCareer(null)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Career Explorer</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Discover careers that match your skills and interests.</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Search className="h-5 w-5 mr-2" />
            Find Your Perfect Career
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search careers by title, skills, or industry..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{loading ? 'Searching...' : 'Search'}</span>
            </Button>
          </form>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
            <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground min-w-[70px]">Popular:</span>
              {/* Mobile toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPopularButtons(!showPopularButtons)}
                className="sm:hidden flex items-center gap-1 p-2 h-auto text-xs"
              >
                <span>{showPopularButtons ? 'Hide' : 'Show'}</span>
                {showPopularButtons ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>

            {/* Desktop: Always visible, Mobile: Collapsible */}
            <div className={`flex flex-wrap gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto transition-all duration-300 ease-in-out overflow-hidden ${showPopularButtons ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 sm:max-h-96 sm:opacity-100'
              } sm:block`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('technology careers')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Technology
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('healthcare jobs')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Healthcare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('finance careers')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Finance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('education jobs')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Education
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('Public Services')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Public Services
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch('engineering')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Engineering
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Matches */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Career Recommendations</h2>
          {careers.length > 0 && (
            <span className="text-sm text-muted-foreground">{careers.length} careers found</span>
          )}
        </div>

        {error && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchCareers("in-demand jobs 2025")}
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Finding the best career matches for you...</p>
            </CardContent>
          </Card>
        )}

        {!loading && careers.length === 0 && !error && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No careers found. Try a different search term.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {careers.map((career, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{career.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {career.industry}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{career.description}</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{formatSalary(career.avgSalary)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span>{career.growthRate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDemandColor(career.demandLevel)}`}>
                          {career.demandLevel} Demand
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {career.keySkills && career.keySkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Key Skills:</p>
                    <div className="flex gap-2 flex-wrap">
                      {career.keySkills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(career)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFindJobs(career)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Find Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Career Quiz CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Not sure what career fits you?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Take our AI-powered career assessment to discover careers that match your personality, skills, and interests.
          </p>
          <Button>Take Career Quiz</Button>
        </CardContent>
      </Card>

      {/* Career Details Modal */}
      <CareerDetailsModal
        career={selectedCareer}
        isOpen={showModal}
        onClose={closeModal}
        onFindJobs={handleFindJobs}
      />
    </div>
  )
}