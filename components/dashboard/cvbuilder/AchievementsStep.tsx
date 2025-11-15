import React from 'react';
import { validateAchievement, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

interface Achievement {
  title: string;
  description: string;
  date?: string;
  organization?: string;
}

interface AchievementsStepProps {
  achievements: Achievement[];
  onUpdate: (achievements: Achievement[]) => void;
  errors: { [index: number]: ValidationError[] };
  onValidation: (isValid: boolean, allErrors: { [index: number]: ValidationError[] }) => void;
}

const AchievementsStep: React.FC<AchievementsStepProps> = ({ 
  achievements, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const achievementCategories = [
    '🏆 Awards & Recognition',
    '📜 Certifications',
    '🎯 Performance Achievements',
    '📈 Business Impact',
    '🌟 Leadership Recognition',
    '📚 Publications & Speaking',
    '🚀 Innovation & Patents',
    '🎓 Academic Honors',
    '🤝 Community Impact',
    '💡 Other Achievements'
  ];

  const addAchievement = () => {
    const newAchievement: Achievement = {
      title: '',
      description: '',
      date: '',
      organization: ''
    };
    const updatedAchievements = [...achievements, newAchievement];
    onUpdate(updatedAchievements);
    validateAll(updatedAchievements);
  };

  const removeAchievement = (index: number) => {
    const updatedAchievements = achievements.filter((_, i) => i !== index);
    onUpdate(updatedAchievements);
    validateAll(updatedAchievements);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const updatedAchievements = achievements.map((achievement, i) => 
      i === index ? { ...achievement, [field]: value } : achievement
    );
    onUpdate(updatedAchievements);
    validateAll(updatedAchievements);
  };

  const validateAll = (achievementsList: Achievement[]) => {
    const allErrors: { [index: number]: ValidationError[] } = {};
    let hasAnyErrors = false;

    achievementsList.forEach((achievement, index) => {
      const validation = validateAchievement(achievement);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements & Awards</h3>
        <p className="text-gray-600 mb-6">Highlight your notable achievements, awards, certifications, and recognitions. These help you stand out from other candidates. All fields marked with * are required.</p>
      </div>

      {/* Achievement Categories Guide */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-800 mb-2">Achievement Categories</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-amber-700">
          {achievementCategories.map((category, index) => (
            <div key={index} className="flex items-center">
              <span className="mr-1">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No achievements added yet</p>
          <button
            onClick={addAchievement}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Achievement
          </button>
        </div>
      )}

      {achievements.map((achievement, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-semibold text-gray-800">Achievement #{index + 1}</h4>
            <button
              onClick={() => removeAchievement(index)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Remove this achievement"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Title *
              </label>
              <input
                type="text"
                value={achievement.title}
                onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                className={getInputClassName(index, 'title')}
                placeholder="Employee of the Year, AWS Certified Solutions Architect, Published Research Paper, etc."
              />
              <ErrorMessage index={index} fieldName="title" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date (Optional, YYYY-MM)
              </label>
              <input
                type="text"
                value={achievement.date || ''}
                onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                className={getInputClassName(index, 'date')}
                placeholder="2024-03"
              />
              <ErrorMessage index={index} fieldName="date" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Institution (Optional)
              </label>
              <input
                type="text"
                value={achievement.organization || ''}
                onChange={(e) => updateAchievement(index, 'organization', e.target.value)}
                className={getInputClassName(index, 'organization')}
                placeholder="Company Name, University, Certification Body, etc."
              />
              <ErrorMessage index={index} fieldName="organization" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={achievement.description}
                onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                className={getInputClassName(index, 'description')}
                rows={3}
                placeholder="Describe the achievement, its significance, the criteria for receiving it, and the impact it had..."
              />
              <ErrorMessage index={index} fieldName="description" />
              <p className="text-gray-500 text-sm mt-1">
                Tip: Include context about why this achievement is significant and any metrics if applicable.
              </p>
            </div>
          </div>

          {/* Achievement Preview */}
          {achievement.title && achievement.description && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                <span className="mr-2">🏆</span>
                Preview:
              </h5>
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-amber-800">{achievement.title}</p>
                {achievement.organization && (
                  <p className="text-amber-700 mb-1">{achievement.organization}</p>
                )}
                {achievement.date && (
                  <p className="text-amber-600 text-xs mb-2">{achievement.date}</p>
                )}
                <p className="text-gray-600">{achievement.description}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {achievements.length > 0 && (
        <button
          onClick={addAchievement}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
        >
          + Add Another Achievement
        </button>
      )}

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-emerald-800">Achievement Guidelines</h3>
            <div className="mt-2 text-sm text-emerald-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Include quantifiable achievements (increased sales by 30%, managed team of 15, etc.)</li>
                <li>Professional certifications add credibility, especially in technical fields</li>
                <li>Awards and recognition from employers show exceptional performance</li>
                <li>Academic honors are valuable for recent graduates or career changers</li>
                <li>Community involvement demonstrates leadership and character</li>
                <li>Patents, publications, or speaking engagements show thought leadership</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Your Achievements Summary</h4>
          <div className="text-sm text-blue-700">
            <p>You have added <strong>{achievements.length}</strong> achievement{achievements.length !== 1 ? 's' : ''}. These will help differentiate you from other candidates and demonstrate your track record of success.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsStep;