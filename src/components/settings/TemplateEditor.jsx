import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TemplateEditor({ template, onChange }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addSection = () => {
    const newSection = {
      name: 'New Section',
      order: (template.sections?.length || 0) + 1,
      items: []
    };
    onChange({
      ...template,
      sections: [...(template.sections || []), newSection]
    });
    setExpandedSections(prev => ({
      ...prev,
      [template.sections?.length || 0]: true
    }));
  };

  const updateSection = (index, updates) => {
    const newSections = [...template.sections];
    newSections[index] = { ...newSections[index], ...updates };
    onChange({ ...template, sections: newSections });
  };

  const deleteSection = (index) => {
    const newSections = template.sections.filter((_, i) => i !== index);
    onChange({ ...template, sections: newSections });
  };

  const addItem = (sectionIndex) => {
    const newSections = [...template.sections];
    const newItem = {
      name: 'New Item',
      description: '',
      order: (newSections[sectionIndex].items?.length || 0) + 1,
      requires_photo: false,
      requires_note: false,
      check_type: 'yes_no'
    };
    newSections[sectionIndex].items = [...(newSections[sectionIndex].items || []), newItem];
    onChange({ ...template, sections: newSections });
  };

  const updateItem = (sectionIndex, itemIndex, updates) => {
    const newSections = [...template.sections];
    newSections[sectionIndex].items[itemIndex] = {
      ...newSections[sectionIndex].items[itemIndex],
      ...updates
    };
    onChange({ ...template, sections: newSections });
  };

  const deleteItem = (sectionIndex, itemIndex) => {
    const newSections = [...template.sections];
    newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    onChange({ ...template, sections: newSections });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Name *</Label>
        <Input
          value={template.name}
          onChange={(e) => onChange({ ...template, name: e.target.value })}
          placeholder="e.g., Single Family Home Checklist"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={template.description || ''}
          onChange={(e) => onChange({ ...template, description: e.target.value })}
          placeholder="Describe what this template is used for"
          className="min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <select
            value={template.type || 'standard'}
            onChange={(e) => onChange({ ...template, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="standard">Standard</option>
            <option value="pre_storm">Pre-Storm</option>
            <option value="post_storm">Post-Storm</option>
          </select>
        </div>
        <div>
          <Label>Est. Duration (minutes)</Label>
          <Input
            type="number"
            value={template.estimated_duration_minutes || 30}
            onChange={(e) => onChange({ ...template, estimated_duration_minutes: parseInt(e.target.value) })}
            min="1"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="mb-0">Sections</Label>
          <Button size="sm" onClick={addSection} className="gap-1">
            <Plus className="h-3 w-3" />
            Add Section
          </Button>
        </div>

        <div className="space-y-3">
          {template.sections?.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
                onClick={() => toggleSection(sectionIndex)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{section.name}</p>
                  <p className="text-xs text-slate-500">{section.items?.length || 0} items</p>
                </div>
                <div className="flex items-center gap-2">
                  {expandedSections[sectionIndex] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {expandedSections[sectionIndex] && (
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label className="text-xs">Section Name</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs">Items</Label>
                      <Button size="sm" variant="outline" onClick={() => addItem(sectionIndex)} className="gap-1">
                        <Plus className="h-3 w-3" />
                        Add Item
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {section.items?.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-3 border rounded-lg bg-white space-y-2">
                          <div className="flex items-start gap-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, { name: e.target.value })}
                              placeholder="Item name"
                              className="flex-1 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(sectionIndex, itemIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <Textarea
                            value={item.description || ''}
                            onChange={(e) => updateItem(sectionIndex, itemIndex, { description: e.target.value })}
                            placeholder="Description (optional)"
                            className="text-sm min-h-16"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Check Type</Label>
                              <select
                                value={item.check_type || 'yes_no'}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, { check_type: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="yes_no">Yes/No</option>
                                <option value="pass_fail">Pass/Fail</option>
                                <option value="rating">Rating</option>
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.requires_photo || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, { requires_photo: e.target.checked })}
                              />
                              Requires Photo
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.requires_note || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, { requires_note: e.target.checked })}
                              />
                              Requires Note
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSection(sectionIndex)}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Section
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}