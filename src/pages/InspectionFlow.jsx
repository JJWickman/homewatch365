import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Building2, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import StandardInspectionView from '@/components/inspections/StandardInspectionView';
import FlexibleInspectionView from '@/components/inspections/FlexibleInspectionView';
import MobileInspectionView from '@/components/inspections/MobileInspectionView';
import StatusBadge from '@/components/shared/StatusBadge';

const INSPECTION_CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', section: 'Plumbing' },
  { id: 'electrical', name: 'Electrical', section: 'Electrical' },
  { id: 'hvac', name: 'HVAC', section: 'HVAC' },
  { id: 'roof', name: 'Roof', section: 'Roof' },
  { id: 'appliances', name: 'Appliances', section: 'Appliances' },
  { id: 'landscape', name: 'Landscape', section: 'Landscape' },
  { id: 'lawn', name: 'Lawn', section: 'Lawn' }
];

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
  
  const [checklist, setChecklist] = useState([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [overallStatus, setOverallStatus] = useState('all_clear');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [mobileCategories, setMobileCategories] = useState([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [flaggedItems, setFlaggedItems] = useState(new Set());
  
  const isFlexibleType = inspection && ['other', 'custom_client_request', 'drop_in'].includes(inspection.type);
  const isStandardType = inspection && ['routine', 'pre_storm', 'post_storm'].includes(inspection.type);

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

         const isFlexible = ['other', 'custom_client_request', 'drop_in'].includes(insp.type);
         const isStandard = ['routine', 'pre_storm', 'post_storm'].includes(insp.type);

         if (isStandard) {
           // Initialize mobile categories
           setMobileCategories(INSPECTION_CATEGORIES.map(cat => ({
             ...cat,
             notes: '',
             photos: []
           })));
         } else if (!isFlexible) {
           // Initialize checklist for standard inspection types
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

  const handlePhotoUpload = async (sectionIndexOrCategoryId, itemIndex, e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (isStandardType) {
        // For mobile categories, add to category photo list
        setMobileCategories(prev =>
          prev.map(cat =>
            cat.id === sectionIndexOrCategoryId
              ? { ...cat, photos: [...(cat.photos || []), file_url] }
              : cat
          )
        );
      } else if (isFlexibleType) {
        // For flexible types, add to general photo list
        setPhotoUrls([...photoUrls, file_url]);
      } else {
        // For complex checklist types, add to checklist item
        const newChecklist = [...checklist];
        const currentPhotos = newChecklist[sectionIndexOrCategoryId].items[itemIndex].photo_urls || [];
        newChecklist[sectionIndexOrCategoryId].items[itemIndex].photo_urls = [...currentPhotos, file_url];
        setChecklist(newChecklist);
      }
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
      if (isStandardType) {
        // For standard types, build checklist from mobile categories and generate AI report
        const checklistData = mobileCategories.map(cat => ({
          section_name: cat.section,
          items: [{
            name: cat.name,
            status: cat.notes || cat.photos.length > 0 ? 'checked' : '',
            notes: cat.notes,
            photo_urls: cat.photos,
            flagged: flaggedItems.has(`category-${cat.id}`)
          }]
        }));

        const totalPhotos = mobileCategories.reduce((sum, cat) => sum + cat.photos.length, 0);

        // Save inspection first
        await base44.entities.Inspection.update(inspection.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          checklist_data: checklistData,
          photo_count: totalPhotos,
          overall_status: overallStatus
        });

        // Create follow-ups for flagged items
        for (const flagKey of flaggedItems) {
          const [itemId, followUpType, priority] = flagKey.split('|');
          
          if (itemId.startsWith('category-')) {
            const categoryId = itemId.replace('category-', '');
            const category = mobileCategories.find(c => c.id === categoryId);
            if (category) {
              await base44.entities.FollowUp.create({
                company_id: inspection.company_id,
                property_id: inspection.property_id,
                client_id: inspection.client_id,
                inspection_id: inspection.id,
                title: `${category.name} - Follow-up Required`,
                description: category.notes || `Issue identified during routine inspection of ${category.name}`,
                type: followUpType || 'inspection_followup',
                priority: priority || 'medium',
                status: 'open'
              });
            }
          }
        }

        // Generate AI report
        await base44.functions.invoke('generateInspectionReport', {
          inspection_id: inspection.id
        });
      } else if (isFlexibleType) {
        // For flexible types, save photos and notes
        await base44.entities.Inspection.update(inspection.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          summary_notes: summaryNotes,
          overall_status: overallStatus,
          photo_count: photoUrls.length
        });
      } else {
        // For complex checklist types
        const photoCount = checklist.reduce((sum, section) => 
          sum + section.items.reduce((itemSum, item) => itemSum + (item.photo_urls?.length || 0), 0), 0);
        
        await base44.entities.Inspection.update(inspection.id, {
          checklist_data: checklist,
          summary_notes: summaryNotes,
          overall_status: overallStatus,
          photo_count: photoCount
        });
      }
      navigate(createPageUrl('InspectionDetail') + `?id=${inspection.id}`);
    } catch (error) {
      console.error('Error saving:', error);
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

      // Create Issue entity records for each flagged item
      for (const issue of issues) {
        await base44.entities.Issue.create({
          company_id: inspection.company_id,
          property_id: inspection.property_id,
          client_id: inspection.client_id,
          inspection_id: inspection.id,
          title: issue.item_name,
          description: issue.description,
          status: 'open',
          priority: issue.severity === 'high' ? 'high' : 'medium',
          photo_urls: issue.photo_url ? [issue.photo_url] : []
        });
      }

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

  return (
    <div className="max-w-2xl mx-auto -mx-4 lg:-mx-6">
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
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 lg:px-6">
        {isStandardType ? (
          <MobileInspectionView
              inspection={inspection}
              categories={mobileCategories}
              setCategories={setMobileCategories}
              handlePhotoUpload={handlePhotoUpload}
              uploading={uploading}
              saving={saving}
              saveProgress={saveProgress}
              flaggedItems={flaggedItems}
              setFlaggedItems={setFlaggedItems}
            />
        ) : isFlexibleType ? (
          <FlexibleInspectionView
            inspection={inspection}
            photoUrls={photoUrls}
            handlePhotoUpload={handlePhotoUpload}
            summaryNotes={summaryNotes}
            setSummaryNotes={setSummaryNotes}
            uploading={uploading}
            saving={saving}
            saveProgress={saveProgress}
          />
        ) : (
           <StandardInspectionView
             checklist={checklist}
             updateItem={updateItem}
             handlePhotoUpload={handlePhotoUpload}
             uploading={uploading}
             saving={saving}
             saveProgress={saveProgress}
             flaggedItems={flaggedItems}
             setFlaggedItems={setFlaggedItems}
           />
         )}
      </div>

      {/* Complete Dialog for Complex Checklist Inspections */}
      {!isStandardType && !isFlexibleType && (
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
      )}
    </div>
  );
}