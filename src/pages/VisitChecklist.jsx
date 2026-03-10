import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ChecklistProgressHeader from '@/components/checklist/ChecklistProgressHeader';
import ChecklistSectionCard from '@/components/checklist/ChecklistSectionCard';
import ChecklistSubmitBar from '@/components/checklist/ChecklistSubmitBar';
import SubmissionSummaryModal from '@/components/checklist/SubmissionSummaryModal';

export default function VisitChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visit_id');
  const propertyId = searchParams.get('property_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [visit, setVisit] = useState(null);
  const [property, setProperty] = useState(null);
  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});

  const autosaveTimeout = useRef(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [visitId, propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load visit and property
      const [visitData, propertyData] = await Promise.all([
        visitId ? base44.entities.Visit.filter({ id: visitId }) : Promise.resolve([]),
        propertyId ? base44.entities.Property.filter({ id: propertyId }) : Promise.resolve([])
      ]);

      const currentVisit = visitData[0];
      const currentProperty = propertyData[0];

      setVisit(currentVisit);
      setProperty(currentProperty);

      // Load template (use first active template for now)
      const templates = await base44.entities.ChecklistTemplate.filter({ active: true });
      const currentTemplate = templates[0];
      setTemplate(currentTemplate);

      if (currentTemplate) {
        // Load sections and items
        const sectionsData = await base44.entities.ChecklistTemplateSection.filter({
          template_id: currentTemplate.id
        });
        sectionsData.sort((a, b) => a.sort_order - b.sort_order);
        setSections(sectionsData);

        const itemsData = await base44.entities.ChecklistTemplateItem.filter({
          section_id: { $in: sectionsData.map(s => s.id) }
        });
        itemsData.sort((a, b) => a.sort_order - b.sort_order);
        setItems(itemsData);

        // Load or create submission
        const submissions = await base44.entities.ChecklistSubmission.filter({
          visit_id: visitId,
          template_id: currentTemplate.id
        });

        let currentSubmission = submissions[0];
        if (!currentSubmission) {
          const user = await base44.auth.me();
          const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
          
          currentSubmission = await base44.entities.ChecklistSubmission.create({
            template_id: currentTemplate.id,
            visit_id: visitId,
            property_id: propertyId,
            assigned_resource_id: members[0]?.id || null,
            company_id: currentProperty.company_id,
            status: 'in_progress',
            started_at: new Date().toISOString()
          });
        }

        setSubmission(currentSubmission);

        // Load submission items
        const submissionItems = await base44.entities.ChecklistSubmissionItem.filter({
          submission_id: currentSubmission.id
        });

        const responsesMap = {};
        submissionItems.forEach(item => {
          responsesMap[item.template_item_id] = {
            status_value: item.status_value,
            note: item.note,
            issue_flag: item.issue_flag,
            issue_severity: item.issue_severity,
            photo_urls: item.photo_urls || [],
            numeric_value: item.numeric_value,
            text_value: item.text_value
          };
        });
        setResponses(responsesMap);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Autosave on response change
  const autosaveItem = useCallback(async (itemId, updates) => {
    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(async () => {
      try {
        setSaving(true);
        const existingItems = await base44.entities.ChecklistSubmissionItem.filter({
          submission_id: submission.id,
          template_item_id: itemId
        });

        const updateData = {
          status_value: updates.status_value ?? existingItems[0]?.status_value,
          note: updates.note ?? existingItems[0]?.note,
          issue_flag: updates.issue_flag ?? existingItems[0]?.issue_flag,
          issue_severity: updates.issue_severity ?? existingItems[0]?.issue_severity,
          photo_urls: updates.photo_urls ?? existingItems[0]?.photo_urls,
          numeric_value: updates.numeric_value ?? existingItems[0]?.numeric_value,
          text_value: updates.text_value ?? existingItems[0]?.text_value
        };

        if (existingItems.length > 0) {
          await base44.entities.ChecklistSubmissionItem.update(existingItems[0].id, updateData);
        } else {
          await base44.entities.ChecklistSubmissionItem.create({
            submission_id: submission.id,
            template_item_id: itemId,
            ...updateData
          });
        }
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setSaving(false);
      }
    }, 1000);
  }, [submission?.id]);

  const handleItemUpdate = useCallback((itemId, updates) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates }
    }));
    autosaveItem(itemId, updates);
  }, [autosaveItem]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await base44.entities.ChecklistSubmission.update(submission.id, {
        status: 'draft',
        updated_at: new Date().toISOString()
      });
      alert('Draft saved');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await base44.entities.ChecklistSubmission.update(submission.id, {
        status: 'submitted',
        completed_at: new Date().toISOString()
      });

      // Mark visit as completed
      if (visit) {
        await base44.entities.Visit.update(visit.id, {
          status: 'completed'
        });
      }

      alert('Checklist submitted successfully');
      navigate('/Visits');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting checklist');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Calculate completion
  const completedItems = Object.keys(responses).filter(
    id => responses[id]?.status_value || responses[id]?.numeric_value
  );
  const totalActionableItems = items.filter(i => i.response_type !== 'instruction_only').length;
  const unansweredRequired = items
    .filter(i => i.required && (!responses[i.id]?.status_value && !responses[i.id]?.numeric_value))
    .map(i => i.label);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <ChecklistProgressHeader
        property={property}
        visit={visit}
        completedCount={completedItems.length}
        totalCount={totalActionableItems}
        onBack={() => navigate('/Visits')}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {sections.map((section) => {
          const sectionItems = items.filter(i => i.section_id === section.id);
          const sectionCompleted = sectionItems.filter(
            i => responses[i.id]?.status_value || responses[i.id]?.numeric_value
          ).length;

          return (
            <ChecklistSectionCard
              key={section.id}
              section={section}
              items={sectionItems}
              responses={responses}
              onItemUpdate={handleItemUpdate}
              completedCount={sectionCompleted}
              totalCount={sectionItems.filter(i => i.response_type !== 'instruction_only').length}
            />
          );
        })}
      </div>

      <ChecklistSubmitBar
        onSaveDraft={handleSaveDraft}
        onSubmit={() => setShowSubmitModal(true)}
        saving={saving || submitting}
        hasUnansweredRequired={unansweredRequired.length > 0}
      />

      <SubmissionSummaryModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        unansweredRequired={unansweredRequired}
        completedCount={completedItems.length}
        totalCount={totalActionableItems}
        onConfirm={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}