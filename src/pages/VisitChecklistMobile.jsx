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

const AUTOSAVE_DEBOUNCE = 1000; // 1 second

export default function VisitChecklistMobile() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const visitId = searchParams.get('visit_id');
  const propertyId = searchParams.get('property_id');

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

      // Get visit and property
      const visits = await base44.entities.Visit.filter({ id: visitId });
      const properties = await base44.entities.Property.filter({ id: propertyId });

      if (!visits.length || !properties.length) {
        setError('Visit or property not found');
        return;
      }

      const visitData = visits[0];
      const propertyData = properties[0];
      setVisit(visitData);
      setProperty(propertyData);

      // Get company
      const companies = await base44.entities.Company.filter({ id: propertyData.company_id });
      company.current = companies[0];

      // Load template and checklist
      const templateResponse = await base44.functions.invoke('checklistHelpers', {
        action: 'getTemplate',
        payload: {
          template_code: 'condo_villa_home_watch_visit',
          company_id: propertyData.company_id
        }
      });

      if (!templateResponse.data.template) {
        setError('Checklist template not found. Please seed the Condo/Villa template first.');
        return;
      }

      setTemplate(templateResponse.data.template);
      setSections(templateResponse.data.sections || []);
      setItemsBySection(templateResponse.data.itemsBySection || {});

      // Get or create submission
      const submissionResponse = await base44.functions.invoke('checklistHelpers', {
        action: 'getOrCreateSubmission',
        payload: {
          visit_id: visitId,
          property_id: propertyId,
          template_code: 'condo_villa_home_watch_visit',
          company_id: propertyData.company_id,
          assigned_resource_id: user.current.email
        }
      });

      const sub = submissionResponse.data.submission;
      setSubmission(sub);

      // Load existing responses
      const responseMap = {};
      if (submissionResponse.data.items) {
        submissionResponse.data.items.forEach(item => {
          responseMap[item.template_item_id] = item;
        });
      }
      setResponses(responseMap);

      // Calculate completion
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
      const result = await base44.functions.invoke('checklistHelpers', {
        action: 'calculateCompletion',
        payload: {
          submission_id: submissionId,
          company_id: company.current.id
        }
      });
      setCompletionPercent(result.data.completion_percent || 0);
    } catch (err) {
      console.error('Completion calc error:', err);
    }
  }, []);

  const saveItemResponse = useCallback(async (submissionId, templateItemId, payload) => {
    try {
      await base44.functions.invoke('checklistHelpers', {
        action: 'saveItemResponse',
        payload: {
          submission_id: submissionId,
          template_item_id: templateItemId,
          ...payload
        }
      });
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
    // Validate first
    try {
      const validation = await base44.functions.invoke('checklistHelpers', {
        action: 'validateSubmission',
        payload: { submission_id: submission.id }
      });

      setValidationErrors(validation.data.errors || []);
      setShowReviewModal(true);
    } catch (err) {
      console.error('Validation error:', err);
      setError('Validation failed: ' + err.message);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      const result = await base44.functions.invoke('checklistHelpers', {
        action: 'submitChecklist',
        payload: { submission_id: submission.id }
      });

      if (result.data.success) {
        // Update visit status
        await base44.entities.Visit.update(visitId, {
          status: 'completed',
          checklist_status: 'completed',
          checklist_completed_at: new Date().toISOString()
        });

        // Navigate to success or back
        navigate(-1);
      }
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
        {sections.map(section => (
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