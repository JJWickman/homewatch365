import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChecklistHeaderComponent from '@/components/checklist/ChecklistHeaderComponent';
import ChecklistSectionComponent from '@/components/checklist/ChecklistSectionComponent';
import SubmissionReviewModal from '@/components/checklist/SubmissionReviewModal';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';
import { toast } from 'sonner';

const SLUG_DEFAULTS = {
  'single_family_standard': SFH_SECTIONS,
  'condo_villa_standard': CONDO_SECTIONS,
  'high_rise_standard': HIGHRISE_SECTIONS,
};

const AUTOSAVE_DEBOUNCE = 1000;

export default function VisitChecklistModal({ open, onOpenChange, visitId, propertyId, property, visit, onSubmitSuccess }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [itemsBySection, setItemsBySection] = useState({});
  const [responses, setResponses] = useState({});
  const [completionPercent, setCompletionPercent] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const autosaveTimeout = useRef(null);
  const user = useRef(null);

  useEffect(() => {
    if (open && visitId && propertyId) {
      loadInitialData();
    }
  }, [open, visitId, propertyId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      user.current = await base44.auth.me();

      // Load property checklist
      const checklistRecords = await base44.entities.PropertyChecklist.filter({
        property_id: propertyId,
        is_active: true
      });

      if (!checklistRecords.length) {
        setError('No checklist configured for this property.');
        return;
      }

      const propertyChecklist = checklistRecords[0];
      setTemplate({ name: propertyChecklist.name, id: propertyChecklist.id, instructions: propertyChecklist.checklist_instructions || '' });

      // Build sections
      let rawSections = propertyChecklist.customized_sections || [];
      if (rawSections.length === 0 && propertyChecklist.template_id) {
        const linkedTemplates = await base44.entities.ChecklistTemplateV2.filter({ id: propertyChecklist.template_id });
        const linkedTemplate = linkedTemplates[0];
        if (linkedTemplate) {
          rawSections = linkedTemplate.sections || SLUG_DEFAULTS[linkedTemplate.template_slug] || [];
        }
      }

      const builtSections = rawSections.map((sec, sIdx) => ({
        id: `${propertyChecklist.id}-sec-${sIdx}`,
        title: sec.title,
        sort_order: sIdx
      }));
      setSections(builtSections);

      const itemsMap = {};
      builtSections.forEach((sec, sIdx) => {
        const rawItems = rawSections[sIdx].items || [];
        itemsMap[sec.id] = rawItems.map((item, iIdx) => ({
          id: `${sec.id}-item-${iIdx}`,
          section_id: sec.id,
          label: item.label,
          response_type: item.responseType || 'ok_issue_na',
          instructions: item.instructions || '',
          sort_order: iIdx,
          allow_na: true,
          allow_note: true,
          allow_photo: true
        }));
      });
      setItemsBySection(itemsMap);

      // Get or create submission
      const existingSubmissions = await base44.entities.ChecklistSubmission.filter({ visit_id: visitId });
      let sub;
      if (existingSubmissions.length > 0) {
        sub = existingSubmissions[0];
      } else {
        sub = await base44.entities.ChecklistSubmission.create({
          template_id: propertyChecklist.template_id || propertyChecklist.id,
          visit_id: visitId,
          property_id: propertyId,
          tenant_id: property?.tenant_id,
          assigned_resource_id: user.current.email,
          status: 'draft',
          started_at: new Date().toISOString(),
          completion_percent: 0
        });
      }
      setSubmission(sub);

      // Load existing responses
      const existingItems = await base44.entities.ChecklistSubmissionItem.filter({ submission_id: sub.id });
      const responseMap = {};
      existingItems.forEach(item => { responseMap[item.template_item_id] = item; });
      setResponses(responseMap);

      updateCompletion(sub.id);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const updateCompletion = useCallback(async (submissionId) => {
    try {
      const allItems = Object.values(itemsBySection).flat().filter(i => i.response_type !== 'instruction_only');
      const existingResponses = await base44.entities.ChecklistSubmissionItem.filter({ submission_id: submissionId });
      const answered = existingResponses.filter(r => r.response_value !== null || r.numeric_value !== null || (r.photo_urls && r.photo_urls.length > 0));
      const percent = allItems.length > 0 ? Math.round((answered.length / allItems.length) * 100) : 0;
      setCompletionPercent(percent);
      await base44.entities.ChecklistSubmission.update(submissionId, { completion_percent: percent });
    } catch (err) {
      console.error('Completion calc error:', err);
    }
  }, [itemsBySection]);

  const saveItemResponse = useCallback(async (submissionId, templateItemId, payload) => {
    try {
      const existing = await base44.entities.ChecklistSubmissionItem.filter({ submission_id: submissionId, template_item_id: templateItemId });
      const itemData = { submission_id: submissionId, template_item_id: templateItemId, tenant_id: property?.tenant_id, ...payload };
      if (existing.length > 0) {
        await base44.entities.ChecklistSubmissionItem.update(existing[0].id, itemData);
      } else {
        await base44.entities.ChecklistSubmissionItem.create(itemData);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  }, [property?.tenant_id]);

  const handleItemChange = useCallback((templateItemId, newResponse) => {
    setResponses(prev => ({ ...prev, [templateItemId]: newResponse }));
    setSaveStatus('saving');

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(async () => {
      try {
        await saveItemResponse(submission.id, templateItemId, newResponse);
        setSaveStatus('saved');
        updateCompletion(submission.id);
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE);
  }, [submission?.id, saveItemResponse, updateCompletion]);

  const handleSubmitClick = async () => {
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      await base44.entities.ChecklistSubmission.update(submission.id, {
        status: 'submitted',
        completed_at: new Date().toISOString(),
        completion_percent: 100
      });
      await base44.entities.Visit.update(visitId, { status: 'completed' });
      toast.success('Checklist submitted successfully');
      onOpenChange(false);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      setError('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setShowReviewModal(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="bg-slate-900 text-white px-6 pt-6 pb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-white">
              {template?.name || 'Checklist'}
            </DialogTitle>
            <button onClick={() => onOpenChange(false)} className="text-slate-300 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {template?.instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <span className="font-semibold text-amber-900 text-sm">Instructions</span>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{template.instructions}</p>
                  </div>
                )}

                {sections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(section => (
                  <ChecklistSectionComponent
                    key={section.id}
                    section={section}
                    items={itemsBySection[section.id] || []}
                    responses={responses}
                    onItemChange={handleItemChange}
                    onPhotoUpload={() => {}}
                  />
                ))}
              </>
            )}
          </div>

          <div className="border-t bg-slate-50 px-6 py-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitClick} 
              disabled={loading || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Checklist'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubmissionReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        validationErrors={[]}
        onConfirmSubmit={handleConfirmSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}