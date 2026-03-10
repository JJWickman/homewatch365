import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ChecklistSection from '@/components/checklist/ChecklistSection';

const AUTOSAVE_DELAY = 1000;

export default function VisitChecklistPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const visitId = searchParams.get('visit_id');
  const propertyId = searchParams.get('property_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visit, setVisit] = useState(null);
  const [property, setProperty] = useState(null);
  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [completionPercent, setCompletionPercent] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const autosaveTimer = useRef(null);
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

      // Load template
      const templates = await base44.entities.ChecklistTemplate.filter({
        code: 'single_family_home_watch_visit',
        company_id: propertyData.company_id
      });

      if (!templates.length) {
        setError('Checklist template not found. Please seed it first.');
        return;
      }

      const templateData = templates[0];
      setTemplate(templateData);

      // Load sections and items
      const sectionList = await base44.entities.ChecklistTemplateSection.filter({
        template_id: templateData.id
      });
      setSections(sectionList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

      const itemList = await base44.entities.ChecklistTemplateItem.filter({
        template_id: templateData.id
      });
      setItems(itemList);

      // Get or create submission
      const submissions = await base44.entities.ChecklistSubmission.filter({
        visit_id: visitId,
        template_id: templateData.id
      });

      let submissionData;
      if (submissions.length) {
        submissionData = submissions[0];
      } else {
        submissionData = await base44.entities.ChecklistSubmission.create({
          template_id: templateData.id,
          visit_id: visitId,
          property_id: propertyId,
          company_id: propertyData.company_id,
          assigned_resource_id: user.current.email,
          status: 'in_progress',
          completion_percent: 0
        });
      }

      setSubmission(submissionData);

      // Load existing responses
      const submissionItems = await base44.entities.ChecklistSubmissionItem.filter({
        submission_id: submissionData.id
      });

      const responseMap = {};
      submissionItems.forEach(item => {
        responseMap[item.template_item_id] = item;
      });
      setResponses(responseMap);

      // Calculate completion
      updateCompletion(submissionData.id, responseMap, itemList);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const updateCompletion = (submissionId, responseMap, itemList) => {
    const actionableItems = itemList.filter(i => i.response_type !== 'instruction_only');
    const completed = actionableItems.filter(item => {
      const resp = responseMap[item.id];
      return resp && (resp.response_value || resp.numeric_value !== null || (resp.photo_urls?.length > 0));
    }).length;

    const percent = actionableItems.length > 0 ? Math.round((completed / actionableItems.length) * 100) : 0;
    setCompletionPercent(percent);
  };

  const handleItemChange = useCallback(
    (itemId, itemResponse) => {
      setResponses(prev => ({
        ...prev,
        [itemId]: itemResponse
      }));

      setSaveStatus('saving');

      // Clear existing timer
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }

      // Set new timer
      autosaveTimer.current = setTimeout(async () => {
        await saveResponse(itemId, itemResponse);
      }, AUTOSAVE_DELAY);
    },
    []
  );

  const saveResponse = async (itemId, itemResponse) => {
    try {
      if (!submission) return;

      const existingItem = responses[itemId];

      if (existingItem?.id) {
        // Update existing
        await base44.entities.ChecklistSubmissionItem.update(existingItem.id, {
          response_value: itemResponse.response_value || null,
          issue_flag: itemResponse.issue_flag || false,
          severity: itemResponse.severity || null,
          note: itemResponse.note || null,
          photo_urls: itemResponse.photo_urls || [],
          numeric_value: itemResponse.numeric_value || null
        });
      } else {
        // Create new
        await base44.entities.ChecklistSubmissionItem.create({
          submission_id: submission.id,
          template_item_id: itemId,
          response_value: itemResponse.response_value || null,
          issue_flag: itemResponse.issue_flag || false,
          severity: itemResponse.severity || null,
          note: itemResponse.note || null,
          photo_urls: itemResponse.photo_urls || [],
          numeric_value: itemResponse.numeric_value || null
        });
      }

      // Update completion
      const actionableItems = items.filter(i => i.response_type !== 'instruction_only');
      const completed = actionableItems.filter(item => {
        const resp = responses[item.id];
        return resp && (resp.response_value || resp.numeric_value !== null || (resp.photo_urls?.length > 0));
      }).length;

      const percent = actionableItems.length > 0 ? Math.round((completed / actionableItems.length) * 100) : 0;

      await base44.entities.ChecklistSubmission.update(submission.id, {
        completion_percent: percent
      });

      setSaveStatus('saved');
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  };

  const handlePhotoUpload = async (itemId, file) => {
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  };

  const validateSubmission = () => {
    const errors = [];

    items.forEach(item => {
      const resp = responses[item.id];

      // Check required items
      if (item.required) {
        if (!resp || (!resp.response_value && resp.numeric_value === null && !resp.photo_urls?.length)) {
          errors.push(`${item.label}: Answer required`);
        }
      }

      // Check issue note requirement
      if (resp?.issue_flag && !resp.note) {
        errors.push(`${item.label}: Note required when issue flagged`);
      }

      // Check photo_only items
      if (item.response_type === 'photo_only' && item.required && !resp?.photo_urls?.length) {
        errors.push(`${item.label}: Photo required`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateSubmission()) {
      setShowValidation(true);
      return;
    }

    setSubmitLoading(true);
    try {
      // Update submission
      await base44.entities.ChecklistSubmission.update(submission.id, {
        status: 'submitted',
        completed_at: new Date().toISOString(),
        completion_percent: 100
      });

      // Update visit
      await base44.entities.Visit.update(visitId, {
        checklist_completed: true,
        checklist_completed_at: new Date().toISOString()
      });

      // Navigate back to visits
      navigate('/Visits');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit checklist');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-slate-900">{property?.name}</h1>
          <p className="text-sm text-slate-600">
            {visit?.scheduled_date && new Date(visit.scheduled_date).toLocaleDateString()}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-600">Completion</span>
                <span className="text-sm font-semibold text-slate-900">{completionPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
            {saveStatus === 'saving' && (
              <div className="ml-4 flex items-center gap-1 text-xs text-slate-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="ml-4 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
        {sections.map(section => (
          <ChecklistSection
            key={section.id}
            section={section}
            items={items.filter(i => i.section_id === section.id)}
            responses={responses}
            onItemChange={handleItemChange}
            onPhotoUpload={handlePhotoUpload}
          />
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/Visits')}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Checklist'
            )}
          </Button>
        </div>
      </div>

      {/* Validation dialog */}
      <Dialog open={showValidation} onOpenChange={setShowValidation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Required Fields</DialogTitle>
            <DialogDescription>
              Please address the following before submitting:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationErrors.map((error, idx) => (
              <div key={idx} className="flex gap-2 p-2 bg-red-50 rounded text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowValidation(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}