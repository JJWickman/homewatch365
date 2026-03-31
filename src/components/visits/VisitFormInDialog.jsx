import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

export default function VisitFormInDialog({ visit, property, template, onSubmitSuccess, onClose }) {
  const [sections, setSections] = useState([]);
  const [responses, setResponses] = useState({});
  const [itemPhotos, setItemPhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledgedOffSite, setAcknowledgedOffSite] = useState(false);
  const fileInputRef = useRef(null);
  const [activePhotoItem, setActivePhotoItem] = useState(null);

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

  const handlePhotoCapture = (itemLabel) => {
    setActivePhotoItem(itemLabel);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoItem) return;
    e.target.value = '';
    setUploadingPhoto(activePhotoItem);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setItemPhotos(prev => ({
        ...prev,
        [activePhotoItem]: [...(prev[activePhotoItem] || []), file_url]
      }));
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setUploadingPhoto(null);
      setActivePhotoItem(null);
    }
  };

  const removePhoto = (itemLabel, url) => {
    setItemPhotos(prev => ({
      ...prev,
      [itemLabel]: (prev[itemLabel] || []).filter(u => u !== url)
    }));
  };

  const handleSubmit = async () => {
    // Check if location is not verified and user hasn't acknowledged
    if (visit.location_status === 'not_verified' && !acknowledgedOffSite) {
      toast.error('Please acknowledge that you are not on-site');
      return;
    }

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
        photo_urls: itemPhotos[label] || [],
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
      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" />
        Back to visit types
      </button>

      <div>
        <h3 className="font-semibold text-slate-900">{template.name}</h3>
        <p className="text-sm text-slate-500">{property.name || property.address}</p>
      </div>

      {/* Location Status Banner */}
      {visit.location_status === 'not_verified' && (
        <div className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900 mb-2">⚠️ Not On-Site</p>
          <p className="text-sm text-amber-800 mb-3">
            Recording visits when NOT on-site can lead to inaccurate information. Please confirm you understand the implications.
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledgedOffSite}
              onChange={(e) => setAcknowledgedOffSite(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-amber-900 font-medium">I understand and acknowledge this visit will be recorded as not verified</span>
          </label>
        </div>
      )}
      {visit.location_status === 'verified' && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-900">✓ On-Site Verified</p>
        </div>
      )}

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

              {/* Photo capture */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handlePhotoCapture(item.label)}
                  disabled={uploadingPhoto === item.label}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium py-1"
                >
                  {uploadingPhoto === item.label ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  {uploadingPhoto === item.label ? 'Uploading...' : 'Add Photo'}
                </button>
                {(itemPhotos[item.label] || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(itemPhotos[item.label] || []).map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                        <button
                          onClick={() => removePhoto(item.label, url)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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