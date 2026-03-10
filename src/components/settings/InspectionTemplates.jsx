import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const DEFAULT_STANDARD_CHECKLIST_TEMPLATE = {
  name: 'Standard Checklist',
  description: 'Home Watch standard visit checklist covering arrival, water systems, HVAC, bathrooms, garage, and departure tasks.',
  type: 'standard',
  estimated_duration_minutes: 45,
  sections: [
    {
      name: 'Key Equipment Locations',
      order: 1,
      items: [
        { name: 'Breaker Box', description: 'Note location of breaker box', requires_photo: false, requires_note: true, check_type: 'text', order: 1 },
        { name: 'Water Heater', description: 'Note location of water heater', requires_photo: false, requires_note: true, check_type: 'text', order: 2 },
        { name: 'Air Handler', description: 'Note location of air handler', requires_photo: false, requires_note: true, check_type: 'text', order: 3 },
        { name: 'Alarm Keypad', description: 'Note location of alarm keypad', requires_photo: false, requires_note: true, check_type: 'text', order: 4 },
        { name: 'Other Important Features', description: 'Note any other important equipment locations', requires_photo: false, requires_note: true, check_type: 'text', order: 5 },
      ]
    },
    {
      name: 'Upon Arrival',
      order: 2,
      items: [
        { name: 'Mailbox', description: 'Remove mail and newspapers if requested', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
        { name: 'Landscape', description: 'Note dry patches or signs of stress', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 2 },
        { name: 'Signs of Rodents/Insects', description: 'Look for droppings or activity', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 3 },
        { name: 'Water Supply', description: 'Slowly turned ON at the main valve', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 },
        { name: 'Exterior Walk-Around', description: 'Observe windows, roof (from the ground), screens, AC unit, pavers, and pool cage', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 5 },
      ]
    },
    {
      name: 'Inside the Home',
      order: 3,
      items: [
        { name: 'Security System', description: 'Disarmed upon entry', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
        { name: 'Phone Line', description: 'Checked for signal (if applicable)', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 2 },
      ]
    },
    {
      name: 'Water Zone – Appliances',
      order: 4,
      items: [
        { name: 'Dishwasher', description: 'Operated and checked for leaks or issues', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 1 },
        { name: 'Garbage Disposal', description: 'Operated and checked for issues', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
        { name: 'Washing Machine', description: 'Operated and checked for leaks', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 },
        { name: 'Clothes Dryer', description: 'Checked for proper function', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 4 },
        { name: 'All Sinks', description: 'Run water and check for leaks or clogs', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 5 },
        { name: 'Refrigerator/Freezer', description: 'Temperature and condition checked', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 6 },
        { name: 'Ice Maker', description: 'Emptied and turned off if needed', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 7 },
        { name: 'Food Removal', description: 'Perishables and frozen items removed if needed', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 8 },
        { name: 'Wine Cooler/Wine Room', description: 'Temperature and moisture observed', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 9 },
      ]
    },
    {
      name: 'Bathrooms',
      order: 5,
      items: [
        { name: 'Showers & Tubs', description: 'Water run gently; look for signs of leaks or grout discoloration', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 1 },
        { name: 'Toilets', description: 'Brushed, flushed, and monitored for leaks', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
        { name: 'Water Heater', description: 'Checked for leaks or rust (should be OFF or on Vacation Mode)', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 3 },
      ]
    },
    {
      name: 'AC System',
      order: 6,
      items: [
        { name: 'Temperature & Humidity', description: 'Record current temperature and humidity readings', requires_photo: false, requires_note: true, check_type: 'text', order: 1 },
        { name: 'Thermostat', description: 'Lowered slightly during visit', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
        { name: 'Cooling', description: 'Confirmed cold air is flowing', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 },
        { name: 'Filters & Secondary Pan', description: 'Checked for buildup or water presence (if accessible)', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 4 },
      ]
    },
    {
      name: 'Garage',
      order: 7,
      items: [
        { name: 'Ceiling, Walls & Baseboards', description: 'Observed for damage or water marks', requires_photo: true, requires_note: true, check_type: 'pass_fail', order: 1 },
        { name: 'Garage Door', description: 'Operated unless storm bars are installed', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 2 },
        { name: 'Breaker Box', description: 'Checked for proper function', requires_photo: false, requires_note: true, check_type: 'pass_fail', order: 3 },
      ]
    },
    {
      name: 'Home Watch Mode',
      order: 8,
      items: [
        { name: 'Room/Closet/Pantry Doors', description: 'Open for airflow', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
        { name: 'Cabinet Doors Under Sinks', description: 'Left open', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
        { name: 'Toilet Brush', description: 'Placed across the bowl to dry', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 3 },
        { name: 'Sink Drains', description: 'Left open', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 },
      ]
    },
    {
      name: 'Departure Tasks',
      order: 9,
      items: [
        { name: 'Thermostat', description: 'Returned to pre-set level', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
        { name: 'Water Supply', description: 'Turned OFF at the main valve; lines drained', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
        { name: 'Security System', description: 'Re-armed', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 3 },
        { name: 'Doors', description: 'Confirmed locked', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 4 },
      ]
    },
  ]
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
        { name: 'Odors or mustiness', description: 'Check for any unusual smells', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }
      ]
    },
    {
      name: 'Water, Mold & Damage',
      order: 2,
      items: [
        { name: 'Signs of water leaks', description: 'Ceiling stains, water marks, dampness', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 1 },
        { name: 'Mold or mildew', description: 'Any visible mold growth', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 2 },
        { name: 'Storm damage', description: 'Broken windows, roof damage, downed branches', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 3 },
        { name: 'Pest activity signs', description: 'Droppings, nests, damage to materials', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 4 }
      ]
    },
    {
      name: 'Systems Check',
      order: 3,
      items: [
        { name: 'HVAC functioning', description: 'Heating/cooling system operational', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
        { name: 'Plumbing operational', description: 'Water pressure, drains working', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 2 },
        { name: 'Appliances functioning', description: 'Major appliances working properly', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 },
        { name: 'Utilities status', description: 'Gas, electric, water running normally', requires_photo: false, requires_note: true, check_type: 'text', order: 4 }
      ]
    },
    {
      name: 'Security Check',
      order: 4,
      items: [
        { name: 'Signs of forced entry', description: 'Broken locks, damaged doors/windows', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 1 },
        { name: 'Unauthorized access', description: 'Any evidence of intrusion', requires_photo: true, requires_note: true, check_type: 'yes_no', order: 2 },
        { name: 'Security system armed', description: 'Alarm system status', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }
      ]
    },
    {
      name: 'Doors, Windows & Systems',
      order: 5,
      items: [
        { name: 'Doors secure', description: 'All doors locked and functioning', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 1 },
        { name: 'Windows secure', description: 'Windows locked and undamaged', requires_photo: false, requires_note: false, check_type: 'yes_no', order: 2 },
        { name: 'Key systems functioning', description: 'Locks, codes, security systems working', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 3 }
      ]
    },
    {
      name: 'Tasks & Requests',
      order: 6,
      items: [
        { name: 'Mail/packages collected', description: 'Mailbox and packages collected', requires_photo: false, requires_note: true, check_type: 'yes_no', order: 1 },
        { name: 'Client-requested tasks', description: 'Any special requests completed', requires_photo: false, requires_note: true, check_type: 'text', order: 2 }
      ]
    }
  ]
};

export default function InspectionTemplates({ companyId, templates = [], onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
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
        await base44.entities.InspectionTemplate.update(editingId, formData);
      } else {
        await base44.entities.InspectionTemplate.create({
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
        await base44.entities.InspectionTemplate.delete(id);
        onRefresh?.();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleCopyDefault = async () => {
    setCopyingDefault(true);
    try {
      await base44.entities.InspectionTemplate.create({
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inspection Templates</CardTitle>
            <CardDescription>Create and manage inspection checklists for your team</CardDescription>
          </div>
          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button onClick={handleCopyDefault} disabled={copyingDefault} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                {copyingDefault ? 'Adding...' : 'Add Home Watch Template'}
              </Button>
            )}
            <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No inspection templates yet. Create one or use the default Home Watch template.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-slate-500">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{template.type}</Badge>
                      <Badge variant="outline">{template.sections?.length || 0} sections</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'New Inspection Template'}</DialogTitle>
            <DialogDescription>
              Create a custom inspection checklist for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Watch - Standard Inspection"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this template is used for"
                className="min-h-20"
              />
            </div>

            <div>
              <Label>Type</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="standard">Standard</option>
                <option value="pre_storm">Pre-Storm</option>
                <option value="post_storm">Post-Storm</option>
              </select>
            </div>

            <div className="text-sm text-slate-600">
              <p className="font-medium mb-2">Sections: {formData.sections?.length || 0}</p>
              <p>Edit the default template directly or customize sections in the admin console.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}