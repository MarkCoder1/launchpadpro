'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { FileText, Upload, ArrowLeft, ArrowRight, Check, Zap } from "lucide-react"
import CVScoreChecker from './CVScoreChecker'
import PersonalInfoStep from './cvbuilder/PersonalInfoStep';
import EducationStep from './cvbuilder/EducationStep';
import WorkExperienceStep from './cvbuilder/WorkExperienceStep';
import SkillsStep from './cvbuilder/SkillsStep';
import ProjectsStep from './cvbuilder/ProjectsStep';
import AchievementsStep from './cvbuilder/AchievementsStep';
import { ValidationError } from '../../lib/validation';
import type { ResumeData, ResumeStyle } from '../../types/resume';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  linkedin?: string;
  website?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location?: string;
  current?: boolean;
}

interface Skill {
  name: string;
  level: string;
  category: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

interface Achievement {
  title: string;
  description: string;
  date?: string;
  organization?: string;
}

interface ValidationState {
  personalInfo: { isValid: boolean; errors: ValidationError[] };
  education: { isValid: boolean; errors: { [index: number]: ValidationError[] } };
  workExperience: { isValid: boolean; errors: { [index: number]: ValidationError[] } };
  skills: { isValid: boolean; errors: { [index: number]: ValidationError[] } };
  projects: { isValid: boolean; errors: { [index: number]: ValidationError[] } };
  achievements: { isValid: boolean; errors: { [index: number]: ValidationError[] } };
}

const CVBuilder: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [showScoreChecker, setShowScoreChecker] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('resume.pdf');
  const [templateStyle, setTemplateStyle] = useState<ResumeStyle>('classic');
  const [cvName, setCvName] = useState<string>('');
  const styleDescriptions: Record<ResumeStyle, string> = {
    classic: 'Best for most roles; ATS-friendly single-column with clean sections.',
    modern: 'Great for experienced candidates; two-column, skill chips, contemporary look.',
    minimal: 'Best for academic or conservative roles; ultra-simple, typography-first.',
    elegant: 'Best for client-facing or leadership roles; refined typography and subtle separators.',
    compact: 'Best when you must fit everything on one page; tighter spacing with clarity.',
    creative: 'Best for design/portfolio-heavy roles; visual header while staying ATS-friendly.'
  }

  // Form data state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    summary: '',
    linkedin: '',
    website: ''
  });

  const [education, setEducation] = useState<Education[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  // Previous CVs
  type PreviousCV = { fileUrl: string; style?: string | null; createdAt: string; name?: string | null };
  const [previousCVs, setPreviousCVs] = useState<PreviousCV[] | null>(null);
  const [prevLoading, setPrevLoading] = useState<boolean>(false);
  const [prevError, setPrevError] = useState<string | null>(null);

  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    personalInfo: { isValid: false, errors: [] },
    education: { isValid: true, errors: {} },
    workExperience: { isValid: true, errors: {} },
    skills: { isValid: true, errors: {} },
    projects: { isValid: true, errors: {} },
    achievements: { isValid: true, errors: {} }
  });

  const steps = [
    {
      id: 0,
      title: 'Personal Information',
      description: 'Basic contact details and professional summary',
      icon: '👤',
      required: true
    },
    {
      id: 1,
      title: 'Education',
      description: 'Academic background and qualifications',
      icon: '🎓',
      required: false
    },
    {
      id: 2,
      title: 'Work Experience',
      description: 'Professional experience and responsibilities',
      icon: '💼',
      required: false
    },
    {
      id: 3,
      title: 'Skills',
      description: 'Technical and soft skills with proficiency levels',
      icon: '⚡',
      required: false
    },
    {
      id: 4,
      title: 'Projects',
      description: 'Notable projects and contributions',
      icon: '🚀',
      required: false
    },
    {
      id: 5,
      title: 'Achievements',
      description: 'Awards, certifications, and recognitions',
      icon: '🏆',
      required: false
    }
  ];

  const updateValidation = (step: string, isValid: boolean, errors: ValidationError[] | { [index: number]: ValidationError[] }) => {
    setValidation(prev => ({
      ...prev,
      [step]: { isValid, errors }
    }));
  };

  const isStepValid = (stepIndex: number): boolean => {
    const stepKey = Object.keys(validation)[stepIndex];
    return validation[stepKey as keyof ValidationState].isValid;
  };

  const canProceedToNext = (): boolean => {
    const currentStepInfo = steps[currentStep];
    if (currentStepInfo.required) {
      return isStepValid(currentStep);
    }
    return true;
  };

  const getStepProgress = (): number => {
    const completedSteps = steps.filter((_, index) => isStepValid(index)).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleStartCVCreation = () => {
    setShowWizard(true);
    setCurrentStep(0);
  };

  const handleBackToMain = () => {
    setShowWizard(false);
    setCurrentStep(0);
  };

  const generateCV = () => {
    const requiredStepsValid = steps
      .filter(step => step.required)
      .every((_, index) => isStepValid(index));

    if (!requiredStepsValid) {
      alert('Please complete all required steps before generating your CV.');
      return;
    }

    // Cleanup previous URL if any
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    // Map local wizard state to API ResumeData
    const payload: ResumeData = {
      personalInfo: {
        firstName: personalInfo.firstName || '',
        lastName: personalInfo.lastName || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        location: personalInfo.location || '',
        title: personalInfo.title || '',
        summary: personalInfo.summary || '',
        linkedin: personalInfo.linkedin || undefined,
        website: personalInfo.website || undefined,
      },
      education: (education || []).map(e => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate,
        endDate: e.endDate || undefined,
        gpa: e.gpa || undefined,
        description: e.description || undefined,
      })),
      workExperience: (workExperience || []).map(w => ({
        company: w.company,
        position: w.position,
        startDate: w.startDate,
        endDate: w.endDate || undefined,
        description: w.description || '',
        location: w.location || undefined,
        current: w.current || false,
      })),
      skills: (skills || []).map(s => ({
        name: s.name,
        level: s.level || undefined,
        category: s.category || undefined,
      })),
      projects: (projects || []).map(p => ({
        name: p.name,
        description: p.description || '',
        technologies: (p.technologies || '')
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        link: p.url || undefined,
        startDate: p.startDate || undefined,
        endDate: p.endDate || undefined,
      })),
      achievements: (achievements || []).map(a => ({
        title: a.title,
        description: a.description || '',
        date: a.date || undefined,
      })),
      generatedAt: new Date().toISOString(),
      templateStyle,
    };

    const rawBase = cvName?.trim() || `${(personalInfo.firstName || 'my').trim()}-${(personalInfo.lastName || 'resume').trim()}-resume`;
    const sanitizedBase = rawBase
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume';
    const fileName = `${sanitizedBase}.pdf`;
    setDownloadFileName(fileName);

    //1- generate the Resume
    const run = async () => {
      try {
        setIsGenerating(true);
        setGenError(null);
        // We request inline on server, but we'll still download via blob to control UX
        const res = await fetch('/api/generate-resume?download=false', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          if (contentType.includes('application/json')) {
            const errJson = await res.json();
            throw new Error(errJson?.error || 'Failed to generate resume');
          }
          throw new Error(`Failed to generate resume (HTTP ${res.status})`);
        }

        //2-make the resume to pdf
        // Expect PDF
        if (contentType.includes('application/pdf')) {
          const blob = await res.blob();

          // Convert blob → ArrayBuffer to give to Tebi to upload the file
          const arrayBuffer = await blob.arrayBuffer();

          // Convert to base64 for sending to backend
          const base64 = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          //3- get the blob url to display or download
          const url = URL.createObjectURL(blob);

          //4- upload to Tebi
          const uploadRes = await fetch('/api/upload-tebi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: fileName,              // e.g., resume.pdf
              contentType: 'application/pdf',
              data: base64,                    // PDF base64
            }),
          });
          if (!uploadRes.ok) {
            // Try to read JSON error, else text
            const ct = uploadRes.headers.get('content-type') || ''
            const errPayload = ct.includes('application/json') ? await uploadRes.json().catch(() => ({})) : await uploadRes.text().catch(() => '')
            const errMsg = typeof errPayload === 'string' ? errPayload : (errPayload?.error || `Upload failed (HTTP ${uploadRes.status})`)
            throw new Error(errMsg)
          }

          //5- get the public URL of the uploaded CV
          const { url: uploaded_cv_url } = await uploadRes.json();
          console.log("Public Tebi URL:", uploaded_cv_url);

          //6- save the CV record in DB
          const saveRes = await fetch('/api/cv/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl: uploaded_cv_url,
              style: templateStyle,
              name: cvName?.trim() || rawBase,
            }),
          });
          if (!saveRes.ok) {
            const errJson = await saveRes.json();
            throw new Error(errJson?.error || 'Failed to save CV record');
          }
          const savedCv = await saveRes.json();
          console.log("Saved CV record:", savedCv);


          setPdfUrl(url);

          //7- Auto-download once generated
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (contentType.includes('application/json')) {
          // Debug mode may return JSON
          const data = await res.json();
          throw new Error(data?.error || 'Unexpected JSON response from server');
        } else {
          throw new Error('Unexpected response type from server');
        }
      } catch (e: unknown) {
        console.error('Generate CV error:', e);
        const msg = e instanceof Error ? e.message : 'Something went wrong generating your CV.';
        setGenError(msg);
      } finally {
        setIsGenerating(false);
      }
    };

    run();
  };

  // Cleanup object URL when component unmounts or new PDF is generated
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Fetch previous CVs when on landing page or when wizard closes
  useEffect(() => {
    const run = async () => {
      if (showWizard) return;
      setPrevLoading(true);
      setPrevError(null);
      try {
        const res = await fetch('/api/cv/retrieve-all');
        if (!res.ok) {
          // 401 is expected when not logged in; just show empty
          if (res.status === 401) {
            setPreviousCVs([]);
            return;
          }
          const ct = res.headers.get('content-type') || '';
          const details = ct.includes('application/json') ? (await res.json().catch(() => ({}))) : await res.text().catch(() => '');
          throw new Error(typeof details === 'string' ? details : (details?.error || `Failed to load previous CVs (HTTP ${res.status})`));
        }
        const data = await res.json();
        const list: PreviousCV[] = Array.isArray(data?.cv) ? data.cv : [];
        setPreviousCVs(list);
      } catch (e: unknown) {
        console.error('Load previous CVs error:', e);
        const msg = e instanceof Error ? e.message : 'Could not load previous CVs';
        setPrevError(msg);
        setPreviousCVs([]);
      } finally {
        setPrevLoading(false);
      }
    };
    run();
  }, [showWizard]);

  // Show wizard interface
  if (showWizard) {
    const currentStepInfo = steps[currentStep];

    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create Your CV</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Step {currentStep + 1} of {steps.length}</p>
          </div>
          <Button variant="outline" onClick={handleBackToMain}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-medium">{getStepProgress()}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-careerpad-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
            {/* CV Name Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">CV Name</label>
              <input
                type="text"
                value={cvName}
                onChange={(e) => setCvName(e.target.value)}
                placeholder="e.g., Product-Manager-2025, John-Doe-Resume"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-muted-foreground">Used as the saved file name and stored with your CV record.</p>
            </div>
            {/* Resume Style Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Resume Style</span>
                <span className="text-xs text-muted-foreground">Choose the template look</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'classic', label: 'Classic' },
                  { key: 'modern', label: 'Modern' },
                  { key: 'minimal', label: 'Minimal' },
                  { key: 'elegant', label: 'Elegant' },
                  { key: 'compact', label: 'Compact' },
                  { key: 'creative', label: 'Creative' },
                ] as { key: ResumeStyle; label: string }[]).map(opt => (
                  <Button
                    key={opt.key}
                    type="button"
                    variant={templateStyle === opt.key ? 'default' : 'outline'}
                    onClick={() => setTemplateStyle(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {styleDescriptions[templateStyle]}
              </p>

            </div>
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentStep === index
                    ? 'bg-careerpad-primary text-careerpad-primary-foreground'
                    : isStepValid(index)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="hidden md:inline">{step.title}</span>
                  {step.required && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-1 rounded">*</span>
                  )}
                  {isStepValid(index) && (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-2xl">{currentStepInfo.icon}</span>
              <div>
                <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                <p className="text-muted-foreground text-sm">{currentStepInfo.description}</p>
              </div>
              {currentStepInfo.required && (
                <span className="ml-auto bg-destructive/10 text-destructive text-xs font-medium px-2.5 py-0.5 rounded">
                  Required
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Render Current Step Component */}
            {currentStep === 0 && (
              <PersonalInfoStep
                data={personalInfo}
                onUpdate={setPersonalInfo}
                errors={validation.personalInfo.errors}
                onValidation={(isValid, errors) => updateValidation('personalInfo', isValid, errors)}
              />
            )}

            {currentStep === 1 && (
              <EducationStep
                education={education}
                onUpdate={setEducation}
                errors={validation.education.errors}
                onValidation={(isValid, errors) => updateValidation('education', isValid, errors)}
              />
            )}

            {currentStep === 2 && (
              <WorkExperienceStep
                workExperience={workExperience}
                onUpdate={setWorkExperience}
                errors={validation.workExperience.errors}
                onValidation={(isValid, errors) => updateValidation('workExperience', isValid, errors)}
              />
            )}

            {currentStep === 3 && (
              <SkillsStep
                skills={skills}
                onUpdate={setSkills}
                errors={validation.skills.errors}
                onValidation={(isValid, errors) => updateValidation('skills', isValid, errors)}
              />
            )}

            {currentStep === 4 && (
              <ProjectsStep
                projects={projects}
                onUpdate={setProjects}
                errors={validation.projects.errors}
                onValidation={(isValid, errors) => updateValidation('projects', isValid, errors)}
              />
            )}

            {currentStep === 5 && (
              <AchievementsStep
                achievements={achievements}
                onUpdate={setAchievements}
                errors={validation.achievements.errors}
                onValidation={(isValid, errors) => updateValidation('achievements', isValid, errors)}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep === steps.length - 1 ? (
              <Button onClick={generateCV} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Generate CV
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Validation Warning */}
        {!canProceedToNext() && currentStepInfo.required && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center">
                <span className="text-destructive font-medium">Please complete all required fields before proceeding.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Error */}
        {genError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <span className="text-destructive font-medium">{genError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Preview */}
        {pdfUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>Open in new tab</Button>
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = pdfUrl;
                      a.download = downloadFileName;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                  >
                    Download PDF
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[70vh]">
                {/* Using object for broader browser compatibility */}
                <object data={pdfUrl} type="application/pdf" className="w-full h-full rounded border">
                  <p className="text-sm">Your browser does not support embedding PDFs. <a className="underline" href={pdfUrl} target="_blank" rel="noreferrer">Open the PDF</a>.</p>
                </object>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show main landing page
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">CV Builder</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Create your professional CV or analyze your existing resume.</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Create New CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">Build a professional CV from scratch with our guided process and AI assistance.</p>
            <Button className="w-full text-sm sm:text-base" onClick={handleStartCVCreation}>
              Create New CV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Resume Score Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">Upload your existing resume to get an instant score and improvement tips.</p>
            <Button variant="outline" className="w-full text-sm sm:text-base" onClick={() => setShowScoreChecker(v => !v)}>
              <Upload className="h-4 w-4 mr-2" />
              {showScoreChecker ? 'Hide CV Score Checker' : 'Upload Resume to Check Score'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {showScoreChecker && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Resume Score Check</CardTitle>
          </CardHeader>
          <CardContent>
            <CVScoreChecker />
          </CardContent>
        </Card>
      )}

      {/* Previous CVs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Your Previous CVs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prevLoading && (
            <div className="text-sm text-muted-foreground">Loading your CVs…</div>
          )}
          {!prevLoading && prevError && (
            <div className="text-sm text-destructive">{prevError}</div>
          )}
          {!prevLoading && previousCVs && previousCVs.length === 0 && !prevError && (
            <div className="text-sm text-muted-foreground">No CVs yet. Generate one to see it here.</div>
          )}
          {!prevLoading && previousCVs && previousCVs.length > 0 && (
            <div className="divide-y">
              {previousCVs.map((item, idx) => {
                const when = item.createdAt ? new Date(item.createdAt) : null;
                const dateStr = when ? when.toLocaleString() : '';
                const displayName = (item.name && item.name.trim()) || (item.fileUrl?.split('/').pop() || 'resume');
                const style = item.style || 'classic';
                return (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{dateStr}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{String(style)}</span>
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CVBuilder;
