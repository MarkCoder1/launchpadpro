import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { FileText, Download, Edit, Plus } from "lucide-react"

export default function CVBuilder() {
  const cvTemplates = [
    { name: "Professional", preview: "Modern and clean design", color: "blue" },
    { name: "Creative", preview: "Eye-catching and unique", color: "purple" },
    { name: "Minimal", preview: "Simple and elegant", color: "gray" },
    { name: "Executive", preview: "Professional for senior roles", color: "green" },
  ]

  const savedCVs = [
    { name: "Software Engineer CV", lastModified: "2 days ago", status: "Draft" },
    { name: "Data Analyst CV", lastModified: "1 week ago", status: "Complete" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CV Builder</h1>
        <p className="text-muted-foreground mt-2">Create professional resumes that get you noticed.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start from scratch with our AI-powered CV builder.
            </p>
            <Button className="w-full">Create New CV</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Upload Existing CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload your current CV and let us enhance it.
            </p>
            <Button variant="outline" className="w-full">Upload CV</Button>
          </CardContent>
        </Card>
      </div>

      {/* Saved CVs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your CVs</h2>
        {savedCVs.length > 0 ? (
          <div className="grid gap-4">
            {savedCVs.map((cv, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{cv.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last modified: {cv.lastModified}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cv.status === 'Complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cv.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No CVs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first professional CV to get started.
              </p>
              <Button>Create Your First CV</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">CV Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cvTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`h-32 bg-gradient-to-br from-${template.color}-100 to-${template.color}-200 rounded-lg mb-3 flex items-center justify-center`}>
                  <FileText className={`h-8 w-8 text-${template.color}-600`} />
                </div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.preview}</p>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}