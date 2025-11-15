import React from 'react';
import { validateProject, getFieldError, hasFieldError, ValidationError } from '../../../lib/validation';

interface Project {
  name: string;
  description: string;
  technologies: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectsStepProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
  errors: { [index: number]: ValidationError[] };
  onValidation: (isValid: boolean, allErrors: { [index: number]: ValidationError[] }) => void;
}

const ProjectsStep: React.FC<ProjectsStepProps> = ({ 
  projects, 
  onUpdate, 
  errors, 
  onValidation 
}) => {
  const addProject = () => {
    const newProject: Project = {
      name: '',
      description: '',
      technologies: '',
      url: '',
      startDate: '',
      endDate: ''
    };
    const updatedProjects = [...projects, newProject];
    onUpdate(updatedProjects);
    validateAll(updatedProjects);
  };

  const removeProject = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    onUpdate(updatedProjects);
    validateAll(updatedProjects);
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updatedProjects = projects.map((project, i) => 
      i === index ? { ...project, [field]: value } : project
    );
    onUpdate(updatedProjects);
    validateAll(updatedProjects);
  };

  const validateAll = (projectsList: Project[]) => {
    const allErrors: { [index: number]: ValidationError[] } = {};
    let hasAnyErrors = false;

    projectsList.forEach((project, index) => {
      const validation = validateProject(project);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects</h3>
        <p className="text-gray-600 mb-6">Showcase your notable projects, including personal projects, open source contributions, or professional work. All fields marked with * are required.</p>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No projects added yet</p>
          <button
            onClick={addProject}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Project
          </button>
        </div>
      )}

      {projects.map((project, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-semibold text-gray-800">Project #{index + 1}</h4>
            <button
              onClick={() => removeProject(index)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Remove this project"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject(index, 'name', e.target.value)}
                className={getInputClassName(index, 'name')}
                placeholder="E-commerce Platform, Portfolio Website, Mobile App, etc."
              />
              <ErrorMessage index={index} fieldName="name" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={project.description}
                onChange={(e) => updateProject(index, 'description', e.target.value)}
                className={getInputClassName(index, 'description')}
                rows={4}
                placeholder="Describe what the project does, your role, key features, and the impact or results achieved..."
              />
              <ErrorMessage index={index} fieldName="description" />
              <p className="text-gray-500 text-sm mt-1">
                Tip: Focus on the problem solved, your contribution, and measurable outcomes.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies Used *
              </label>
              <input
                type="text"
                value={project.technologies}
                onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                className={getInputClassName(index, 'technologies')}
                placeholder="React, Node.js, MongoDB, AWS, Docker, etc."
              />
              <ErrorMessage index={index} fieldName="technologies" />
              <p className="text-gray-500 text-sm mt-1">
                Separate multiple technologies with commas.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project URL (Optional)
              </label>
              <input
                type="url"
                value={project.url || ''}
                onChange={(e) => updateProject(index, 'url', e.target.value)}
                className={getInputClassName(index, 'url')}
                placeholder="https://github.com/username/project or https://project-demo.com"
              />
              <ErrorMessage index={index} fieldName="url" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional, YYYY-MM)
              </label>
              <input
                type="text"
                value={project.startDate || ''}
                onChange={(e) => updateProject(index, 'startDate', e.target.value)}
                className={getInputClassName(index, 'startDate')}
                placeholder="2023-06"
              />
              <ErrorMessage index={index} fieldName="startDate" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional, YYYY-MM)
              </label>
              <input
                type="text"
                value={project.endDate || ''}
                onChange={(e) => updateProject(index, 'endDate', e.target.value)}
                className={getInputClassName(index, 'endDate')}
                placeholder="2024-01 or leave blank if ongoing"
              />
              <ErrorMessage index={index} fieldName="endDate" />
            </div>
          </div>

          {/* Project Preview */}
          {project.name && project.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Preview:</h5>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{project.name}</p>
                {project.url && (
                  <p className="text-blue-600 mb-2">🔗 {project.url}</p>
                )}
                <p className="mb-2">{project.description.substring(0, 150)}{project.description.length > 150 ? '...' : ''}</p>
                {project.technologies && (
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.split(',').map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {projects.length > 0 && (
        <button
          onClick={addProject}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
        >
          + Add Another Project
        </button>
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">Project Tips</h3>
            <div className="mt-2 text-sm text-indigo-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Include 3-5 of your most impressive or relevant projects</li>
                <li>Focus on projects that demonstrate skills relevant to your target job</li>
                <li>Always include links to live demos or GitHub repositories when possible</li>
                <li>Highlight your specific role if it was a team project</li>
                <li>Include both technical projects and any business impact achieved</li>
                <li>Personal projects can be just as valuable as professional ones</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsStep;