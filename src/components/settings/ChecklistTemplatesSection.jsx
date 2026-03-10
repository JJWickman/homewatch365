import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, Plus, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChecklistTemplateEditor from './ChecklistTemplateEditor';

export default function ChecklistTemplatesSection({ companyId, isAdmin }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.ChecklistTemplate.filter({ company_id: companyId });
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplate = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedSingleFamilyChecklist', {});
      await loadTemplates();
    } catch (error) {
      console.error('Error seeding template:', error);
    } finally {
      setSeeding(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Checklist Templates</CardTitle>
            <CardDescription>Mobile field inspection checklists</CardDescription>
          </div>
          {templates.length === 0 && (
            <Button 
              onClick={handleSeedTemplate}
              disabled={seeding}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {seeding ? 'Creating...' : 'Create Default'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No checklist templates yet</p>
              <Button 
                onClick={handleSeedTemplate}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Create Single Family Home Watch Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-slate-500">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{template.category}</Badge>
                      <Badge variant="outline">v{template.version}</Badge>
                      {template.active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedTemplate(template)}
                    title="View and edit"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <ChecklistTemplateEditor
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onRefresh={loadTemplates}
        />
      )}
    </div>
  );
}