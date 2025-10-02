'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { X, BookOpen, Target, TrendingUp, Users, Clock, Award, ExternalLink, DollarSign, Loader2 } from "lucide-react"

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

interface CareerDetails {
  title: string
  overview: string
  education: string[]
  keySkills: string[]
  entryPath: string[]
  careerProgression: string[]
  resources: string[]
  futureOutlook: string
}

interface CachedCareerDetails {
  data: CareerDetails
  timestamp: number
}

interface CareerDetailsModalProps {
  career: Career | null
  isOpen: boolean
  onClose: () => void
  onFindJobs: (career: Career) => void
}

export default function CareerDetailsModal({ career, isOpen, onClose, onFindJobs }: CareerDetailsModalProps) {
  const [careerDetails, setCareerDetails] = useState<CareerDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  
  // Cache to store fetched career details with timestamps
  const [detailsCache, setDetailsCache] = useState<Map<string, CachedCareerDetails>>(new Map())
    
  // Cache configuration
  const CACHE_EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes
  const MAX_CACHE_SIZE = 50 // Maximum number of cached entries

  // Clean expired entries from cache
  const cleanExpiredCache = () => {
    const now = Date.now()
    const newCache = new Map()
    
    detailsCache.forEach((value, key) => {
      if ((now - value.timestamp) < CACHE_EXPIRY_TIME) {
        newCache.set(key, value)
      }
    })
    
    if (newCache.size !== detailsCache.size) {
      setDetailsCache(newCache)
      console.log(`Cleaned ${detailsCache.size - newCache.size} expired cache entries`)
    }
  }

  // Force refresh data (bypass cache)
  const forceRefresh = () => {
    if (career) {
      const cacheKey = career.title.toLowerCase().trim()
      const newCache = new Map(detailsCache)
      newCache.delete(cacheKey) // Remove from cache
      setDetailsCache(newCache)
      fetchCareerDetails(career.title) // Fetch fresh data
    }
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

  const fetchCareerDetails = async (careerTitle: string) => {
    // Check if details are already cached and not expired
    const cacheKey = careerTitle.toLowerCase().trim()
    const cachedEntry = detailsCache.get(cacheKey)
    const now = Date.now()
    
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_EXPIRY_TIME) {
      console.log(`Using cached details for: ${careerTitle} (cached ${Math.round((now - cachedEntry.timestamp) / 1000 / 60)} minutes ago)`)
      setCareerDetails(cachedEntry.data)
      setIsFromCache(true)
      return
    }

    setLoading(true)
    setError(null)
    setIsFromCache(false)
    
    try {
      console.log(`Fetching new details for: ${careerTitle}`)
      const response = await fetch('/api/ai/career-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ career: careerTitle }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch career details')
      }

      const details = await response.json()
      
      // Manage cache size - remove oldest entries if cache is full
      const newCache = new Map(detailsCache)
      if (newCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = newCache.keys().next().value
        newCache.delete(oldestKey)
      }
      
      // Store in cache with timestamp
      newCache.set(cacheKey, {
        data: details,
        timestamp: now
      })
      
      setDetailsCache(newCache)
      setCareerDetails(details)
    } catch (error) {
      console.error('Error fetching career details:', error)
      setError('Failed to load career details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Clean expired cache entries on component mount
  useEffect(() => {
    cleanExpiredCache()
  }, [])

  // Fetch details when modal opens with a career
  useEffect(() => {
    if (isOpen && career) {
      const cacheKey = career.title.toLowerCase().trim()
      const cachedEntry = detailsCache.get(cacheKey)
      const now = Date.now()
      
      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_EXPIRY_TIME) {
        // Use cached data immediately
        setCareerDetails(cachedEntry.data)
        setIsFromCache(true)
        setError(null)
      } else {
        // Fetch new data
        fetchCareerDetails(career.title)
      }
    }
  }, [isOpen, career, detailsCache])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCareerDetails(null)
      setError(null)
      setIsFromCache(false)
    }
  }, [isOpen])

  if (!isOpen || !career) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {career.title}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading career details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => fetchCareerDetails(career.title)}
              >
                Retry
              </Button>
            </div>
          ) : careerDetails ? (
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Overview
                </h3>
                <p className="text-gray-700">{careerDetails.overview}</p>
              </div>

              {/* Quick Stats from original career data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Salary Range</p>
                  <p className="font-semibold">{formatSalary(career.avgSalary)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="font-semibold">{career.growthRate}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Demand Level</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(career.demandLevel)}`}>
                    {career.demandLevel}
                  </span>
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Education & Training
                </h3>
                <ul className="space-y-2">
                  {careerDetails.education.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Skills */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Key Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {careerDetails.keySkills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Entry Path */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  How to Get Started
                </h3>
                <ul className="space-y-2">
                  {careerDetails.entryPath.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Career Progression */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Career Progression
                </h3>
                <div className="space-y-3">
                  {careerDetails.careerProgression.map((level, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mr-4"></div>
                      <span className="text-gray-700">{level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                  Learning Resources
                </h3>
                <ul className="space-y-2">
                  {careerDetails.resources.map((resource, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Future Outlook */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Future Outlook
                </h3>
                <p className="text-gray-700">{careerDetails.futureOutlook}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => onFindJobs(career)}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Find Jobs for This Career
                </Button>
                {isFromCache && (
                  <Button 
                    variant="outline" 
                    onClick={forceRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}