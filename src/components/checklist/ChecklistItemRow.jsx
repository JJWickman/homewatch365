import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, Camera, Trash2 } from 'lucide-react';

export default function ChecklistItemRow({
  item,
  response,
  onItemChange,
  onPhotoUpload
}) {
  const [photoInputKey, setPhotoInputKey] = useState(0);

  const handleResponseChange = (value) => {
    onItemChange(item.id, {
      ...response,
      response_value: value,
      issue_flag: value === 'issue'
    });
  };

  const handleNumericChange = (e) => {
    const val = parseFloat(e.target.value) || null;
    onItemChange(item.id, { ...response, numeric_value: val });
  };

  const handleNoteChange = (e) => {
    onItemChange(item.id, { ...response, note: e.target.value });
  };

  const handleSeverityChange = (val) => {
    onItemChange(item.id, { ...response, severity: val });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        const photos = response?.photo_urls || [];
        onItemChange(item.id, {
          ...response,
          photo_urls: [...photos, data.url]
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    setPhotoInputKey(k => k + 1);
  };

  const handleRemovePhoto = (index) => {
    const photos = response?.photo_urls || [];
    onItemChange(item.id, {
      ...response,
      photo_urls: photos.filter((_, i) => i !== index)
    });
  };

  // Instruction only - no input needed
  if (item.response_type === 'instruction_only') {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium">{item.label}</p>
        {item.instructions && (
          <p className="text-xs text-blue-800 mt-1">{item.instructions}</p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2.5">
      {/* Item Label */}
      <div>
        <p className="text-sm font-medium text-slate-900">{item.label}</p>
        {item.instructions && (
          <p className="text-xs text-slate-600 mt-0.5">{item.instructions}</p>
        )}
      </div>

      {/* OK / Issue / N/A Segmented Control */}
      {item.response_type === 'ok_issue_na' && (
        <div className="flex gap-2">
          {['ok', 'issue', 'na'].map(val => (
            <button
              key={val}
              onClick={() => handleResponseChange(val)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                response?.response_value === val
                  ? val === 'ok'
                    ? 'bg-green-600 text-white'
                    : val === 'issue'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {val === 'ok' ? '✓ OK' : val === 'issue' ? '⚠ Issue' : 'N/A'}
            </button>
          ))}
        </div>
      )}

      {/* Number Input */}
      {item.response_type === 'number' && (
        <Input
          type="number"
          inputMode="decimal"
          value={response?.numeric_value || ''}
          onChange={handleNumericChange}
          placeholder={item.placeholder || 'Enter value'}
          className="text-lg"
        />
      )}

      {/* Percentage Input */}
      {item.response_type === 'percentage' && (
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            value={response?.numeric_value || ''}
            onChange={handleNumericChange}
            placeholder="0"
            className="text-lg"
          />
          <div className="flex items-center px-3 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
            %
          </div>
        </div>
      )}

      {/* Photo Only */}
      {item.response_type === 'photo_only' && (
        <div className="space-y-2">
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <Camera className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-600 font-medium">Upload photo</span>
            <input
              key={photoInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          {response?.photo_urls && response.photo_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {response.photo_urls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issue Details (when Issue selected) */}
      {response?.issue_flag && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          {/* Severity */}
          {item.allow_severity && (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Severity</label>
              <Select value={response?.severity || ''} onValueChange={handleSeverityChange}>
                <SelectTrigger className="h-9">
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
          {item.allow_note && (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Issue details {item.allow_note && '*'}
              </label>
              <Textarea
                value={response?.note || ''}
                onChange={handleNoteChange}
                placeholder="Describe the issue..."
                className="text-sm min-h-20"
              />
            </div>
          )}

          {/* Photo */}
          {item.allow_photo && (
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-2">Photos</label>
              <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                <Camera className="h-4 w-4 text-slate-600" />
                <span className="text-xs text-slate-600 font-medium">Add photos</span>
                <input
                  key={`issue-${photoInputKey}`}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {response?.photo_urls && response.photo_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {response.photo_urls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`Issue photo ${idx + 1}`} className="w-full h-16 object-cover rounded-lg" />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional Note (when not Issue) */}
      {!response?.issue_flag && item.allow_note && response?.response_value && (
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Notes</label>
          <Textarea
            value={response?.note || ''}
            onChange={handleNoteChange}
            placeholder="Add any notes..."
            className="text-sm min-h-16"
          />
        </div>
      )}

      {/* Optional Photo (when not Issue) */}
      {!response?.issue_flag && item.allow_photo && response?.response_value && (
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Photos</label>
          <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <Camera className="h-4 w-4 text-slate-600" />
            <span className="text-xs text-slate-600 font-medium">Add photos</span>
            <input
              key={`optional-${photoInputKey}`}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          {response?.photo_urls && response.photo_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {response.photo_urls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-14 object-cover rounded-lg" />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}