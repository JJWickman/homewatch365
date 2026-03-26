import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Plus, Edit2, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/shared/PageHeader';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SettingsTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      let companyData = null;
      if (members.length > 0) {
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companies.length > 0) {
          companyData = companies[0];
          setCompany(companyData);
        }
      }

      // Get stored company templates (from settings.checklists) - custom
      const storedTemplates = [];
      if (companyData?.settings?.checklists) {
        Object.entries(companyData.settings.checklists).forEach(([key, template]) => {
          if (template.sections) {
            storedTemplates.push({
              id: key,
              name: template.name || key.charAt(0).toUpperCase() + key.slice(1),
              description: template.description || '',
              type: 'stored',
              published: template.published,
              section: 'custom'
            });
          }
        });
      }

      // Fetch all ChecklistTemplate records - 11 system templates (3 core home watch + 8 additional service)
      const allTemplates = await base44.entities.ChecklistTemplate.filter({});
      const CORE_CODES = ['single_family_standard', 'condo_villa_standard', 'high_rise_standard'];
      const dbTemplates = allTemplates.filter(t => t.active !== false).map(t => ({
        ...t,
        type: 'system',
        isSystem: true,
        section: CORE_CODES.includes(t.code) ? 'core' : 'additional'
      }));

      // If fewer than 11 system templates found, reseed them
      if (dbTemplates.length < 11 && companyData?.id) {
        try {
          console.log(`Found ${dbTemplates.length} templates, reseeding all 11...`);
          await base44.functions.invoke('seedCompanyTemplates', { 
            company_id: companyData.id, 
            tenant_id: null 
          });
          // Reload templates after seeding
          const reloadedTemplates = await base44.entities.ChecklistTemplate.filter({});
          const reloadedDbTemplates = reloadedTemplates.filter(t => t.active !== false).map(t => ({
            ...t,
            type: 'system',
            isSystem: true,
            section: CORE_CODES.includes(t.code) ? 'core' : 'additional'
          }));
          setTemplates([...storedTemplates, ...reloadedDbTemplates]);
        } catch (seedError) {
          console.warn('Failed to seed templates:', seedError);
          setTemplates([...storedTemplates, ...dbTemplates]);
        }
      } else {
        // Combine: stored custom templates + database system templates
        const combined = [...storedTemplates, ...dbTemplates];
        setTemplates(combined);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !company) {
      toast.error('Please enter a template name');
      return;
    }

    setCreating(true);
    try {
      const key = newTemplateName.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const checklists = company?.settings?.checklists || {};
      const updatedChecklists = {
        ...checklists,
        [key]: { 
          name: newTemplateName.trim(),
          description: '',
          sections: [],
          instructions: '',
          published: false
        }
      };
      const updatedSettings = { ...(company.settings || {}), checklists: updatedChecklists };
      await base44.entities.Company.update(company.id, { settings: updatedSettings });
      
      const newTemplate = { id: key, name: newTemplateName.trim(), description: '', type: 'stored', published: false, section: 'custom' };
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateDialog(false);
      setNewTemplateName('');
      toast.success('Template created! Redirecting to editor...');
      
      setTimeout(() => {
        window.location.href = createPageUrl('ChecklistEditor') + `?templateId=${key}`;
      }, 500);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    
    try {
      if (deletingTemplate.type === 'stored') {
        const checklists = company?.settings?.checklists || {};
        const updatedChecklists = { ...checklists };
        delete updatedChecklists[deletingTemplate.id];
        const updatedSettings = { ...(company.settings || {}), checklists: updatedChecklists };
        await base44.entities.Company.update(company.id, { settings: updatedSettings });
      } else {
        await base44.entities.ChecklistTemplate.delete(deletingTemplate.id);
      }
      setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id));
      setShowDeleteDialog(false);
      setDeletingTemplate(null);
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template) => {
    window.location.href = createPageUrl('ChecklistEditor') + `?templateId=${template.id}`;
  };

  const handleDelete = (template) => {
    setDeletingTemplate(template);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Checklist Templates"
        subtitle="Manage inspection templates"
        action={() => setShowCreateDialog(true)}
        actionLabel="New Custom Template"
        actionIcon={Plus}
      />

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No templates yet</h3>
          <p className="text-slate-500 mb-6">Create your first checklist template to get started</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* CORE Templates Section */}
          {templates.some(t => t.section === 'core') && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Core Templates</h3>
                <p className="text-sm text-slate-500 mt-1">Essential templates for property inspections</p>
              </div>
              <div className="space-y-4">
                {templates.filter(t => t.section === 'core').map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* ADDITIONAL Templates Section */}
          {templates.some(t => t.section === 'additional') && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Additional Templates</h3>
                <p className="text-sm text-slate-500 mt-1">Service-specific templates for specialized visits</p>
              </div>
              <div className="space-y-4">
                {templates.filter(t => t.section === 'additional').map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM Templates Section */}
          {templates.some(t => t.section === 'custom') && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Custom Templates</h3>
                <p className="text-sm text-slate-500 mt-1">Your custom inspection templates</p>
              </div>
              <div className="space-y-4">
                {templates.filter(t => t.section === 'custom').map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Create a new checklist template for your property types</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Standard Weekly Check"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim() || creating}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTemplate}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Card Sub-component
function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{template.name}</CardTitle>
            <CardDescription className="mt-2">
              {template.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {template.isSystem && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                System
              </Badge>
            )}
            {template.section === 'custom' && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                Custom
              </Badge>
            )}
            {template.published && (
              <Badge variant="default" className="bg-green-600">Published</Badge>
            )}
            {template.active && (
              <Badge variant="default" className="bg-blue-600">Active</Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!template.isSystem && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(template)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}