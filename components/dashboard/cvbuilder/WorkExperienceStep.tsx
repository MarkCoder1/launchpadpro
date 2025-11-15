import React from 'react';
import { validateWorkExperience, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location?: string;
  current?: boolean;
}

interface WorkExperienceStepProps {
  workExperience: WorkExperience[];
  onUpdate: (workExperience: WorkExperience[]) => void;
  errors: { [index: number]: ValidationError[] };
  onValidation: (isValid: boolean, allErrors: { [index: number]: ValidationError[] }) => void;
}

const WorkExperienceStep: React.FC<WorkExperienceStepProps> = ({ 
  workExperience, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      location: '',
      current: false
    };
    const updatedExperience = [...workExperience, newExperience];
    onUpdate(updatedExperience);
    validateAll(updatedExperience);
  };

  const removeWorkExperience = (index: number) => {
    const updatedExperience = workExperience.filter((_, i) => i !== index);
    onUpdate(updatedExperience);
    validateAll(updatedExperience);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updatedExperience = workExperience.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    onUpdate(updatedExperience);
    validateAll(updatedExperience);
  };

  const validateAll = (experienceList: WorkExperience[]) => {
    const allErrors: { [index: number]: ValidationError[] } = {};
    let hasAnyErrors = false;

    experienceList.forEach((exp, index) => {
      const validation = validateWorkExperience(exp);
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Experience</h3>
        <p className="text-gray-600 mb-6">Add your professional work experience. Start with your most recent role. All fields marked with * are required.</p>
      </div>

      {workExperience.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No work experience entries yet</p>
          <button
            onClick={addWorkExperience}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Job
          </button>
        </div>
      )}

      {workExperience.map((exp, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-semibold text-gray-800">Position #{index + 1}</h4>
            {workExperience.length > 1 && (
              <button
                onClick={() => removeWorkExperience(index)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Remove this position"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                className={getInputClassName(index, 'company')}
                placeholder="Google, Microsoft, Startup Inc."
              />
              <ErrorMessage index={index} fieldName="company" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Title *
              </label>
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                className={getInputClassName(index, 'position')}
                placeholder="Software Engineer, Product Manager, etc."
              />
              <ErrorMessage index={index} fieldName="position" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={exp.location || ''}
                onChange={(e) => updateWorkExperience(index, 'location', e.target.value)}
                className={getInputClassName(index, 'location')}
                placeholder="New York, NY or Remote"
              />
              <ErrorMessage index={index} fieldName="location" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date * (YYYY-MM)
              </label>
              <input
                type="text"
                value={exp.startDate}
                onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                className={getInputClassName(index, 'startDate')}
                placeholder="2022-01"
              />
              <ErrorMessage index={index} fieldName="startDate" />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`current-${index}`}
                  checked={exp.current || false}
                  onChange={(e) => {
                    updateWorkExperience(index, 'current', e.target.checked);
                    if (e.target.checked) {
                      updateWorkExperience(index, 'endDate', '');
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`current-${index}`} className="ml-2 text-sm font-medium text-gray-700">
                  I currently work here
                </label>
              </div>
            </div>

            {!exp.current && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date * (YYYY-MM)
                </label>
                <input
                  type="text"
                  value={exp.endDate}
                  onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                  className={getInputClassName(index, 'endDate')}
                  placeholder="2024-03"
                />
                <ErrorMessage index={index} fieldName="endDate" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={exp.description}
                onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                className={getInputClassName(index, 'description')}
                rows={4}
                placeholder="Describe your key responsibilities, achievements, and impact. Use bullet points and quantify results when possible..."
              />
              <ErrorMessage index={index} fieldName="description" />
              <p className="text-gray-500 text-sm mt-1">
                Tip: Focus on achievements rather than just duties. Use action verbs and include metrics (e.g., "Increased sales by 25%").
              </p>
            </div>
          </div>
        </div>
      ))}

      {workExperience.length > 0 && (
        <button
          onClick={addWorkExperience}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
        >
          + Add Another Position
        </button>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Work Experience Best Practices</h3>
            <div className="mt-2 text-sm text-green-700">
              <ul className="list-disc list-inside space-y-1">
                <li>List experiences in reverse chronological order (most recent first)</li>
                <li>Use strong action verbs: "Led," "Implemented," "Achieved," "Optimized"</li>
                <li>Quantify your impact with numbers, percentages, or dollar amounts</li>
                <li>Tailor descriptions to match the job you're applying for</li>
                <li>Keep bullet points concise but impactful (1-2 lines each)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkExperienceStep;