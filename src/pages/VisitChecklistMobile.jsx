import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ChecklistHeaderComponent from '@/components/checklist/ChecklistHeaderComponent';
import ChecklistSectionComponent from '@/components/checklist/ChecklistSectionComponent';
import ChecklistFooterBar from '@/components/checklist/ChecklistFooterBar';
import SubmissionReviewModal from '@/components/checklist/SubmissionReviewModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';

const TEMPLATE_DEFAULTS = {
  'sfh-template': SFH_SECTIONS,
  'condo-template': CONDO_SECTIONS,
  'highrise-template': HIGHRISE_SECTIONS,
};

const AUTOSAVE_DEBOUNCE = 1000; // 1 second

export default function VisitChecklistMobile() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const visitId = searchParams.get('visit_id');
  const propertyId = searchParams.get('property_id');
  const checklistId = searchParams.get('checklist_id');

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visit, setVisit] = useState(null);
  const [property, setProperty] = useState(null);
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
  const [validationErrors, setValidationErrors] = useState([]);

  const autosaveTimeout = useRef(null);
  const user = useRef(null);
  const company = useRef(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      user.current = await base44.auth.me();

      if (!visitId || !propertyId) {
        setError('Missing visit or property ID');
        return;
      }

      // Step 1: Load the property's unique checklist and basic data in parallel
      const [checklistRecords, visits, properties] = await Promise.all([
        checklistId
          ? base44.entities.PropertyChecklist.filter({ id: checklistId })
          : base44.entities.PropertyChecklist.filter({ property_id: propertyId, is_active: true }),
        base44.entities.Visit.filter({ id: visitId }),
        base44.entities.Property.filter({ id: propertyId })
      ]);

      if (!checklistRecords.length) {
        setError('No checklist configured for this property. Please set one up in the Property settings.');
        return;
      }
      if (!visits.length || !properties.length) {
        setError('Visit or property not found');
        return;
      }

      const propertyChecklist = checklistRecords[0];
      setVisit(visits[0]);
      setProperty(properties[0]);
      setTemplate({ name: propertyChecklist.name, id: propertyChecklist.id });

      const companies = await base44.entities.Company.filter({ id: properties[0].company_id });
      company.current = companies[0];

      // Step 2: Build sections and items from customized_sections, falling back to standard template defaults
      let rawSections = propertyChecklist.customized_sections || [];

      // If no customized sections saved yet, fall back to the standard template defaults
      if (rawSections.length === 0 && propertyChecklist.template_id) {
        rawSections = TEMPLATE_DEFAULTS[propertyChecklist.template_id] || [];
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

      // Step 3: Get or create submission for this visit
      const existingSubmissions = await base44.entities.ChecklistSubmission.filter({ visit_id: visitId });
      let sub;
      if (existingSubmissions.length > 0) {
        sub = existingSubmissions[0];
      } else {
        sub = await base44.entities.ChecklistSubmission.create({
          template_id: propertyChecklist.id,
          visit_id: visitId,
          property_id: propertyId,
          company_id: properties[0].company_id,
          assigned_resource_id: user.current.email,
          status: 'draft',
          started_at: new Date().toISOString(),
          completion_percent: 0
        });
      }
      setSubmission(sub);

      // Step 4: Load existing responses
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
      const itemData = { submission_id: submissionId, template_item_id: templateItemId, ...payload };
      if (existing.length > 0) {
        await base44.entities.ChecklistSubmissionItem.update(existing[0].id, itemData);
      } else {
        await base44.entities.ChecklistSubmissionItem.create(itemData);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  }, []);

  // Handle item change with debounced autosave
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
        // Update completion after save
        updateCompletion(submission.id);
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE);
  }, [submission?.id, saveItemResponse, updateCompletion]);

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      // All changes auto-saved, just update status
      await base44.entities.ChecklistSubmission.update(submission.id, {
        status: 'in_progress'
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save draft error:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitClick = async () => {
    setValidationErrors([]);
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
      navigate(-1);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setShowReviewModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      <ChecklistHeaderComponent
        property={property}
        visit={visit}
        completionPercent={completionPercent}
        saveStatus={saveStatus}
      />

      <div className="flex-1 p-4 space-y-4">
        {sections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(section => (
          <ChecklistSectionComponent
            key={section.id}
            section={section}
            items={itemsBySection[section.id] || []}
            responses={responses}
            onItemChange={handleItemChange}
            onPhotoUpload={(templateItemId) => {}}
          />
        ))}
      </div>

      <ChecklistFooterBar
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmitClick}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
      />

      <SubmissionReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        validationErrors={validationErrors}
        onConfirmSubmit={handleConfirmSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}