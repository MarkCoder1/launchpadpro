// Validation utilities for CV Builder forms

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic international format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date validation (YYYY-MM format or full date)
export const isValidDate = (date: string): boolean => {
  if (!date) return false;
  // Check for YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(date)) return true;
  // Check for full date
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// Personal Information validation
export const validatePersonalInfo = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  linkedin?: string;
  website?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!data.lastName.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  if (!data.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!data.phone.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
  }

  if (!data.location.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (!data.title.trim()) {
    errors.push({ field: 'title', message: 'Professional title is required' });
  }

  // Professional summary is optional
  // if (!data.summary.trim()) {
  //   errors.push({ field: 'summary', message: 'Professional summary is required' });
  // }

  if (data.linkedin && !isValidURL(data.linkedin)) {
    errors.push({ field: 'linkedin', message: 'Please enter a valid LinkedIn URL' });
  }

  if (data.website && !isValidURL(data.website)) {
    errors.push({ field: 'website', message: 'Please enter a valid website URL' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Education validation
export const validateEducation = (education: {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!education.institution.trim()) {
    errors.push({ field: 'institution', message: 'Institution name is required' });
  }

  if (!education.degree.trim()) {
    errors.push({ field: 'degree', message: 'Degree is required' });
  }

  if (!education.field.trim()) {
    errors.push({ field: 'field', message: 'Field of study is required' });
  }

  if (!education.startDate.trim()) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  } else if (!isValidDate(education.startDate)) {
    errors.push({ field: 'startDate', message: 'Please enter a valid start date (YYYY-MM)' });
  }

  // End date is optional (for ongoing education)
  if (education.endDate.trim() && !isValidDate(education.endDate)) {
    errors.push({ field: 'endDate', message: 'Please enter a valid end date (YYYY-MM)' });
  }

  // Check if start date is before end date (only if both dates are provided)
  if (education.startDate && education.endDate && education.endDate.trim() && isValidDate(education.startDate) && isValidDate(education.endDate)) {
    const startDate = new Date(education.startDate);
    const endDate = new Date(education.endDate);
    if (startDate >= endDate) {
      errors.push({ field: 'endDate', message: 'End date must be after start date' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Work Experience validation
export const validateWorkExperience = (experience: {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location?: string;
  current?: boolean;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!experience.company.trim()) {
    errors.push({ field: 'company', message: 'Company name is required' });
  }

  if (!experience.position.trim()) {
    errors.push({ field: 'position', message: 'Position title is required' });
  }

  if (!experience.startDate.trim()) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  } else if (!isValidDate(experience.startDate)) {
    errors.push({ field: 'startDate', message: 'Please enter a valid start date (YYYY-MM)' });
  }

  if (!experience.current && !experience.endDate.trim()) {
    errors.push({ field: 'endDate', message: 'End date is required (or mark as current position)' });
  } else if (!experience.current && experience.endDate && !isValidDate(experience.endDate)) {
    errors.push({ field: 'endDate', message: 'Please enter a valid end date (YYYY-MM)' });
  }

  if (!experience.description.trim()) {
    errors.push({ field: 'description', message: 'Job description is required' });
  }

  // Check if start date is before end date (only if not current)
  if (!experience.current && experience.startDate && experience.endDate && 
      isValidDate(experience.startDate) && isValidDate(experience.endDate)) {
    const startDate = new Date(experience.startDate);
    const endDate = new Date(experience.endDate);
    if (startDate >= endDate) {
      errors.push({ field: 'endDate', message: 'End date must be after start date' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Skills validation
export const validateSkill = (skill: {
  name: string;
  level: string;
  category: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!skill.name.trim()) {
    errors.push({ field: 'name', message: 'Skill name is required' });
  }

  if (!skill.level.trim()) {
    errors.push({ field: 'level', message: 'Skill level is required' });
  }

  if (!skill.category.trim()) {
    errors.push({ field: 'category', message: 'Skill category is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Project validation
export const validateProject = (project: {
  name: string;
  description: string;
  technologies: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!project.name.trim()) {
    errors.push({ field: 'name', message: 'Project name is required' });
  }

  if (!project.description.trim()) {
    errors.push({ field: 'description', message: 'Project description is required' });
  }

  if (!project.technologies.trim()) {
    errors.push({ field: 'technologies', message: 'Technologies used are required' });
  }

  if (project.url && !isValidURL(project.url)) {
    errors.push({ field: 'url', message: 'Please enter a valid project URL' });
  }

  if (project.startDate && !isValidDate(project.startDate)) {
    errors.push({ field: 'startDate', message: 'Please enter a valid start date (YYYY-MM)' });
  }

  if (project.endDate && !isValidDate(project.endDate)) {
    errors.push({ field: 'endDate', message: 'Please enter a valid end date (YYYY-MM)' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Achievement validation
export const validateAchievement = (achievement: {
  title: string;
  description: string;
  date?: string;
  organization?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!achievement.title.trim()) {
    errors.push({ field: 'title', message: 'Achievement title is required' });
  }

  if (!achievement.description.trim()) {
    errors.push({ field: 'description', message: 'Achievement description is required' });
  }

  if (achievement.date && !isValidDate(achievement.date)) {
    errors.push({ field: 'date', message: 'Please enter a valid date (YYYY-MM)' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get error message for a specific field
export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find(err => err.field === fieldName);
  return error?.message;
};

// Check if specific field has error
export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return errors.some(err => err.field === fieldName);
};