import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { User, Mail, Phone, MapPin, Calendar, Edit, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import EditProfileModal from "./EditProfileModal"
import DeleteAccountModal from "./DeleteAccountModal"
import SkillsModal from "./SkillsModal"
import EducationModal from "./EducationModal"
import ExperienceModal from "./ExperienceModal"

export default function Profile() {
  const { data: session, update } = useSession()
  const [userData, setUserData] = useState(null)
  const [skills, setSkills] = useState([])
  const [education, setEducation] = useState([])
  const [experience, setExperience] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false)
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false)

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

  const fetchUserSkills = async () => {
    try {
      const response = await fetch('/api/user/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills);
      } else {
        console.error('Failed to fetch user skills');
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    }
  };

  const fetchUserEducation = async () => {
    try {
      const response = await fetch('/api/user/education');
      if (response.ok) {
        const data = await response.json();
        setEducation(data.education);
      } else {
        console.error('Failed to fetch user education');
      }
    } catch (error) {
      console.error('Error fetching user education:', error);
    }
  };

  const fetchUserExperience = async () => {
    try {
      const response = await fetch('/api/user/experience');
      if (response.ok) {
        const data = await response.json();
        setExperience(data.experience);
      } else {
        console.error('Failed to fetch user experience');
      }
    } catch (error) {
      console.error('Error fetching user experience:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserData()
      fetchUserSkills()
      fetchUserEducation()
      fetchUserExperience()
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

  const handleExportCV = async () => {
    try {
      const response = await fetch('/api/cv/get');
      if (!response.ok) {
        throw new Error('Failed to fetch CV');
      }
      const data = await response.json();
      if (data.cv && data.cv.fileUrl) {
        window.open(data.cv.fileUrl, '_blank');
      } else {
        alert('No CV available to export.');
      }
    } catch (error) {
      console.error('Error exporting CV:', error);
      alert('Failed to export CV.');
    }
  };

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
            <Button variant="outline" size="sm" onClick={() => setIsSkillsModalOpen(true)}>
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
                {skills.filter(skill => skill.type === 'technical').map((skill) => (
                  <span key={skill.id} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
                {skills.filter(skill => skill.type === 'technical').length === 0 && (
                  <span className="text-muted-foreground text-sm">No technical skills added yet</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Soft Skills</h4>
              <div className="flex gap-2 flex-wrap">
                {skills.filter(skill => skill.type === 'soft').map((skill) => (
                  <span key={skill.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
                {skills.filter(skill => skill.type === 'soft').length === 0 && (
                  <span className="text-muted-foreground text-sm">No soft skills added yet</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Interests</h4>
              <div className="flex gap-2 flex-wrap">
                {skills.filter(skill => skill.type === 'interests').map((skill) => (
                  <span key={skill.id} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
                {skills.filter(skill => skill.type === 'interests').length === 0 && (
                  <span className="text-muted-foreground text-sm">No interests added yet</span>
                )}
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
              <Button variant="outline" size="sm" onClick={() => setIsEducationModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No education entries added yet</p>
                  <p className="text-xs mt-1">Click Edit to add your educational background</p>
                </div>
              ) : (
                education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold text-sm sm:text-base">{edu.degree}</h4>
                    <p className="text-muted-foreground text-sm">{edu.institution}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-muted-foreground text-xs">{edu.fieldOfStudy}</p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {' '}
                      {edu.isCurrently ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Not specified'}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-muted-foreground mt-1">{edu.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              Experience
              <Button variant="outline" size="sm" onClick={() => setIsExperienceModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experience.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No experience entries added yet</p>
                  <p className="text-xs mt-1">Click Edit to add your work experience</p>
                </div>
              ) : (
                experience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold text-sm sm:text-base">{exp.position}</h4>
                    <p className="text-muted-foreground text-sm">{exp.company}</p>
                    {exp.location && (
                      <p className="text-muted-foreground text-xs">{exp.location}</p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {' '}
                      {exp.isCurrently ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Not specified'}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                    )}
                  </div>
                ))
              )}
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
            <Button variant="outline" className="w-full sm:w-auto text-sm" onClick={handleExportCV}>
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

      {/* Skills Modal */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        skills={skills}
        onSkillsUpdate={fetchUserSkills}
      />

      {/* Education Modal */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        education={education}
        onEducationUpdate={fetchUserEducation}
      />

      {/* Experience Modal */}
      <ExperienceModal
        isOpen={isExperienceModalOpen}
        onClose={() => setIsExperienceModalOpen(false)}
        experience={experience}
        onExperienceUpdate={fetchUserExperience}
      />
    </div>
  )
}