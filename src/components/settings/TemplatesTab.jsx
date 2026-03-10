import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ChecklistTemplateEditor from '@/components/settings/ChecklistTemplateEditor';

export default function TemplatesTab({ companyId, onRefresh, isAdmin }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.ChecklistTemplate.filter({
        company_id: companyId
      });
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSingleFamily = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedSingleFamilyTemplate', {});
      loadTemplates();
    } catch (error) {
      console.error('Error seeding template:', error);
    } finally {
      setSeeding(false);
    }
  };

  const handleView = async (template) => {
    // Load full template with sections and items
    const sections = await base44.entities.ChecklistTemplateSection.filter({
      template_id: template.id
    });
    const items = await base44.entities.ChecklistTemplateItem.filter({
      template_id: template.id
    });
    
    setSelectedTemplate({
      ...template,
      sections,
      items
    });
    setShowViewDialog(true);
  };

  const handleEdit = async (template) => {
    const sections = await base44.entities.ChecklistTemplateSection.filter({
      template_id: template.id
    });
    const items = await base44.entities.ChecklistTemplateItem.filter({
      template_id: template.id
    });
    
    setEditingTemplate({
      ...template,
      sections,
      items
    });
    setShowEditDialog(true);
  };

  const handleSave = async (templateData) => {
    setSaving(true);
    try {
      await base44.entities.ChecklistTemplate.update(editingTemplate.id, {
        name: templateData.name,
        description: templateData.description,
        active: templateData.active
      });
      
      setShowEditDialog(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await base44.entities.ChecklistTemplate.delete(id);
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">Only administrators can manage templates.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-4">
              No templates yet. Create your first checklist template.
            </p>
            <Button 
              onClick={handleSeedSingleFamily}
              disabled={seeding}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {seeding ? 'Creating...' : 'Create Single Family Template'}
            </Button>
          </CardContent>
        </Card>
      )}

      {templates.length > 0 && (
        <div className="space-y-3">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      {template.active && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                      {!template.active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Type: <strong>{template.property_type}</strong></span>
                      <span>Version: <strong>{template.version}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Template Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Property Type</span>
                  <p className="font-semibold text-slate-900 mt-1 capitalize">{selectedTemplate.property_type}</p>
                </div>
                <div>
                  <span className="text-slate-500">Version</span>
                  <p className="font-semibold text-slate-900 mt-1">{selectedTemplate.version}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <p className="font-semibold text-slate-900 mt-1">{selectedTemplate.active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Sections</h3>
                {selectedTemplate.sections?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((section, idx) => (
                  <Card key={idx} className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTemplate.items
                          ?.filter(item => item.section_id === section.id)
                          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map((item, itemIdx) => (
                            <div key={itemIdx} className="text-sm p-3 bg-white rounded border border-slate-200">
                              <p className="font-medium text-slate-900">{item.label}</p>
                              {item.instructions && (
                                <p className="text-slate-600 text-xs mt-1">{item.instructions}</p>
                              )}
                              <div className="flex gap-2 mt-2 flex-wrap text-xs">
                                <Badge variant="outline" className="capitalize">{item.response_type}</Badge>
                                {item.required && <Badge className="bg-red-100 text-red-800">Required</Badge>}
                                {item.allow_note && <Badge variant="outline">Notes</Badge>}
                                {item.allow_photo && <Badge variant="outline">Photos</Badge>}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify template details and structure
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <ChecklistTemplateEditor
              template={editingTemplate}
              onSave={handleSave}
              onCancel={() => setShowEditDialog(false)}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}