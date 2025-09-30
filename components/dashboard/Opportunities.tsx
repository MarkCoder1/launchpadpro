import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink } from "lucide-react"

export default function Opportunities() {
  const opportunities = [
    {
      title: "Frontend Developer Intern",
      company: "TechCorp",
      location: "Remote",
      type: "Internship",
      salary: "$15/hour",
      deadline: "2 weeks left",
      tags: ["React", "JavaScript", "CSS"]
    },
    {
      title: "Data Science Scholarship",
      company: "University of Tech",
      location: "New York, NY",
      type: "Scholarship",
      salary: "$5,000",
      deadline: "1 month left",
      tags: ["Python", "Machine Learning", "Statistics"]
    },
    {
      title: "Junior Software Engineer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$75,000",
      deadline: "3 days left",
      tags: ["Node.js", "React", "MongoDB"]
    },
    {
      title: "UX Design Bootcamp",
      company: "Design Academy",
      location: "Online",
      type: "Training",
      salary: "Free",
      deadline: "1 week left",
      tags: ["Figma", "User Research", "Prototyping"]
    }
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Internship': return 'bg-blue-100 text-blue-800'
      case 'Scholarship': return 'bg-green-100 text-green-800'
      case 'Full-time': return 'bg-purple-100 text-purple-800'
      case 'Training': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Opportunities</h1>
        <p className="text-muted-foreground mt-2">Discover internships, scholarships, jobs, and training programs.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <select className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Types</option>
              <option value="internship">Internships</option>
              <option value="scholarship">Scholarships</option>
              <option value="full-time">Full-time Jobs</option>
              <option value="training">Training Programs</option>
            </select>
            
            <select className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Locations</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
            
            <select className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Fields</option>
              <option value="tech">Technology</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
            </select>
            
            <Button>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{opportunities.length} Opportunities Found</h2>
          <Button variant="outline">Sort by Relevance</Button>
        </div>
        
        <div className="grid gap-6">
          {opportunities.map((opportunity, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(opportunity.type)}`}>
                        {opportunity.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-medium">{opportunity.company}</p>
                  </div>
                  <Button size="sm">
                    Apply Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.salary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.type}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {opportunity.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Opportunities</Button>
      </div>
    </div>
  )
}