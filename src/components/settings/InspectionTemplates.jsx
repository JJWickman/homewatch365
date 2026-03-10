import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TemplateEditor from './TemplateEditor';

const DEFAULT_STANDARD_CHECKLIST_TEMPLATE = {
  name: 'Standard Checklist',
  description: 'Home Watch standard visit checklist covering arrival, water systems, HVAC, bathrooms, garage, and departure tasks.',
  type: 'standard',
  estimated_duration_minutes: 45,
  sections: [
  {
    name: 'Upon Arrival',
    order: 1,
    items: [
    { name: 'Mailbox', description: 'Remove mail and newspapers if requested', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
    { name: 'Landscape', description: 'Note dry patches or signs of stress', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 2 },
    { name: 'Signs of Rodents/Insects', description: 'Look for droppings or activity', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 3 },
    { name: 'Water Supply', description: 'Slowly turned ON at the main valve', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 },
    { name: 'Exterior Walk-Around', description: 'Observe windows, roof (from the ground), screens, AC unit, pavers, and pool cage', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 5 }]

  },
  {
    name: 'Inside the Home',
    order: 2,
    items: [
    { name: 'Security System', description: 'Disarmed upon entry', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
    { name: 'Phone Line', description: 'Checked for signal (if applicable)', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 2 }]

  },
  {
    name: 'Water Zone – Appliances',
    order: 3,
    items: [
    { name: 'Dishwasher', description: 'Operated and checked for leaks or issues', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 1 },
    { name: 'Garbage Disposal', description: 'Operated and checked for issues', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
    { name: 'Washing Machine', description: 'Operated and checked for leaks', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 },
    { name: 'Clothes Dryer', description: 'Checked for proper function', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 4 },
    { name: 'All Sinks', description: 'Run water and check for leaks or clogs', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 5 },
    { name: 'Refrigerator/Freezer', description: 'Temperature and condition checked', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 6 },
    { name: 'Ice Maker', description: 'Emptied and turned off if needed', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 7 },
    { name: 'Food Removal', description: 'Perishables and frozen items removed if needed', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 8 },
    { name: 'Wine Cooler/Wine Room', description: 'Temperature and moisture observed', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 9 }]

  },
  {
    name: 'Bathrooms',
    order: 4,
    items: [
    { name: 'Showers & Tubs', description: 'Water run gently; look for signs of leaks or grout discoloration', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 1 },
    { name: 'Toilets', description: 'Brushed, flushed, and monitored for leaks', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
    { name: 'Water Heater', description: 'Checked for leaks or rust (should be OFF or on Vacation Mode)', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 3 }]

  },
  {
    name: 'AC System',
    order: 5,
    items: [
    { name: 'Temperature & Humidity', description: 'Record current temperature and humidity readings', requires_photo: false, requires_note: true, check_type: 'text', order: 1 },
    { name: 'Thermostat', description: 'Lowered slightly during visit', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
    { name: 'Cooling', description: 'Confirmed cold air is flowing', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 },
    { name: 'Filters & Secondary Pan', description: 'Checked for buildup or water presence (if accessible)', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 4 }]

  },
  {
    name: 'Garage',
    order: 6,
    items: [
    { name: 'Ceiling, Walls & Baseboards', description: 'Observed for damage or water marks', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 1 },
    { name: 'Garage Door', description: 'Operated unless storm bars are installed', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
    { name: 'Breaker Box', description: 'Checked for proper function', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 }]

  },
  {
    name: 'Home Watch Mode',
    order: 7,
    items: [
    { name: 'Room/Closet/Pantry Doors', description: 'Open for airflow', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
    { name: 'Cabinet Doors Under Sinks', description: 'Left open', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
    { name: 'Toilet Brush', description: 'Placed across the bowl to dry', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 3 },
    { name: 'Sink Drains', description: 'Left open', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 }]

  },
  {
    name: 'Departure Tasks',
    order: 8,
    items: [
    { name: 'Thermostat', description: 'Returned to pre-set level', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
    { name: 'Water Supply', description: 'Turned OFF at the main valve; lines drained', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
    { name: 'Security System', description: 'Re-armed', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 3 },
    { name: 'Doors', description: 'Confirmed locked', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 }]

  }]

};

const DEFAULT_HOME_WATCH_TEMPLATE = {
  name: 'Home Watch - Standard Inspection',
  description: 'Standard home watch property inspection checklist',
  type: 'standard',
  sections: [
  {
    name: 'Interior & Exterior Walkthrough',
    order: 1,
    items: [
    { name: 'Exterior condition', description: 'Check exterior walls, siding, foundation', requires_photo: true, requires_note: false, check_type: 'pass_fail', order: 1 },
    { name: 'Interior general condition', description: 'Overall cleanliness and state of interior', requires_photo: true, requires_note: false, check_type: 'pass_fail', order: 2 },
    { name: 'Odors or mustiness', description: 'Check for any unusual smells', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }]

  },
  {
    name: 'Water, Mold & Damage',
    order: 2,
    items: [
    { name: 'Signs of water leaks', description: 'Ceiling stains, water marks, dampness', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 1 },
    { name: 'Mold or mildew', description: 'Any visible mold growth', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 2 },
    { name: 'Storm damage', description: 'Broken windows, roof damage, downed branches', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 3 },
    { name: 'Pest activity signs', description: 'Droppings, nests, damage to materials', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 4 }]

  },
  {
    name: 'Systems Check',
    order: 3,
    items: [
    { name: 'HVAC functioning', description: 'Heating/cooling system operational', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
    { name: 'Plumbing operational', description: 'Water pressure, drains working', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 2 },
    { name: 'Appliances functioning', description: 'Major appliances working properly', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 },
    { name: 'Utilities status', description: 'Gas, electric, water running normally', requires_photo: false, requires_note: true, check_type: 'text', order: 4 }]

  },
  {
    name: 'Security Check',
    order: 4,
    items: [
    { name: 'Signs of forced entry', description: 'Broken locks, damaged doors/windows', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 1 },
    { name: 'Unauthorized access', description: 'Any evidence of intrusion', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 2 },
    { name: 'Security system armed', description: 'Alarm system status', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }]

  },
  {
    name: 'Doors, Windows & Systems',
    order: 5,
    items: [
    { name: 'Doors secure', description: 'All doors locked and functioning', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
    { name: 'Windows secure', description: 'Windows locked and undamaged', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
    { name: 'Key systems functioning', description: 'Locks, codes, security systems working', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }]

  },
  {
    name: 'Tasks & Requests',
    order: 6,
    items: [
    { name: 'Mail/packages collected', description: 'Mailbox and packages collected', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
    { name: 'Client-requested tasks', description: 'Any special requests completed', requires_photo: false, requires_note: true, check_type: 'text', order: 2 }]

  }]

};

export default function InspectionTemplates({ companyId, templates = [], onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_HOME_WATCH_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [copyingDefault, setCopyingDefault] = useState(false);
  const [copyingStandard, setCopyingStandard] = useState(false);

  const handleAdd = () => {
    setEditingId(null);
    setFormData(DEFAULT_HOME_WATCH_TEMPLATE);
    setShowDialog(true);
  };

  const handleView = (template) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData(template);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.VisitTemplate.update(editingId, formData);
      } else {
        await base44.entities.VisitTemplate.create({
          ...formData,
          company_id: companyId
        });
      }
      setShowDialog(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await base44.entities.VisitTemplate.delete(id);
        onRefresh?.();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleCopyDefault = async () => {
    setCopyingDefault(true);
    try {
      await base44.entities.VisitTemplate.create({
        ...DEFAULT_HOME_WATCH_TEMPLATE,
        company_id: companyId
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error copying default template:', error);
    } finally {
      setCopyingDefault(false);
    }
  };

  const handleAddStandardChecklist = async () => {
    setCopyingStandard(true);
    try {
      await base44.entities.VisitTemplate.create({
        ...DEFAULT_STANDARD_CHECKLIST_TEMPLATE,
        company_id: companyId
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error adding standard checklist:', error);
    } finally {
      setCopyingStandard(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visit Templates</CardTitle>
          <CardDescription>Manage templates for different visit types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No visit templates yet.</p>
                <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-slate-900">{templates.length} Template{templates.length !== 1 ? 's' : ''}</h3>
                  <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
                {templates.map(template => (
                  <Card key={template.id} className="bg-slate-50 hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{template.name}</h4>
                          <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                          <div className="flex gap-3 mt-2 text-xs text-slate-500">
                            <span>Type: <Badge className="ml-1 capitalize inline">{template.type}</Badge></span>
                            <span>{template.sections?.length || 0} sections</span>
                            <span>{template.estimated_duration_minutes} min</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleView(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>






        
































      </Card>

      {/* Template Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate &&
          <div className="space-y-6 py-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Type:</span>
                  <Badge className="ml-2 capitalize">{selectedTemplate.type}</Badge>
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <Badge className="ml-2">{selectedTemplate.estimated_duration_minutes} min</Badge>
                </div>
                <div>
                  <span className="text-slate-500">Sections:</span>
                  <Badge className="ml-2">{selectedTemplate.sections?.length || 0}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTemplate.sections?.map((section, sectionIdx) =>
              <Card key={sectionIdx} className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{section.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {section.items?.map((item, itemIdx) =>
                    <div key={itemIdx} className="text-sm p-2 bg-white rounded border border-slate-200">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            {item.description &&
                      <p className="text-slate-600 text-xs mt-1">{item.description}</p>
                      }
                            <div className="flex gap-2 mt-2 flex-wrap text-xs">
                              <Badge variant="outline" className="capitalize">{item.check_type}</Badge>
                              {item.requires_note && <Badge variant="outline">Notes</Badge>}
                              {item.requires_photo && <Badge variant="outline">Photo</Badge>}
                            </div>
                          </div>
                    )}
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            </div>
          }

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailModal(false);
              handleEdit(selectedTemplate);
            }} className="bg-slate-900 hover:bg-slate-800">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'New Inspection Template'}</DialogTitle>
            <DialogDescription>
              Create and customize your inspection checklist with sections and items
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <TemplateEditor template={formData} onChange={setFormData} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
              className="bg-slate-900 hover:bg-slate-800">

              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}