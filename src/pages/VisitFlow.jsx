import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const DEFAULT_CHECKLIST = [
  {
    section_name: 'Key Equipment',
    items: [
      { name: 'Breaker Box: Location noted', check_type: 'text', requires_photo: true },
      { name: 'Water Heater: Location noted', check_type: 'text', requires_photo: true },
      { name: 'Air Handler: Location noted', check_type: 'text', requires_photo: true },
      { name: 'Alarm Keypad: Location noted', check_type: 'text', requires_photo: true },
      { name: 'Any Other Important Features', check_type: 'text', requires_photo: true },
    ]
  },
  {
    section_name: 'Upon Arrival',
    items: [
      { name: 'Mailbox: Remove mail and newspapers if requested', check_type: 'yes_no', requires_photo: true },
      { name: 'Landscape: Note dry patches or signs of stress', check_type: 'pass_fail', requires_photo: true },
      { name: 'Signs of Rodents/Insects: Look for droppings or activity', check_type: 'yes_no', requires_photo: true },
      { name: 'Water Supply: Slowly turned ON at the main valve', check_type: 'yes_no', requires_photo: true },
      { name: 'Exterior Walk-Around: Observe windows, roof (from the ground), screens, AC unit, pavers, and pool cage', check_type: 'pass_fail', requires_photo: true },
    ]
  },
  {
    section_name: 'Inside the Home',
    items: [
      { name: 'Security System: Disarmed', check_type: 'yes_no', requires_photo: true },
      { name: 'Phone Line (if applicable): Checked for signal', check_type: 'yes_no', requires_photo: true },
    ]
  },
  {
    section_name: 'Water Zone™',
    items: [
      { name: 'Dishwasher: Operated and checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'Garbage Disposal: Operated and checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'Washing Machine: Operated and checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'Clothes Dryer: Operated and checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'All Sinks: Operated and checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'Refrigerator/Freezer: Checked', check_type: 'pass_fail', requires_photo: true },
      { name: 'Ice Maker: Emptied and turned off if needed', check_type: 'yes_no', requires_photo: true },
      { name: 'Food Removal: Perishables and frozen items checked', check_type: 'yes_no', requires_photo: true },
      { name: 'Wine Cooler/Wine Room: Temperature and moisture observed', check_type: 'pass_fail', requires_photo: true },
    ]
  },
  {
    section_name: 'Bathrooms',
    items: [
      { name: 'Showers & Tubs: Water run gently; look for signs of leaks or grout discoloration', check_type: 'pass_fail', requires_photo: true },
      { name: 'Toilets: Brushed, flushed, and monitored for leaks', check_type: 'pass_fail', requires_photo: true },
      { name: 'Water Heater: Checked for leaks or rust (should be OFF or on Vacation Mode)', check_type: 'pass_fail', requires_photo: true },
    ]
  },
  {
    section_name: 'AC System',
    items: [
      { name: 'Temperature & Humidity: Recorded', check_type: 'text', requires_photo: true },
      { name: 'Thermostat: Lowered slightly during visit', check_type: 'yes_no', requires_photo: true },
      { name: 'Cooling: Confirmed cold air is flowing', check_type: 'yes_no', requires_photo: true },
      { name: 'Filters & Secondary Pan (if accessible): Checked for buildup or water presence', check_type: 'pass_fail', requires_photo: true },
    ]
  },
  {
    section_name: 'Garage',
    items: [
      { name: 'Ceiling, Walls & Baseboards: Observed for damage or water marks', check_type: 'pass_fail', requires_photo: true },
      { name: 'Garage Door: Operated unless storm bars are installed', check_type: 'yes_no', requires_photo: true },
      { name: 'Breaker Box: Checked for proper function', check_type: 'pass_fail', requires_photo: true },
    ]
  },
  {
    section_name: 'Home Watch Mode',
    items: [
      { name: 'Room, closet, and pantry doors open for airflow', check_type: 'yes_no', requires_photo: true },
      { name: 'Cabinet doors under sinks left open', check_type: 'yes_no', requires_photo: true },
      { name: 'Toilet brush across the bowl to dry', check_type: 'yes_no', requires_photo: true },
      { name: 'Sink drains left open', check_type: 'yes_no', requires_photo: true },
    ]
  },
  {
    section_name: 'Departure',
    items: [
      { name: 'Thermostat: Returned to pre-set level', check_type: 'yes_no', requires_photo: true },
      { name: 'Water Supply: Turned OFF at the main valve; lines drained', check_type: 'yes_no', requires_photo: true },
      { name: 'Security System: Re-armed', check_type: 'yes_no', requires_photo: true },
      { name: 'Doors: Confirmed locked', check_type: 'yes_no', requires_photo: true },
    ]
  },
];

export default function VisitFlow() {
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [overallStatus, setOverallStatus] = useState('all_clear');
  const [flaggedItems, setFlaggedItems] = useState(new Set());
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  useEffect(() => {
    loadVisit();
  }, []);

  const loadVisit = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
       navigate(createPageUrl('Visits'));
       return;
     }

     try {
       const visits = await base44.entities.Visit.filter({ id });
       if (visits.length === 0) {
         navigate(createPageUrl('Visits'));
         return;
       }

      const v = visits[0];
      setVisit(v);
      setSummaryNotes(v.summary_notes || '');
      setOverallStatus(v.overall_status || 'all_clear');

      if (v.property_id) {
        const props = await base44.entities.Property.filter({ id: v.property_id });
        if (props.length > 0) setProperty(props[0]);
      }

      if (v.checklist_data && v.checklist_data.length > 0) {
        setChecklist(v.checklist_data);
      } else if (v.template_id) {
        const templates = await base44.entities.VisitTemplate.filter({ id: v.template_id });
        if (templates.length > 0 && templates[0].sections?.length > 0) {
          setChecklist(templates[0].sections.map(s => ({
            section_name: s.name,
            items: (s.items || []).map(item => ({
              name: item.name,
              check_type: item.check_type || 'pass_fail',
              requires_photo: item.requires_photo || false,
              status: '',
              value: '',
              notes: '',
              photo_urls: [],
              flagged: false
            }))
          })));
        } else {
          setChecklist(DEFAULT_CHECKLIST.map(s => ({
            ...s,
            items: s.items.map(i => ({ ...i, status: '', value: '', notes: '', photo_urls: [], flagged: false }))
          })));
        }
      } else {
        setChecklist(DEFAULT_CHECKLIST.map(s => ({
          ...s,
          items: s.items.map(i => ({ ...i, status: '', value: '', notes: '', photo_urls: [], flagged: false }))
        })));
      }

      if (v.status === 'scheduled') {
        await base44.entities.Visit.update(id, { status: 'in_progress' });
      }
    } catch (error) {
      console.error('Error loading visit:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (sectionIndex, itemIndex, field, value) => {
    const newChecklist = [...checklist];
    newChecklist[sectionIndex].items[itemIndex] = {
      ...newChecklist[sectionIndex].items[itemIndex],
      [field]: value
    };
    setChecklist(newChecklist);
  };

  const handlePhotoUpload = async (sectionIndex, itemIndex, e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newChecklist = [...checklist];
      const currentPhotos = newChecklist[sectionIndex].items[itemIndex].photo_urls || [];
      newChecklist[sectionIndex].items[itemIndex].photo_urls = [...currentPhotos, file_url];
      setChecklist(newChecklist);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const saveProgress = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      const photoCount = checklist.reduce((sum, section) =>
        sum + section.items.reduce((itemSum, item) => itemSum + (item.photo_urls?.length || 0), 0), 0);

      await base44.entities.Visit.update(visit.id, {
        checklist_data: checklist,
        summary_notes: summaryNotes,
        overall_status: overallStatus,
        photo_count: photoCount
        });

        navigate(createPageUrl('VisitDetail') + `?id=${visit.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      setSaving(false);
    }
  };

  const completeVisit = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      const photoCount = checklist.reduce((sum, section) =>
        sum + section.items.reduce((itemSum, item) => itemSum + (item.photo_urls?.length || 0), 0), 0);

      const issues = [];
      checklist.forEach(section => {
        section.items.forEach(item => {
          if (item.flagged || item.status === 'fail' || item.status === 'no') {
            issues.push({
              item_name: item.name,
              section: section.section_name,
              description: item.notes || `Issue found: ${item.name}`,
              status: item.status,
              photo_url: item.photo_urls?.[0] || null
            });
          }
        });
      });

      await base44.entities.Visit.update(visit.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: visit.assigned_to,
        checklist_data: checklist,
        summary_notes: summaryNotes,
        overall_status: overallStatus,
        photo_count: photoCount,
        issues_found: issues
      });

      for (const flagKey of flaggedItems) {
        const parts = flagKey.split('|');
        const [sectionIdx, itemIdx] = parts[0].split('-').map(Number);
        const section = checklist[sectionIdx];
        const item = section?.items[itemIdx];
        if (item) {
          await base44.entities.FollowUp.create({
            company_id: visit.company_id,
            property_id: visit.property_id,
            client_id: visit.client_id,
            title: `${item.name} - Follow-up Required`,
            description: item.notes || `Issue identified during check-in: ${item.name}`,
            type: 'inspection_followup',
            priority: 'medium',
            status: 'open',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
        }

        navigate(createPageUrl('VisitDetail') + `?id=${visit.id}`);
    } catch (error) {
      console.error('Error completing visit:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!visit) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">{property?.name || property?.address}</h1>
              <p className="text-sm text-slate-500">{property?.city}, {property?.state}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleteDialog(true)}
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Complete
          </Button>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-6 lg:px-6 pb-28">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">Your Exceptional Home Watch Visit</h2>
          <p className="text-xs text-slate-400 mt-1">Services may vary based on household equipment and homeowner requests.</p>
        </div>
        <Card>
          <div className="p-4 text-center text-slate-600">
            Checklist view component - integrate with checklist data
          </div>
        </Card>
      </div>

      {/* Complete Visit Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
            <DialogDescription>
              Finalize the check-in and save all checklist results.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Overall Status</Label>
              <Select value={overallStatus} onValueChange={setOverallStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_clear">All Clear - No Issues</SelectItem>
                  <SelectItem value="issues_found">Issues Found</SelectItem>
                  <SelectItem value="urgent">Urgent - Immediate Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Summary Notes</Label>
              <Textarea
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                placeholder="Add a summary of this visit..."
                rows={4}
              />
            </div>

            {flaggedItems.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {flaggedItems.size} flagged item{flaggedItems.size > 1 ? 's' : ''} will create follow-up tasks automatically.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={completeVisit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}