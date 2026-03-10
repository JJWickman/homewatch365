import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';

export default function ChecklistTemplateEditor({ template, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    name: template.name || '',
    description: template.description || '',
    active: template.active !== false
  });
  const [expandedSections, setExpandedSections] = useState(
    template.sections?.reduce((acc, s) => ({ ...acc, [s.id]: true }), {}) || {}
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSectionExpanded = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sortedSections = [...(template.sections || [])].sort((a, b) => 
    (a.sort_order || 0) - (b.sort_order || 0)
  );

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 h-20"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm">Active</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections & Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedSections.map((section) => {
            const sectionItems = (template.items || [])
              .filter(item => item.section_id === section.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

            return (
              <div key={section.id} className="border rounded-lg">
                <button
                  onClick={() => toggleSectionExpanded(section.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 text-left">
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform ${
                        expandedSections[section.id] ? 'rotate-180' : ''
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{section.title}</p>
                      <p className="text-xs text-slate-500">{sectionItems.length} items</p>
                    </div>
                  </div>
                </button>

                {expandedSections[section.id] && (
                  <div className="border-t bg-slate-50 p-3 space-y-2">
                    {sectionItems.map((item) => (
                      <div key={item.id} className="bg-white p-2 rounded border border-slate-200 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.label}</p>
                            {item.instructions && (
                              <p className="text-xs text-slate-600 mt-1">{item.instructions}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 capitalize text-xs">
                            {item.response_type}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-wrap mt-2">
                          {item.required && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                          )}
                          {item.allow_note && (
                            <Badge variant="outline" className="text-xs">Notes</Badge>
                          )}
                          {item.allow_photo && (
                            <Badge variant="outline" className="text-xs">Photos</Badge>
                          )}
                          {item.allow_severity && (
                            <Badge variant="outline" className="text-xs">Severity</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={saving || !formData.name.trim()}
          className="bg-slate-900 hover:bg-slate-800"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </DialogFooter>
    </div>
  );
}