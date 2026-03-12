import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Save, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyChecklistConfigTab({ propertyId, companyId }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistName, setChecklistName] = useState('');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadData();
  }, [propertyId, companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all checklist templates
      const allTemplates = await base44.entities.ChecklistTemplate.filter({ 
        company_id: companyId,
        active: true 
      });
      setTemplates(allTemplates);

      // Try to load existing property checklist
      const existingChecklists = await base44.entities.ChecklistSubmission.filter({
        property_id: propertyId,
        company_id: companyId
      });

      if (existingChecklists.length > 0) {
        const existingChecklist = existingChecklists[0];
        setChecklist(existingChecklist);
        setChecklistName(existingChecklist.name || 'Custom Checklist');
        
        // Load template data for display
        const templateData = await base44.entities.ChecklistTemplate.filter({
          id: existingChecklist.template_id
        });
        if (templateData.length > 0) {
          setSelectedTemplate(templateData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template) => {
    setSelectedTemplate(template);
    setChecklistName(`${template.name} - ${new Date().toLocaleDateString()}`);
    
    // Load template sections and items
    const templateSections = await base44.entities.ChecklistTemplateSection.filter({
      template_id: template.id
    });
    
    setSections(templateSections);
  };

  const handleSectionUpdate = (sectionIndex, field, value) => {
    const updated = [...sections];
    updated[sectionIndex][field] = value;
    setSections(updated);
  };

  const handleSaveChecklist = async () => {
    if (!selectedTemplate || !checklistName.trim()) {
      toast.error('Please select a template and enter a name');
      return;
    }

    setSaving(true);
    try {
      const checklistData = {
        company_id: companyId,
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        sections: sections,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      if (checklist?.id) {
        // Update existing
        await base44.entities.ChecklistSubmission.update(checklist.id, checklistData);
        toast.success('Checklist updated successfully');
      } else {
        // Create new
        const created = await base44.entities.ChecklistSubmission.create(checklistData);
        setChecklist(created);
        toast.success('Custom checklist created successfully');
      }

      await loadData();
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateChecklist = async () => {
    if (!checklist) return;
    
    setSaving(true);
    try {
      // Create a copy with a new name
      const newChecklistData = {
        ...checklist,
        name: `${checklist.name} (Copy)`,
        created_at: new Date().toISOString()
      };
      
      delete newChecklistData.id;
      delete newChecklistData.created_date;
      delete newChecklistData.updated_date;

      await base44.entities.ChecklistSubmission.create(newChecklistData);
      toast.success('Checklist duplicated');
      await loadData();
    } catch (error) {
      console.error('Error duplicating checklist:', error);
      toast.error('Failed to duplicate checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChecklist = async () => {
    if (!checklist || !window.confirm('Delete this custom checklist?')) return;
    
    try {
      await base44.entities.ChecklistSubmission.delete(checklist.id);
      setChecklist(null);
      setSelectedTemplate(null);
      setSections([]);
      toast.success('Checklist deleted');
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast.error('Failed to delete checklist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Template</CardTitle>
          <CardDescription>
            Choose a standard checklist template to customize for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-slate-500 text-sm">No templates available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h4 className="font-medium">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Name */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist Name</CardTitle>
            <CardDescription>
              Give this property-specific checklist a unique name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
              placeholder="e.g., Miami Beach House - 2026"
              className="text-black"
            />
          </CardContent>
        </Card>
      )}

      {/* Sections Editor */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customize Sections</CardTitle>
            <CardDescription>
              Edit or remove sections for this property's checklist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-3">
                <div>
                  <Label className="text-sm">Section Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) => handleSectionUpdate(idx, 'title', e.target.value)}
                    className="mt-1 text-black"
                  />
                </div>
                <div>
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={section.description || ''}
                    onChange={(e) => handleSectionUpdate(idx, 'description', e.target.value)}
                    placeholder="Optional section description"
                    className="mt-1 text-black"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {selectedTemplate && (
        <div className="flex gap-3">
          <Button 
            onClick={handleSaveChecklist}
            disabled={saving || !checklistName.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {checklist ? 'Update Checklist' : 'Create Checklist'}
              </>
            )}
          </Button>

          {checklist && (
            <>
              <Button 
                onClick={handleDuplicateChecklist}
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button 
                onClick={handleDeleteChecklist}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      )}

      {/* Status */}
      {checklist && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Active Checklist:</strong> {checklistName}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}