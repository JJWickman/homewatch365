import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Save, Copy, Trash2, Edit3, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyChecklistConfigTab({ propertyId, companyId }) {
  const navigate = useNavigate();
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
      // Load all checklist templates for company
      const allTemplates = await base44.entities.ChecklistTemplate.filter({ 
        company_id: companyId,
        active: true 
      });
      setTemplates(allTemplates);

      // Try to load existing property-specific checklist
      const existingChecklists = await base44.entities.PropertyChecklist.filter({
        property_id: propertyId,
        company_id: companyId,
        is_active: true
      });

      if (existingChecklists.length > 0) {
        const existingChecklist = existingChecklists[0];
        setChecklist(existingChecklist);
        setChecklistName(existingChecklist.name || 'Custom Checklist');
        setSections(existingChecklist.customized_sections || []);
        
        // Load template that this property checklist is based on
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
    // If already has a checklist, just show which template it's using
    if (checklist) {
      toast.info('Property already has a custom checklist. Delete it to use a different template.');
      return;
    }
    setSelectedTemplate(template);
    setChecklistName(`${template.name} - ${new Date().toLocaleDateString()}`);
  };

  const handleCreatePropertyChecklist = async () => {
    if (!selectedTemplate || !checklistName.trim()) {
      toast.error('Please select a template and enter a name');
      return;
    }

    // Tenant isolation security check
    if (!companyId || !propertyId) {
      toast.error('Security validation failed');
      return;
    }

    setSaving(true);
    try {
      // Create property-specific checklist copy from the MAIN template
      const newChecklist = await base44.entities.PropertyChecklist.create({
        company_id: companyId,
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        customized_sections: [], // Start empty, user can customize
        is_active: true
      });
      
      setChecklist(newChecklist);
      toast.success(`Property checklist created! You can now customize it.`);
      await loadData();
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error('Failed to create property checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPropertyChecklist = async () => {
    if (!checklist) {
      toast.error('Please create a property checklist first');
      return;
    }

    // Navigate to ChecklistEditor to customize the property-specific checklist
    navigate(
      createPageUrl('ChecklistEditor') + 
      `?checklistId=${checklist.id}&propertyId=${propertyId}&companyId=${companyId}&mode=customize`
    );
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

    // Tenant isolation security check
    if (!companyId || !propertyId) {
      toast.error('Security validation failed');
      return;
    }

    setSaving(true);
    try {
      const checklistData = {
        company_id: companyId, // Always enforce company_id for tenant isolation
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        customized_sections: sections,
        is_active: true
      };

      if (checklist?.id) {
        // Verify ownership before update (security)
        if (checklist.company_id !== companyId) {
          throw new Error('Unauthorized: Company mismatch');
        }
        await base44.entities.PropertyChecklist.update(checklist.id, checklistData);
        toast.success('Checklist updated successfully');
      } else {
        // Create new
        const created = await base44.entities.PropertyChecklist.create(checklistData);
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
    
    // Tenant isolation security check
    if (checklist.company_id !== companyId) {
      toast.error('Unauthorized: Cannot duplicate checklist from another company');
      return;
    }
    
    setSaving(true);
    try {
      // Create a copy with a new name - preserve company_id for tenant isolation
      const newChecklistData = {
        company_id: checklist.company_id,
        property_id: checklist.property_id,
        template_id: checklist.template_id,
        name: `${checklist.name} (Copy)`,
        customized_sections: checklist.customized_sections,
        is_active: true
      };

      await base44.entities.PropertyChecklist.create(newChecklistData);
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
    
    // Tenant isolation security check
    if (checklist.company_id !== companyId) {
      toast.error('Unauthorized: Cannot delete checklist from another company');
      return;
    }
    
    try {
      await base44.entities.PropertyChecklist.delete(checklist.id);
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

      {/* Property Checklist Actions */}
      {!checklist && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Property Checklist</CardTitle>
            <CardDescription>
              Create a property-specific copy of "{selectedTemplate.name}" that you can customize
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreatePropertyChecklist}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create Property Checklist'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Existing Property Checklist */}
      {checklist && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Checklist</CardTitle>
              <CardDescription>
                {checklistName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  onClick={handleEditPropertyChecklist}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Customize Checklist
                </Button>
                <Button 
                  onClick={handleDeleteChecklist}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
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