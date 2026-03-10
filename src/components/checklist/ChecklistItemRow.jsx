import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
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

        {/* OK / Issue / N/A buttons */}
        <div className="flex gap-2">
          <Button
            variant={value === 'ok' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onItemChange(item.id, { ...response, response_value: 'ok', issue_flag: false });
              setShowIssueDetails(false);
            }}
            className="flex-1"
          >
            OK
          </Button>
          <Button
            variant={value === 'issue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onItemChange(item.id, { ...response, response_value: 'issue', issue_flag: true });
              setShowIssueDetails(true);
            }}
            className="flex-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          >
            Issue
          </Button>
          {item.allow_na && (
            <Button
              variant={value === 'na' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                onItemChange(item.id, { ...response, response_value: 'na', issue_flag: false });
                setShowIssueDetails(false);
              }}
              className="flex-1"
            >
              N/A
            </Button>
          )}
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