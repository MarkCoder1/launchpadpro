import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Loader2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  type: 'technical' | 'soft' | 'interests';
  createdAt: string;
}

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onSkillsUpdate: () => void;
}

export default function SkillsModal({ isOpen, onClose, skills, onSkillsUpdate }: SkillsModalProps) {
  const [newSkill, setNewSkill] = useState('');
  const [selectedType, setSelectedType] = useState<'technical' | 'soft' | 'interests'>('technical');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Group skills by type
  const groupedSkills = {
    technical: skills.filter(skill => skill.type === 'technical'),
    soft: skills.filter(skill => skill.type === 'soft'),
    interests: skills.filter(skill => skill.type === 'interests')
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/user/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSkill.trim(),
          type: selectedType,
        }),
      });

      if (response.ok) {
        setNewSkill('');
        onSkillsUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add skill');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (skillId: string) => {
    setDeleteLoading(skillId);
    try {
      const response = await fetch('/api/user/skills', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillId }),
      });

      if (response.ok) {
        onSkillsUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSkill();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manage Skills & Interests
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Skill */}
          <div className="space-y-4">
            <h4 className="font-medium">Add New Skill</h4>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'technical' | 'soft' | 'interests')}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground min-w-[120px]"
              >
                <option value="technical">Technical</option>
                <option value="soft">Soft Skill</option>
                <option value="interests">Interest</option>
              </select>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter skill name..."
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={addSkill} disabled={loading || !newSkill.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="space-y-3">
            <h4 className="font-medium text-primary">Technical Skills</h4>
            <div className="flex gap-2 flex-wrap">
              {groupedSkills.technical.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {skill.name}
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    disabled={deleteLoading === skill.id}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    {deleteLoading === skill.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </span>
              ))}
              {groupedSkills.technical.length === 0 && (
                <p className="text-muted-foreground text-sm">No technical skills added yet</p>
              )}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="space-y-3">
            <h4 className="font-medium text-secondary-foreground">Soft Skills</h4>
            <div className="flex gap-2 flex-wrap">
              {groupedSkills.soft.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {skill.name}
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    disabled={deleteLoading === skill.id}
                    className="hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                  >
                    {deleteLoading === skill.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </span>
              ))}
              {groupedSkills.soft.length === 0 && (
                <p className="text-muted-foreground text-sm">No soft skills added yet</p>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <h4 className="font-medium text-accent-foreground">Interests</h4>
            <div className="flex gap-2 flex-wrap">
              {groupedSkills.interests.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                >
                  {skill.name}
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    disabled={deleteLoading === skill.id}
                    className="hover:bg-accent/80 rounded-full p-0.5 transition-colors"
                  >
                    {deleteLoading === skill.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </span>
              ))}
              {groupedSkills.interests.length === 0 && (
                <p className="text-muted-foreground text-sm">No interests added yet</p>
              )}
            </div>
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