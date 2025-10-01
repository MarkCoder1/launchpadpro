import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { User, Mail, Phone, MapPin, Calendar, Edit, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import EditProfileModal from "./EditProfileModal"
import DeleteAccountModal from "./DeleteAccountModal"

export default function Profile() {
  const { data: session, update } = useSession()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Fetch fresh user data from database
  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
      } else {
        console.error('Failed to fetch user data')
        // Fallback to session data
        setUserData(session?.user || null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Fallback to session data
      setUserData(session?.user || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchUserData()
    }
  }, [session])

  const handleEditSuccess = async (updatedUser) => {
    // Update local state
    setUserData(updatedUser)
    
    // Update session data
    await update({
      ...session,
      user: {
        ...session?.user,
        ...updatedUser
      }
    })
  }

  const displayData = userData || session?.user

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and preferences.</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold">{displayData?.name || 'Your Name'}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{displayData?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Email</p>
                <p className="text-muted-foreground text-sm truncate">{displayData?.email || 'email@example.com'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Phone</p>
                <p className="text-muted-foreground text-sm">{displayData?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Location</p>
                <p className="text-muted-foreground text-sm">{displayData?.location || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Joined</p>
                <p className="text-muted-foreground text-sm">
                  {displayData?.createdAt ? new Date(displayData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Date not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Skills & Interests
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Technical Skills</h4>
              <div className="flex gap-2 flex-wrap">
                {['JavaScript', 'React', 'Node.js', 'Python', 'SQL'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Soft Skills</h4>
              <div className="flex gap-2 flex-wrap">
                {['Communication', 'Leadership', 'Problem Solving', 'Teamwork'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Interests</h4>
              <div className="flex gap-2 flex-wrap">
                {['Web Development', 'AI/ML', 'Data Science', 'Startups'].map((interest) => (
                  <span key={interest} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education & Experience */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              Education
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold text-sm sm:text-base">Bachelor of Computer Science</h4>
                <p className="text-muted-foreground text-sm">University of Technology</p>
                <p className="text-xs sm:text-sm text-muted-foreground">2020 - 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              Experience
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold text-sm sm:text-base">Software Engineering Intern</h4>
                <p className="text-muted-foreground text-sm">TechCorp Inc.</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Summer 2023</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="w-full sm:w-auto text-sm">
              Download Profile Data
            </Button>
            <Button variant="outline" className="w-full sm:w-auto text-sm">
              Export CV
            </Button>
          </div>
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto text-sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              This action cannot be undone. This will permanently delete your account and all associated data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={displayData}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userEmail={displayData?.email}
      />
    </div>
  )
}