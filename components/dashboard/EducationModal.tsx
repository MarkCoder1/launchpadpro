import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Edit2, Trash2, Loader2, GraduationCap } from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrently: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  education: Education[];
  onEducationUpdate: () => void;
}

interface EducationForm {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrently: boolean;
}

const initialForm: EducationForm = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
  isCurrently: false,
};

export default function EducationModal({ isOpen, onClose, education, onEducationUpdate }: EducationModalProps) {
  const [form, setForm] = useState<EducationForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setEditingId(null);
      setIsFormVisible(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof EducationForm, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form.institution.trim()) {
      alert('Institution is required');
      return false;
    }
    if (!form.degree.trim()) {
      alert('Degree is required');
      return false;
    }
    if (!form.startDate) {
      alert('Start date is required');
      return false;
    }
    if (!form.isCurrently && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      alert('End date must be after start date');
      return false;
    }
    return true;
  };

  const saveEducation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = '/api/user/education';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...form,
        ...(editingId && { id: editingId }),
        endDate: form.isCurrently ? null : form.endDate || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setForm(initialForm);
        setEditingId(null);
        setIsFormVisible(false);
        onEducationUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save education entry');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      alert('Failed to save education entry');
    } finally {
      setLoading(false);
    }
  };

  const editEducation = (edu: Education) => {
    setForm({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate.split('T')[0],
      endDate: edu.endDate ? edu.endDate.split('T')[0] : '',
      description: edu.description || '',
      isCurrently: edu.isCurrently,
    });
    setEditingId(edu.id);
    setIsFormVisible(true);
  };

  const deleteEducation = async (educationId: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    setDeleteLoading(educationId);
    try {
      const response = await fetch('/api/user/education', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ educationId }),
      });

      if (response.ok) {
        onEducationUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete education entry');
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      alert('Failed to delete education entry');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsFormVisible(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Manage Education
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Education Button */}
          {!isFormVisible && (
            <Button 
              onClick={() => setIsFormVisible(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          )}

          {/* Education Form */}
          {isFormVisible && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Edit Education' : 'Add New Education'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Institution *
                    </label>
                    <input
                      type="text"
                      value={form.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                      placeholder="University of Technology"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Degree *
                    </label>
                    <input
                      type="text"
                      value={form.degree}
                      onChange={(e) => handleInputChange('degree', e.target.value)}
                      placeholder="Bachelor of Computer Science"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={form.fieldOfStudy}
                    onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
                    placeholder="Computer Science, Software Engineering, etc."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      disabled={form.isCurrently}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCurrently"
                    checked={form.isCurrently}
                    onChange={(e) => handleInputChange('isCurrently', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isCurrently" className="text-sm text-foreground">
                    I currently study here
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Relevant coursework, achievements, honors, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveEducation} disabled={loading} className="flex-1 sm:flex-initial">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingId ? 'Update' : 'Add'} Education
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1 sm:flex-initial">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education List */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Education History</h4>
            {education.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No education entries added yet</p>
                <p className="text-sm">Add your educational background to showcase your qualifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {education.map((edu) => (
                  <Card key={edu.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-foreground">{edu.degree}</h5>
                              <p className="text-muted-foreground">{edu.institution}</p>
                              {edu.fieldOfStudy && (
                                <p className="text-sm text-muted-foreground">{edu.fieldOfStudy}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(edu.startDate)} - {edu.isCurrently ? 'Present' : edu.endDate ? formatDate(edu.endDate) : 'Not specified'}
                              </p>
                              {edu.description && (
                                <p className="text-sm text-muted-foreground mt-2">{edu.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editEducation(edu)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEducation(edu.id)}
                            disabled={deleteLoading === edu.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deleteLoading === edu.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}