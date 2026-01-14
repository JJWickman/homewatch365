import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  ClipboardCheck, Building2, Camera, Check, X, 
  AlertTriangle, ChevronRight, ChevronLeft, MapPin,
  Save, CheckCircle2, Upload, Loader2, MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from '@/components/shared/StatusBadge';

// Default checklist if no template
const DEFAULT_CHECKLIST = [
  {
    section_name: 'Exterior',
    items: [
      { name: 'Front entrance condition', check_type: 'pass_fail', requires_photo: true },
      { name: 'Landscaping and lawn', check_type: 'pass_fail', requires_photo: true },
      { name: 'Driveway / walkways clear', check_type: 'yes_no', requires_photo: false },
      { name: 'Pool / spa condition', check_type: 'pass_fail', requires_photo: true },
      { name: 'Outdoor furniture', check_type: 'pass_fail', requires_photo: false },
    ]
  },
  {
    section_name: 'Interior - Main Areas',
    items: [
      { name: 'Living room condition', check_type: 'pass_fail', requires_photo: true },
      { name: 'Kitchen appliances working', check_type: 'yes_no', requires_photo: false },
      { name: 'Refrigerator / freezer', check_type: 'pass_fail', requires_photo: false },
      { name: 'Signs of pests', check_type: 'yes_no', requires_photo: false },
      { name: 'Odors or mustiness', check_type: 'yes_no', requires_photo: false },
    ]
  },
  {
    section_name: 'Interior - Bedrooms & Baths',
    items: [
      { name: 'Master bedroom', check_type: 'pass_fail', requires_photo: true },
      { name: 'Guest bedrooms', check_type: 'pass_fail', requires_photo: false },
      { name: 'Bathrooms - faucets working', check_type: 'yes_no', requires_photo: false },
      { name: 'Bathrooms - no leaks', check_type: 'yes_no', requires_photo: false },
      { name: 'Toilets functioning', check_type: 'yes_no', requires_photo: false },
    ]
  },
  {
    section_name: 'Systems',
    items: [
      { name: 'HVAC running properly', check_type: 'yes_no', requires_photo: false },
      { name: 'Thermostat setting', check_type: 'text', requires_photo: false },
      { name: 'Water heater', check_type: 'pass_fail', requires_photo: false },
      { name: 'Smoke detectors', check_type: 'pass_fail', requires_photo: false },
      { name: 'Security system', check_type: 'pass_fail', requires_photo: false },
    ]
  }
];

export default function InspectionFlow() {
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [checklist, setChecklist] = useState([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [overallStatus, setOverallStatus] = useState('all_clear');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  useEffect(() => {
    loadInspection();
  }, []);

  const loadInspection = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('Inspections'));
      return;
    }

    try {
      const inspectionData = await base44.entities.Inspection.filter({ id });
      
      if (inspectionData.length > 0) {
        const insp = inspectionData[0];
        setInspection(insp);
        setSummaryNotes(insp.summary_notes || '');
        setOverallStatus(insp.overall_status || 'all_clear');
        
        // Load property
        const propertyData = await base44.entities.Property.filter({ id: insp.property_id });
        if (propertyData.length > 0) setProperty(propertyData[0]);
        
        // Initialize checklist from existing data or template or default
        if (insp.checklist_data && insp.checklist_data.length > 0) {
          setChecklist(insp.checklist_data);
        } else if (insp.template_id) {
          const templates = await base44.entities.InspectionTemplate.filter({ id: insp.template_id });
          if (templates.length > 0 && templates[0].sections) {
            setChecklist(templates[0].sections.map(s => ({
              section_name: s.name,
              items: s.items.map(item => ({
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
        
        // Mark as in_progress if scheduled
        if (insp.status === 'scheduled') {
          await base44.entities.Inspection.update(id, { 
            status: 'in_progress',
            started_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
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
    const file = e.target.files[0];
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
    if (!inspection) return;
    
    setSaving(true);
    try {
      const photoCount = checklist.reduce((sum, section) => 
        sum + section.items.reduce((itemSum, item) => itemSum + (item.photo_urls?.length || 0), 0), 0);
      
      await base44.entities.Inspection.update(inspection.id, {
        checklist_data: checklist,
        summary_notes: summaryNotes,
        overall_status: overallStatus,
        photo_count: photoCount
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const completeInspection = async () => {
    if (!inspection) return;
    
    setSaving(true);
    try {
      const photoCount = checklist.reduce((sum, section) => 
        sum + section.items.reduce((itemSum, item) => itemSum + (item.photo_urls?.length || 0), 0), 0);
      
      const issues = [];
      checklist.forEach(section => {
        section.items.forEach(item => {
          if (item.flagged) {
            issues.push({
              item_name: item.name,
              description: item.notes || 'Issue flagged during inspection',
              severity: 'medium',
              photo_url: item.photo_urls?.[0] || null
            });
          }
        });
      });

      await base44.entities.Inspection.update(inspection.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        checklist_data: checklist,
        summary_notes: summaryNotes,
        overall_status: overallStatus,
        photo_count: photoCount,
        issues_found: issues
      });

      navigate(createPageUrl('InspectionDetail') + `?id=${inspection.id}`);
    } catch (error) {
      console.error('Error completing:', error);
    } finally {
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

  const currentSection = checklist[currentSectionIndex];
  const totalItems = checklist.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = checklist.reduce((sum, s) => sum + s.items.filter(i => i.status).length, 0);
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 -mx-4 px-4 py-4 border-b lg:-mx-6 lg:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">{property?.name || property?.address}</h1>
              <p className="text-sm text-slate-500">{property?.city}, {property?.state}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={saveProgress} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{completedItems}/{totalItems} items</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
        {checklist.map((section, index) => {
          const sectionComplete = section.items.every(i => i.status);
          return (
            <button
              key={index}
              onClick={() => setCurrentSectionIndex(index)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                index === currentSectionIndex
                  ? 'bg-slate-900 text-white'
                  : sectionComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {section.section_name}
            </button>
          );
        })}
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {currentSection?.items.map((item, itemIndex) => (
          <Card key={itemIndex} className={item.flagged ? 'border-amber-300 bg-amber-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                  {item.requires_photo && (
                    <span className="text-xs text-slate-500">Photo required</span>
                  )}
                </div>
                <button
                  onClick={() => updateItem(currentSectionIndex, itemIndex, 'flagged', !item.flagged)}
                  className={`p-1.5 rounded ${item.flagged ? 'bg-amber-200 text-amber-700' : 'hover:bg-slate-100 text-slate-400'}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </div>

              {/* Check Type Input */}
              {item.check_type === 'pass_fail' && (
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={item.status === 'pass' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'pass')}
                    className={item.status === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Pass
                  </Button>
                  <Button
                    type="button"
                    variant={item.status === 'fail' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'fail')}
                    className={item.status === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Fail
                  </Button>
                </div>
              )}

              {item.check_type === 'yes_no' && (
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={item.status === 'yes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'yes')}
                    className={item.status === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={item.status === 'no' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'no')}
                    className={item.status === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    No
                  </Button>
                </div>
              )}

              {item.check_type === 'text' && (
                <Input
                  placeholder="Enter value..."
                  value={item.value || ''}
                  onChange={(e) => {
                    updateItem(currentSectionIndex, itemIndex, 'value', e.target.value);
                    updateItem(currentSectionIndex, itemIndex, 'status', 'checked');
                  }}
                  className="mb-3"
                />
              )}

              {/* Notes */}
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-xs text-slate-500">Notes</Label>
                </div>
                <Textarea
                  placeholder="Add notes..."
                  value={item.notes || ''}
                  onChange={(e) => updateItem(currentSectionIndex, itemIndex, 'notes', e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Camera className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-xs text-slate-500">Photos</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.photo_urls?.map((url, photoIndex) => (
                    <div key={photoIndex} className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <label className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(currentSectionIndex, itemIndex, e)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:left-64">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {currentSectionIndex === checklist.length - 1 ? (
            <Button 
              onClick={() => setShowCompleteDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Inspection
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentSectionIndex(Math.min(checklist.length - 1, currentSectionIndex + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Inspection</DialogTitle>
            <DialogDescription>
              Review and finalize the inspection report
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
                placeholder="Add a summary of the inspection..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={completeInspection}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Complete & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}