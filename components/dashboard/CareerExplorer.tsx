import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Search, Star, Bookmark } from "lucide-react"

export default function CareerExplorer() {
  const careers = [
    { title: "Software Engineer", match: "95%", salary: "$85,000", growth: "22%" },
    { title: "Data Scientist", match: "90%", salary: "$95,000", growth: "35%" },
    { title: "UX Designer", match: "85%", salary: "$75,000", growth: "18%" },
    { title: "Product Manager", match: "82%", salary: "$105,000", growth: "15%" },
  ]

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
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search careers by title, skills, or industry..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>Search</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Popular:</span>
            <Button variant="outline" size="sm">Technology</Button>
            <Button variant="outline" size="sm">Healthcare</Button>
            <Button variant="outline" size="sm">Finance</Button>
            <Button variant="outline" size="sm">Education</Button>
          </div>
        </CardContent>
      </Card>

      {/* Career Matches */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Career Matches</h2>
        <div className="grid gap-4">
          {careers.map((career, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{career.title}</h3>
                    <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                      <span>Avg. Salary: {career.salary}</span>
                      <span>Growth: {career.growth}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{career.match}</div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
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
    </div>
  )
}