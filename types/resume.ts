// Types for the resume JSON schema provided by the user

export type ResumeData = {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    title: string
    summary: string
    linkedin?: string
    website?: string
  }
  education: Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate?: string
    gpa?: string
    description?: string
  }>
  workExperience: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    description: string
    location?: string
    current?: boolean
  }>
  skills: Array<{
    name: string
    level?: string
    category?: string
  }>
  projects: Array<{
    name: string
    description?: string
    link?: string
    technologies?: string[]
    startDate?: string
    endDate?: string
  }>
  achievements: Array<{
    title: string
    description?: string
    date?: string
  }>
  generatedAt?: string
}

export type Provider = 'auto' | 'huggingface' | 'groq'

export type PolishedResume = ResumeData & {
  meta?: {
    model?: string
    provider?: Provider
    polishedAt?: string
  }
}
