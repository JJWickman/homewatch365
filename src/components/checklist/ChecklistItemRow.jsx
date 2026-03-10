import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ChecklistItemRow({ item, response, onUpdate }) {
  const [showNote, setShowNote] = useState(response?.note ? true : false);
  const [showPhotoUI, setShowPhotoUI] = useState(response?.photo_urls?.length > 0 || false);
  const [note, setNote] = useState(response?.note || '');
  const [issueSeverity, setIssueSeverity] = useState(response?.issue_severity || 'medium');

  const handleStatusChange = (status) => {
    onUpdate({
      status_value: status,
      issue_flag: status === 'issue'
    });
    
    if (status === 'issue') {
      if (item.allow_issue_note) setShowNote(true);
      if (item.allow_issue_photo) setShowPhotoUI(true);
    } else {
      if (status !== 'issue') {
        setShowNote(false);
        setShowPhotoUI(false);
      }
    }
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    onUpdate({ note: e.target.value });
  };

  const handleSeverityChange = (severity) => {
    setIssueSeverity(severity);
    onUpdate({ issue_severity: severity });
  };

  const handleAddPhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          const { url } = await uploadRes.json();
          const photos = response?.photo_urls || [];
          onUpdate({ photo_urls: [...photos, url] });
        } catch (error) {
          console.error('Photo upload failed:', error);
        }
      }
    };
    input.click();
  };

  const handleRemovePhoto = (index) => {
    const photos = response?.photo_urls || [];
    onUpdate({ photo_urls: photos.filter((_, i) => i !== index) });
  };

  const responseType = item.response_type;
  const isOkIssueNa = responseType === 'ok_issue_na';
  const isTemp = responseType === 'temperature_reading';
  const isHumidity = responseType === 'humidity_reading';
  const isPhotoOnly = responseType === 'photo_only';
  const isInstruction = responseType === 'instruction_only';

  return (
    <div className="p-4 border-b border-slate-200 space-y-3 last:border-b-0">
      <div>
        <p className="font-medium text-slate-900 text-sm leading-snug">{item.label}</p>
        {item.help_text && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.help_text}</p>
        )}
      </div>

      {isInstruction && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900">
          Information only - no response needed
        </div>
      )}

      {isOkIssueNa && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={response?.status_value === 'ok' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('ok')}
            className={response?.status_value === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            OK
          </Button>
          <Button
            size="sm"
            variant={response?.status_value === 'issue' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('issue')}
            className={response?.status_value === 'issue' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Issue
          </Button>
          <Button
            size="sm"
            variant={response?.status_value === 'na' ? 'default' : 'outline'}
            onClick={() => handleStatusChange('na')}
            className={response?.status_value === 'na' ? 'bg-slate-600 hover:bg-slate-700' : ''}
          >
            N/A
          </Button>
        </div>
      )}

      {response?.status_value === 'issue' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-red-900">
            <AlertCircle className="h-4 w-4" />
            Issue Reported
          </div>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant={issueSeverity === 'low' ? 'default' : 'outline'}
              onClick={() => handleSeverityChange('low')}
              className={issueSeverity === 'low' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-xs'}
            >
              Low
            </Button>
            <Button
              size="xs"
              variant={issueSeverity === 'medium' ? 'default' : 'outline'}
              onClick={() => handleSeverityChange('medium')}
              className={issueSeverity === 'medium' ? 'bg-orange-600 hover:bg-orange-700' : 'text-xs'}
            >
              Medium
            </Button>
            <Button
              size="xs"
              variant={issueSeverity === 'high' ? 'default' : 'outline'}
              onClick={() => handleSeverityChange('high')}
              className={issueSeverity === 'high' ? 'bg-red-600 hover:bg-red-700' : 'text-xs'}
            >
              High
            </Button>
          </div>
        </div>
      )}

      {(showNote || (response?.status_value === 'issue' && item.allow_issue_note)) && (
        <Textarea
          value={note}
          onChange={handleNoteChange}
          placeholder={response?.status_value === 'issue' ? 'Describe the issue...' : 'Add note (optional)'}
          className="min-h-20 text-sm"
        />
      )}

      {(showPhotoUI || (response?.status_value === 'issue' && item.allow_issue_photo) || isPhotoOnly) && (
        <div className="space-y-2">
          {response?.photo_urls?.map((url, idx) => (
            <div key={idx} className="relative">
              <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover rounded border border-slate-200" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddPhoto}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Photo
          </Button>
        </div>
      )}

      {isTemp && (
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Enter temperature (°F)"
          value={response?.numeric_value || ''}
          onChange={(e) => onUpdate({ numeric_value: parseFloat(e.target.value) || null })}
          className="text-sm"
        />
      )}

      {isHumidity && (
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Enter humidity (%)"
          value={response?.numeric_value || ''}
          onChange={(e) => onUpdate({ numeric_value: parseInt(e.target.value) || null })}
          min="0"
          max="100"
          className="text-sm"
        />
      )}

      {item.required && !response?.status_value && responseType !== 'instruction_only' && (
        <Badge variant="outline" className="text-red-600 border-red-300">Required</Badge>
      )}
    </div>
  );
}