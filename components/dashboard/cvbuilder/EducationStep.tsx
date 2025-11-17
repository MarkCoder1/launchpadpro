import React, { useEffect, useState } from 'react';
import { validateEducation, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

interface EducationStepProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
  errors: { [index: number]: ValidationError[] };
  onValidation: (isValid: boolean, allErrors: { [index: number]: ValidationError[] }) => void;
}

const EducationStep: React.FC<EducationStepProps> = ({ 
  education, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const [loading, setLoading] = useState(true);
  const [initialFetch, setInitialFetch] = useState(false);

  // Fetch education data from API on component mount
  useEffect(() => {
    const fetchEducationData = async () => {
      if (initialFetch) return; // Prevent multiple fetches
      
      try {
        setLoading(true);
        const response = await fetch('/api/user/education');
        if (response.ok) {
          const data = await response.json();
          if (data.education && data.education.length > 0) {
            // Map API data to component format
            type ApiEdu = {
              institution?: string
              degree?: string
              fieldOfStudy?: string
              startDate?: string | Date
              endDate?: string | Date
              isCurrently?: boolean
              description?: string
            }
            const mappedEducation = (data.education as ApiEdu[]).map((edu) => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              field: edu.fieldOfStudy || '', // API uses 'fieldOfStudy'
              startDate: edu.startDate ? new Date(edu.startDate).toISOString().substring(0, 7) : '', // Convert DateTime to YYYY-MM format
              endDate: edu.endDate ? new Date(edu.endDate).toISOString().substring(0, 7) : (edu.isCurrently ? '' : ''), // Handle ongoing education
              gpa: '', // Not in API response, keep empty
              description: edu.description || ''
            }));
            onUpdate(mappedEducation);
            validateAll(mappedEducation);
          }
        } else {
          console.error('Failed to fetch education data');
        }
      } catch (error) {
        console.error('Error fetching education data:', error);
      } finally {
        setLoading(false);
        setInitialFetch(true);
      }
    };

    fetchEducationData();
  }, [onUpdate]);

  const addEducation = () => {
    const newEducation: Education = {
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: ''
    };
    const updatedEducation = [...education, newEducation];
    onUpdate(updatedEducation);
    validateAll(updatedEducation);
  };

  const removeEducation = (index: number) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    onUpdate(updatedEducation);
    validateAll(updatedEducation);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updatedEducation = education.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    onUpdate(updatedEducation);
    validateAll(updatedEducation);
  };

  const validateAll = (educationList: Education[]) => {
    const allErrors: { [index: number]: ValidationError[] } = {};
    let hasAnyErrors = false;

    educationList.forEach((edu, index) => {
      const validation = validateEducation(edu);
      if (!validation.isValid) {
        allErrors[index] = validation.errors;
        hasAnyErrors = true;
      }
    });

    onValidation(!hasAnyErrors, allErrors);
  };

  const getInputClassName = (index: number, fieldName: string) => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2";
    const hasError = errors[index] && hasFieldError(errors[index], fieldName);
    return hasError 
      ? `${baseClasses} border-red-500 focus:ring-red-500` 
      : `${baseClasses} border-gray-300 focus:ring-blue-500`;
  };

  const ErrorMessage: React.FC<{ index: number; fieldName: string }> = ({ index, fieldName }) => {
    const indexErrors = errors[index];
    if (!indexErrors) return null;
    
    const errorMessage = getFieldError(indexErrors, fieldName);
    return errorMessage ? (
      <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
    ) : null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Education</h3>
          <p className="text-gray-600 mb-6">Loading your education data...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Education</h3>
        <p className="text-gray-600 mb-6">Add your educational background. Include at least your highest degree. All fields marked with * are required.</p>
      </div>

      {education.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No education entries found in your profile</p>
          <button
            onClick={addEducation}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Education
          </button>
        </div>
      )}

      {education.map((edu, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-semibold text-gray-800">Education #{index + 1}</h4>
            {education.length > 1 && (
              <button
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Remove this education"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution/University *
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                className={getInputClassName(index, 'institution')}
                placeholder="Harvard University, MIT, etc."
              />
              <ErrorMessage index={index} fieldName="institution" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree *
              </label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                className={getInputClassName(index, 'degree')}
                placeholder="Bachelor's, Master's, PhD, etc."
              />
              <ErrorMessage index={index} fieldName="degree" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field of Study *
              </label>
              <input
                type="text"
                value={edu.field}
                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                className={getInputClassName(index, 'field')}
                placeholder="Computer Science, Business, etc."
              />
              <ErrorMessage index={index} fieldName="field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date * (YYYY-MM)
              </label>
              <input
                type="text"
                value={edu.startDate}
                onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                className={getInputClassName(index, 'startDate')}
                placeholder="2020-09"
              />
              <ErrorMessage index={index} fieldName="startDate" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (YYYY-MM)
              </label>
              <input
                type="text"
                value={edu.endDate}
                onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                className={getInputClassName(index, 'endDate')}
                placeholder="2024-05"
              />
              <ErrorMessage index={index} fieldName="endDate" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA (Optional)
              </label>
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                className={getInputClassName(index, 'gpa')}
                placeholder="3.8/4.0, 85%, etc."
              />
              <ErrorMessage index={index} fieldName="gpa" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={edu.description || ''}
                onChange={(e) => updateEducation(index, 'description', e.target.value)}
                className={getInputClassName(index, 'description')}
                rows={3}
                placeholder="Relevant coursework, honors, thesis topic, achievements, etc."
              />
              <ErrorMessage index={index} fieldName="description" />
            </div>
          </div>
        </div>
      ))}

      {education.length > 0 && (
        <button
          onClick={addEducation}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
        >
          + Add Another Education
        </button>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Education Tips</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>List your education in reverse chronological order (most recent first)</li>
                <li>Include relevant coursework, honors, or achievements if space permits</li>
                <li>For dates, use YYYY-MM format (e.g., 2024-05 for May 2024)</li>
                <li>Only include GPA if it&apos;s 3.5 or higher (or equivalent)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationStep;