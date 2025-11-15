import React from 'react';
import { validateSkill, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

interface Skill {
  name: string;
  level: string;
  category: string;
}

interface SkillsStepProps {
  skills: Skill[];
  onUpdate: (skills: Skill[]) => void;
  errors: { [index: number]: ValidationError[] };
  onValidation: (isValid: boolean, allErrors: { [index: number]: ValidationError[] }) => void;
}

const SkillsStep: React.FC<SkillsStepProps> = ({ 
  skills, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const skillLevels = [
    { value: 'Beginner', label: 'Beginner', description: 'Basic understanding' },
    { value: 'Intermediate', label: 'Intermediate', description: 'Comfortable working' },
    { value: 'Advanced', label: 'Advanced', description: 'Highly proficient' },
    { value: 'Expert', label: 'Expert', description: 'Industry expert' }
  ];

  const skillCategories = [
    'Programming Languages',
    'Frameworks & Libraries',
    'Databases',
    'Cloud Platforms',
    'Development Tools',
    'Design Tools',
    'Marketing Tools',
    'Project Management',
    'Data Analysis',
    'Soft Skills',
    'Languages',
    'Other'
  ];

  const addSkill = () => {
    const newSkill: Skill = {
      name: '',
      level: '',
      category: ''
    };
    const updatedSkills = [...skills, newSkill];
    onUpdate(updatedSkills);
    validateAll(updatedSkills);
  };

  const removeSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onUpdate(updatedSkills);
    validateAll(updatedSkills);
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = skills.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    );
    onUpdate(updatedSkills);
    validateAll(updatedSkills);
  };

  const validateAll = (skillsList: Skill[]) => {
    const allErrors: { [index: number]: ValidationError[] } = {};
    let hasAnyErrors = false;

    skillsList.forEach((skill, index) => {
      const validation = validateSkill(skill);
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

  const getSelectClassName = (index: number, fieldName: string) => {
    const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white";
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

  const getSkillsByCategory = () => {
    const grouped = skills.reduce((acc, skill, index) => {
      if (!skill.category) return acc;
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push({ skill, index });
      return acc;
    }, {} as { [category: string]: { skill: Skill; index: number }[] });
    
    return grouped;
  };

  const groupedSkills = getSkillsByCategory();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Skills</h3>
        <p className="text-gray-600 mb-6">Add your technical and soft skills. Organize them by category and be honest about your proficiency level.</p>
      </div>

      {skills.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No skills added yet</p>
          <button
            onClick={addSkill}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Skill
          </button>
        </div>
      )}

      {/* Skills Form */}
      {skills.map((skill, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-semibold text-gray-800">Skill #{index + 1}</h4>
            <button
              onClick={() => removeSkill(index)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Remove this skill"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Name *
              </label>
              <input
                type="text"
                value={skill.name}
                onChange={(e) => updateSkill(index, 'name', e.target.value)}
                className={getInputClassName(index, 'name')}
                placeholder="React, Python, Leadership, etc."
              />
              <ErrorMessage index={index} fieldName="name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proficiency Level *
              </label>
              <select
                value={skill.level}
                onChange={(e) => updateSkill(index, 'level', e.target.value)}
                className={getSelectClassName(index, 'level')}
              >
                <option value="">Select level</option>
                {skillLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
              <ErrorMessage index={index} fieldName="level" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={skill.category}
                onChange={(e) => updateSkill(index, 'category', e.target.value)}
                className={getSelectClassName(index, 'category')}
              >
                <option value="">Select category</option>
                {skillCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ErrorMessage index={index} fieldName="category" />
            </div>
          </div>
        </div>
      ))}

      {skills.length > 0 && (
        <button
          onClick={addSkill}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
        >
          + Add Another Skill
        </button>
      )}

      {/* Skills Preview by Category */}
      {Object.keys(groupedSkills).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Skills Preview</h4>
          <div className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map(({ skill, index }) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.name} ({skill.level})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">Skills Guidelines</h3>
            <div className="mt-2 text-sm text-purple-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Include both technical and soft skills relevant to your target role</li>
                <li>Be honest about proficiency levels - employers may test these skills</li>
                <li>Group similar skills in appropriate categories for better organization</li>
                <li>Focus on skills that differentiate you and match job requirements</li>
                <li>Consider including years of experience for key technical skills</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsStep;