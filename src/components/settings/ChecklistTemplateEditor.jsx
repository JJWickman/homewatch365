import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChecklistTemplateEditor({ template, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [templateData, setTemplateData] = useState(template);

  useEffect(() => {
    loadSections();
  }, [template?.id]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const sectionsData = await base44.entities.ChecklistTemplateSection.filter({
        template_id: template.id
      });
      sectionsData.sort((a, b) => a.sort_order - b.sort_order);
      setSections(sectionsData);

      // Load items for each section
      for (let section of sectionsData) {
        const items = await base44.entities.ChecklistTemplateItem.filter({
          section_id: section.id
        });
        items.sort((a, b) => a.sort_order - b.sort_order);
        section.items = items;
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const updateSectionTitle = async (sectionId, newTitle) => {
    try {
      await base44.entities.ChecklistTemplateSection.update(sectionId, { title: newTitle });
      const newSections = sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s);
      setSections(newSections);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const updateItem = async (itemId, updates) => {
    try {
      await base44.entities.ChecklistTemplateItem.update(itemId, updates);
      const newSections = sections.map(section => ({
        ...section,
        items: section.items?.map(item => item.id === itemId ? { ...item, ...updates } : item) || []
      }));
      setSections(newSections);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (sectionIndex, itemIndex) => {
    const item = sections[sectionIndex].items[itemIndex];
    if (window.confirm('Delete this item?')) {
      try {
        await base44.entities.ChecklistTemplateItem.delete(item.id);
        const newSections = sections.map((section, sIdx) => 
          sIdx === sectionIndex 
            ? { ...section, items: section.items.filter((_, iIdx) => iIdx !== itemIndex) }
            : section
        );
        setSections(newSections);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  if (loading && sections.length === 0) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs">Type</Label>
              <p className="font-medium capitalize">{template.type || 'standard'}</p>
            </div>
            <div>
              <Label className="text-xs">Version</Label>
              <p className="font-medium">{template.version || 1}</p>
            </div>
            <div>
              <Label className="text-xs">Sections</Label>
              <p className="font-medium">{sections.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, sectionIndex) => (
              <Card key={section.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-slate-500">{section.items?.length || 0} items</p>
                  </div>
                  {expandedSections[sectionIndex] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {expandedSections[sectionIndex] && (
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <Label className="text-xs">Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        onBlur={() => updateSectionTitle(section.id, section.title)}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Items ({section.items?.length || 0})</Label>
                      {section.items?.map((item, itemIndex) => (
                        <div key={item.id} className="p-3 border rounded-lg bg-white space-y-2">
                          <div className="flex items-start gap-2">
                            <Input
                              value={item.label}
                              onChange={(e) => updateItem(item.id, { label: e.target.value })}
                              className="flex-1 text-sm"
                              placeholder="Item label"
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

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <Label className="text-xs">Response Type</Label>
                              <select
                                value={item.response_type || 'ok_issue_na'}
                                onChange={(e) => updateItem(item.id, { response_type: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-xs"
                              >
                                <option value="ok_issue_na">OK/Issue/N/A</option>
                                <option value="yes_no_na">Yes/No/N/A</option>
                                <option value="temperature_reading">Temperature</option>
                                <option value="humidity_reading">Humidity</option>
                                <option value="text">Text</option>
                                <option value="photo_only">Photo Only</option>
                                <option value="instruction_only">Instruction Only</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">Required</Label>
                              <label className="flex items-center gap-2 mt-1">
                                <input
                                  type="checkbox"
                                  checked={item.required || false}
                                  onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                                  className="h-4 w-4"
                                />
                                <span className="text-xs">Required Answer</span>
                              </label>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.allow_issue_note || false}
                                onChange={(e) => updateItem(item.id, { allow_issue_note: e.target.checked })}
                              />
                              Allow Note
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.allow_issue_photo || false}
                                onChange={(e) => updateItem(item.id, { allow_issue_photo: e.target.checked })}
                              />
                              Allow Photo
                            </label>
                          </div>

                          {item.help_text && (
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-900">
                              {item.help_text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}