import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Save, Copy, Trash2, Edit3, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PropertyChecklistWizard from './PropertyChecklistWizard';

export default function PropertyChecklistConfigTab({ propertyId, companyId, property }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistName, setChecklistName] = useState('');
  const [sections, setSections] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [checklistError, setChecklistError] = useState(null);

  useEffect(() => {
    loadData();
  }, [propertyId, companyId]);

  const loadData = async () => {
    setLoading(true);
    setChecklistError(null);
    try {
      // Load all active checklist templates (system templates have tenant_id: null, readable by all)
      const allTemplates = await base44.entities.ChecklistTemplate.filter({ active: true });
      setTemplates(allTemplates);

      // Try to load existing property-specific checklist
      const existingChecklists = await base44.entities.PropertyChecklist.filter({
        property_id: propertyId,
        tenant_id: companyId
      });

      if (existingChecklists.length > 0) {
        const existingChecklist = existingChecklists[0];
        setChecklist(existingChecklist);
        setChecklistName(existingChecklist.name || 'Custom Checklist');
        setSections(existingChecklist.customized_sections || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('PropertyChecklist filter attempted with:', { propertyId, companyId });
      // Don't set error—let the UI show "Create checklist" if query fails
      // This allows recovery even if there's a transient query issue
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
      // Load template items to copy into property-specific checklist
      const templateSections = selectedTemplate.default_sections || [];
      
      // Create property-specific checklist with a copy of template sections
      const newChecklist = await base44.entities.PropertyChecklist.create({
        tenant_id: companyId,
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        customized_sections: JSON.parse(JSON.stringify(templateSections)), // Copy template sections for unique customization
        checklist_instructions: selectedTemplate.instructions || '',
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
        tenant_id: companyId, // Always enforce tenant_id for tenant isolation
        property_id: propertyId,
        template_id: selectedTemplate.id,
        name: checklistName,
        customized_sections: sections,
        is_active: true
      };

      if (checklist?.id) {
        // Verify ownership before update (security)
        if (checklist.tenant_id !== companyId) {
          throw new Error('Unauthorized: Tenant mismatch');
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
    if (checklist.tenant_id !== companyId) {
      toast.error('Unauthorized: Cannot duplicate checklist from another tenant');
      return;
    }
    
    setSaving(true);
    try {
      // Create a copy with a new name - preserve tenant_id for tenant isolation
      const newChecklistData = {
        tenant_id: checklist.tenant_id,
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
    if (checklist.tenant_id !== companyId) {
      toast.error('Unauthorized: Cannot delete checklist from another tenant');
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
      {showWizard && property && (
        <PropertyChecklistWizard
          property={property}
          onClose={() => setShowWizard(false)}
          onComplete={() => loadData()}
        />
      )}

      {/* Pricing notice */}
      {!property?.custom_fields?.pricing && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Set pricing first:</strong> Please configure pricing for this property in the <strong>Pricing</strong> tab before setting up a checklist.
          </AlertDescription>
        </Alert>
      )}

      {/* Create or Edit */}
      {!checklist ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Property Checklist</CardTitle>
            <CardDescription>
              Create a custom checklist for this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowWizard(true)}
              disabled={!property}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start Checklist Setup
            </Button>
          </CardContent>
        </Card>
      ) : checklistError ? (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            {checklistError}
          </AlertDescription>
        </Alert>
      ) : (
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
          <Alert className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors" onClick={handleEditPropertyChecklist}>
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Active Checklist:</strong> {checklistName}
              {checklist?.updated_date && (
                <div className="text-sm text-green-700 mt-1">
                  Last used: {format(new Date(checklist.updated_date), 'MMM d, yyyy')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}