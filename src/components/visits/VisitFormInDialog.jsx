import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function VisitFormInDialog({ visit, property, template, onSubmitSuccess, onClose }) {
  const [sections, setSections] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [template]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      if (template?.sections) {
        setSections(template.sections);
        const init = {};
        template.sections.forEach(section => {
          section.items?.forEach(item => {
            init[item.label] = '';
          });
        });
        setResponses(init);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submission = await base44.entities.ChecklistSubmission.create({
        template_id: template?.id,
        visit_id: visit.id,
        property_id: property.id,
        tenant_id: property.tenant_id,
        assigned_resource_id: await base44.auth.me().then(u => u.email),
        status: 'submitted',
        completion_percent: 100,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      const items = Object.entries(responses).map(([label, value]) => ({
        submission_id: submission.id,
        tenant_id: property.tenant_id,
        template_item_id: label,
        response_value: value,
        issue_flag: false,
        severity: 'low',
        note: '',
        photo_urls: [],
      }));

      await Promise.all(items.map(item => base44.entities.ChecklistSubmissionItem.create(item)));
      await base44.entities.Visit.update(visit.id, { status: 'completed' });
      toast.success('Visit submitted');
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!template?.sections || sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 mb-4">No template available for this visit type</p>
        <Button variant="outline" onClick={onClose}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" />
        Back to visit types
      </button>

      <div>
        <h3 className="font-semibold text-slate-900">{template.name}</h3>
        <p className="text-sm text-slate-500">{property.name || property.address}</p>
      </div>

      {sections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-3">
          <h4 className="font-medium text-slate-900">{section.title}</h4>
          {section.items?.map((item, iIdx) => (
            <div key={iIdx} className="p-3 bg-white rounded-lg border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">{item.label}</label>
              {item.instructions && <p className="text-xs text-slate-600 mb-2">{item.instructions}</p>}

              {item.responseType === 'ok_issue_na' ? (
                <div className="flex gap-2">
                  {['OK', 'Issue', 'N/A'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setResponses(prev => ({ ...prev, [item.label]: opt }))}
                      className={`flex-1 py-1.5 px-2 rounded text-sm font-medium transition-colors ${
                        responses[item.label] === opt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : item.responseType === 'number' ? (
                <input
                  type="number"
                  value={responses[item.label] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [item.label]: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              ) : (
                <textarea
                  value={responses[item.label] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [item.label]: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  rows={2}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {submitting ? 'Submitting...' : 'Submit Visit'}
        </Button>
      </div>
    </div>
  );
}