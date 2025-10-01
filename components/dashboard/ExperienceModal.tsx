import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Edit2, Trash2, Loader2, Briefcase } from 'lucide-react';

interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrently: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience[];
  onExperienceUpdate: () => void;
}

interface ExperienceForm {
  id?: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrently: boolean;
}

const initialForm: ExperienceForm = {
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  isCurrently: false,
};

export default function ExperienceModal({ isOpen, onClose, experience, onExperienceUpdate }: ExperienceModalProps) {
  const [form, setForm] = useState<ExperienceForm>(initialForm);
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

  const handleInputChange = (field: keyof ExperienceForm, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form.company.trim()) {
      alert('Company is required');
      return false;
    }
    if (!form.position.trim()) {
      alert('Position is required');
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

  const saveExperience = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = '/api/user/experience';
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
        onExperienceUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save experience entry');
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('Failed to save experience entry');
    } finally {
      setLoading(false);
    }
  };

  const editExperience = (exp: Experience) => {
    setForm({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      location: exp.location || '',
      startDate: exp.startDate.split('T')[0],
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      description: exp.description || '',
      isCurrently: exp.isCurrently,
    });
    setEditingId(exp.id);
    setIsFormVisible(true);
  };

  const deleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience entry?')) return;

    setDeleteLoading(experienceId);
    try {
      const response = await fetch('/api/user/experience', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ experienceId }),
      });

      if (response.ok) {
        onExperienceUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete experience entry');
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('Failed to delete experience entry');
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
              <Briefcase className="h-5 w-5" />
              Manage Experience
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Experience Button */}
          {!isFormVisible && (
            <Button 
              onClick={() => setIsFormVisible(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          )}

          {/* Experience Form */}
          {isFormVisible && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Edit Experience' : 'Add New Experience'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="TechCorp Inc."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="San Francisco, CA"
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
                    I currently work here
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Key responsibilities, achievements, projects, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveExperience} disabled={loading} className="flex-1 sm:flex-initial">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingId ? 'Update' : 'Add'} Experience
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1 sm:flex-initial">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience List */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Work Experience</h4>
            {experience.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No experience entries added yet</p>
                <p className="text-sm">Add your work experience to showcase your career journey</p>
              </div>
            ) : (
              <div className="space-y-3">
                {experience.map((exp) => (
                  <Card key={exp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-foreground">{exp.position}</h5>
                              <p className="text-muted-foreground">{exp.company}</p>
                              {exp.location && (
                                <p className="text-sm text-muted-foreground">{exp.location}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(exp.startDate)} - {exp.isCurrently ? 'Present' : exp.endDate ? formatDate(exp.endDate) : 'Not specified'}
                              </p>
                              {exp.description && (
                                <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editExperience(exp)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExperience(exp.id)}
                            disabled={deleteLoading === exp.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deleteLoading === exp.id ? (
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