import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VisitFormRenderer({ visitId, propertyId, templateId, visitType }) {
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [property, setProperty] = useState(null);
  const [visit, setVisit] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [visitId, propertyId, templateId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [visitData, propertyData, templateData] = await Promise.all([
        base44.entities.Visit.filter({ id: visitId }),
        base44.entities.Property.filter({ id: propertyId }),
        base44.entities.ChecklistTemplate.filter({ id: templateId }),
      ]);

      if (visitData.length > 0) setVisit(visitData[0]);
      if (propertyData.length > 0) setProperty(propertyData[0]);
      if (templateData.length > 0) setTemplate(templateData[0]);

      // Initialize response object
      if (templateData.length > 0 && templateData[0].sections) {
        const init = {};
        templateData[0].sections?.forEach(section => {
          section.items?.forEach(item => {
            init[item.label] = '';
          });
        });
        setResponses(init);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (itemLabel, value) => {
    setResponses(prev => ({ ...prev, [itemLabel]: value }));
  };

  const handleSubmit = async () => {
    if (!visit || !template || !property) {
      toast.error('Missing required data');
      return;
    }

    setSubmitting(true);
    try {
      // Create ChecklistSubmission
      const submission = await base44.entities.ChecklistSubmission.create({
        template_id: template.id,
        visit_id: visit.id,
        property_id: property.id,
        tenant_id: property.tenant_id,
        assigned_resource_id: user?.id,
        status: 'submitted',
        overall_notes: '',
        completion_percent: 100,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      // Create ChecklistSubmissionItems for each response
      const items = Object.entries(responses).map(([label, value]) => ({
        submission_id: submission.id,
        tenant_id: property.tenant_id,
        template_item_id: label, // Use label as ID for now
        response_value: value,
        issue_flag: false,
        severity: 'low',
        note: '',
        photo_urls: [],
      }));

      await Promise.all(
        items.map(item => base44.entities.ChecklistSubmissionItem.create(item))
      );

      // Update visit status
      await base44.entities.Visit.update(visit.id, { status: 'completed' });

      toast.success('Visit submitted successfully');
      navigate(createPageUrl('PropertyDetail') + `?id=${propertyId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit visit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!template || !property || !visit) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load form data</p>
        <Button onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${propertyId}`)} className="mt-4">
          Return to Property
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('Properties'))}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{template.name}</CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            {property.name || property.address} • {format(new Date(), 'MMM d, yyyy h:mm a')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.sections?.map((section, sIdx) => (
            <div key={sIdx} className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
              <div className="space-y-4">
                {section.items?.map((item, iIdx) => (
                  <div key={iIdx} className="p-4 bg-slate-50 rounded-lg">
                    <label className="block font-medium text-slate-700 mb-2">{item.label}</label>
                    {item.instructions && <p className="text-xs text-slate-600 mb-3">{item.instructions}</p>}

                    {item.responseType === 'text' || !item.responseType ? (
                      <textarea
                        value={responses[item.label] || ''}
                        onChange={(e) => handleResponseChange(item.label, e.target.value)}
                        placeholder="Enter response..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                        rows={3}
                      />
                    ) : item.responseType === 'number' ? (
                      <input
                        type="number"
                        value={responses[item.label] || ''}
                        onChange={(e) => handleResponseChange(item.label, e.target.value)}
                        placeholder="Enter number..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      />
                    ) : item.responseType === 'ok_issue_na' ? (
                      <div className="flex gap-2">
                        {['OK', 'Issue', 'N/A'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleResponseChange(item.label, opt)}
                            className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors font-medium text-sm ${
                              responses[item.label] === opt
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={responses[item.label] || ''}
                        onChange={(e) => handleResponseChange(item.label, e.target.value)}
                        placeholder="Enter response..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Properties'))}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Visit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}