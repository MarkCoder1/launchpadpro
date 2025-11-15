import React, { useEffect, useState } from 'react';
import { validatePersonalInfo, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

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

interface PersonalInfoStepProps {
  data: PersonalInfo;
  onUpdate: (data: PersonalInfo) => void;
  errors: ValidationError[];
  onValidation: (isValid: boolean, errors: ValidationError[]) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ 
  data, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const [loading, setLoading] = useState(true);
  const [initialFetch, setInitialFetch] = useState(false);

  // Fetch profile data from API on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (initialFetch) return; // Prevent multiple fetches
      
      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const responseData = await response.json();
          if (responseData.user) {
            const user = responseData.user;
            
            // Split full name into first and last name if available
            const nameParts = user.name ? user.name.trim().split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            // Map API data to component format, preserving existing CV data if any
            const updatedData: PersonalInfo = {
              firstName: data.firstName || firstName,
              lastName: data.lastName || lastName,
              email: data.email || user.email || '',
              phone: data.phone || user.phone || '',
              location: data.location || user.location || '',
              title: data.title || '', // Not in API, keep existing or empty
              summary: data.summary || '', // Not in API, keep existing or empty
              linkedin: data.linkedin || '', // Not in API, keep existing or empty
              website: data.website || '' // Not in API, keep existing or empty
            };
            
            onUpdate(updatedData);
            
            // Validate the updated data
            const validation = validatePersonalInfo(updatedData);
            onValidation(validation.isValid, validation.errors);
          }
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
        setInitialFetch(true);
      }
    };

    fetchProfileData();
  }, [data, onUpdate, onValidation, initialFetch]);

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    const updatedData = { ...data, [field]: value };
    onUpdate(updatedData);
    
    // Validate on change
    const validation = validatePersonalInfo(updatedData);
    onValidation(validation.isValid, validation.errors);
  };

  const getInputClassName = (fieldName: string) => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2";
    const hasError = hasFieldError(errors, fieldName);
    return hasError 
      ? `${baseClasses} border-red-500 focus:ring-red-500` 
      : `${baseClasses} border-gray-300 focus:ring-blue-500`;
  };

  const ErrorMessage: React.FC<{ fieldName: string }> = ({ fieldName }) => {
    const errorMessage = getFieldError(errors, fieldName);
    return errorMessage ? (
      <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
    ) : null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
          <p className="text-gray-600 mb-6">Loading your profile data...</p>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
        <p className="text-gray-600 mb-6">Let's start with your basic information. All fields marked with * are required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={getInputClassName('firstName')}
            placeholder="Enter your first name"
          />
          <ErrorMessage fieldName="firstName" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={getInputClassName('lastName')}
            placeholder="Enter your last name"
          />
          <ErrorMessage fieldName="lastName" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={getInputClassName('email')}
            placeholder="your.email@example.com"
          />
          <ErrorMessage fieldName="email" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={getInputClassName('phone')}
            placeholder="+1 (555) 123-4567"
          />
          <ErrorMessage fieldName="phone" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={getInputClassName('location')}
            placeholder="City, State/Province, Country"
          />
          <ErrorMessage fieldName="location" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Title *
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={getInputClassName('title')}
            placeholder="e.g., Software Engineer, Marketing Manager, Data Scientist"
          />
          <ErrorMessage fieldName="title" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Summary
          </label>
          <textarea
            value={data.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            className={getInputClassName('summary')}
            rows={4}
            placeholder="Write a brief summary of your professional background, key skills, and career objectives..."
          />
          <ErrorMessage fieldName="summary" />
          <p className="text-gray-500 text-sm mt-1">
            Tip: Keep it concise (2-3 sentences) and highlight your unique value proposition.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile (Optional)
          </label>
          <input
            type="url"
            value={data.linkedin || ''}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            className={getInputClassName('linkedin')}
            placeholder="https://linkedin.com/in/yourprofile"
          />
          <ErrorMessage fieldName="linkedin" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Website (Optional)
          </label>
          <input
            type="url"
            value={data.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={getInputClassName('website')}
            placeholder="https://yourwebsite.com"
          />
          <ErrorMessage fieldName="website" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Use a professional email address and ensure your phone number includes the country code for international opportunities.
                Your professional summary should be tailored to your target role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;