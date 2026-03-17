import React, { useState } from 'react';
import { AlertCircle, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function ChecklistItemRow({
  item,
  response = {},
  onItemChange,
  onPhotoUpload
}) {
  const [showIssueDetails, setShowIssueDetails] = useState(response?.issue_flag || false);
  const [photoInputKey, setPhotoInputKey] = useState(0);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const result = await onPhotoUpload(item.id, file);
        if (result?.file_url) {
          const photos = response?.photo_urls || [];
          onItemChange(item.id, {
            ...response,
            photo_urls: [...photos, result.file_url]
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    setPhotoInputKey(k => k + 1);
  };

  const removePhoto = (photoUrl) => {
    const photos = (response?.photo_urls || []).filter(p => p !== photoUrl);
    onItemChange(item.id, {
      ...response,
      photo_urls: photos
    });
  };

  // Response Type: ok_issue_na
  if (item.response_type === 'ok_issue_na') {
    const value = response?.response_value;

    return (
      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-sm text-slate-900">{item.label}</p>
            {item.required && <Badge className="mt-1 text-xs">Required</Badge>}
          </div>
        </div>

        {/* Response buttons */}
        <div className="flex flex-col gap-2">
          {[
            { key: 'ok',    label: 'No Visible Issues Observed',    issueFlag: false, cls: value === 'ok' ? 'bg-green-600 text-white border-green-600' : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' },
            { key: 'issue', label: 'Issue Observed',                issueFlag: true,  cls: value === 'issue' ? 'bg-red-600 text-white border-red-600' : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' },
            ...(item.allow_na !== false ? [{ key: 'na', label: 'Not Observed / Not Accessible', issueFlag: false, cls: value === 'na' ? 'bg-slate-600 text-white border-slate-600' : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100' }] : []),
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => {
                onItemChange(item.id, { ...response, response_value: btn.key, issue_flag: btn.issueFlag });
                setShowIssueDetails(btn.issueFlag);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium text-left transition-colors ${btn.cls}`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${value === btn.key ? 'border-white' : 'border-current'}`}>
                {value === btn.key && <span className="w-2 h-2 rounded-full bg-white block" />}
              </span>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Issue details */}
        {showIssueDetails && (
          <div className="border-t pt-3 space-y-3 bg-red-50 p-3 rounded">
            {/* Severity */}
            {item.allow_severity && (
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Severity
                </label>
                <Select
                  value={response?.severity || ''}
                  onValueChange={(val) =>
                    onItemChange(item.id, { ...response, severity: val })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Note {item.required && value === 'issue' && <span className="text-red-600">*</span>}
              </label>
              <Textarea
                placeholder="Describe the issue..."
                value={response?.note || ''}
                onChange={(e) =>
                  onItemChange(item.id, { ...response, note: e.target.value })
                }
                className="h-20 text-sm"
              />
            </div>

            {/* Photo upload */}
            {item.allow_photo && (
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Photos
                </label>
                <input
                  key={photoInputKey}
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="text-sm"
                />
                {response?.photo_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {response.photo_urls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="h-12 w-12 rounded object-cover border border-slate-300"
                        />
                        <button
                          onClick={() => removePhoto(url)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional note when OK */}
        {value === 'ok' && item.allow_note && (
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Note (optional)
            </label>
            <Textarea
              placeholder="Add a note..."
              value={response?.note || ''}
              onChange={(e) =>
                onItemChange(item.id, { ...response, note: e.target.value })
              }
              className="h-16 text-sm"
            />
          </div>
        )}

        {/* Validation error */}
        {item.required && !value && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            Required field
          </div>
        )}

        {/* Missing note when issue */}
        {value === 'issue' && !response?.note && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            Note required when issue is flagged
          </div>
        )}
      </div>
    );
  }

  // Response Type: number
  if (item.response_type === 'number') {
    return (
      <div className="border border-slate-200 rounded-lg p-4">
        <label className="font-medium text-sm text-slate-900 block mb-2">
          {item.label}
        </label>
        <Input
          type="number"
          placeholder={item.placeholder || 'Enter value'}
          value={response?.numeric_value || ''}
          onChange={(e) =>
            onItemChange(item.id, {
              ...response,
              numeric_value: e.target.value ? parseFloat(e.target.value) : null
            })
          }
          className="text-sm"
        />
      </div>
    );
  }

  // Response Type: percentage
  if (item.response_type === 'percentage') {
    return (
      <div className="border border-slate-200 rounded-lg p-4">
        <label className="font-medium text-sm text-slate-900 block mb-2">
          {item.label}
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="0-100"
            value={response?.numeric_value || ''}
            onChange={(e) =>
              onItemChange(item.id, {
                ...response,
                numeric_value: e.target.value ? Math.min(100, Math.max(0, parseFloat(e.target.value))) : null
              })
            }
            className="text-sm"
          />
          <span className="flex items-center text-slate-600">%</span>
        </div>
      </div>
    );
  }

  // Response Type: photo_only
  if (item.response_type === 'photo_only') {
    return (
      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <div>
          <p className="font-medium text-sm text-slate-900">{item.label}</p>
          {item.required && <Badge className="mt-1 text-xs">Required</Badge>}
        </div>

        <input
          key={photoInputKey}
          type="file"
          multiple
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="text-sm"
        />

        {response?.photo_urls?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {response.photo_urls.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="h-16 w-16 rounded object-cover border border-slate-300"
                />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {item.required && !response?.photo_urls?.length && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            Photo required
          </div>
        )}
      </div>
    );
  }

  // Response Type: instruction_only
  if (item.response_type === 'instruction_only') {
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <p className="text-sm text-blue-900">{item.label}</p>
      </div>
    );
  }

  return null;
}