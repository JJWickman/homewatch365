import React, { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MobileChecklistItem({ label, instructions, responseType, response = {}, onChange }) {
  const [uploading, setUploading] = useState(false);

  const val = response.value;
  const note = response.note || '';
  const photos = response.photos || [];
  const numValue = response.numValue || '';

  const update = (patch) => onChange({ ...response, ...patch });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update({ photos: [...photos, file_url] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (idx) => update({ photos: photos.filter((_, i) => i !== idx) });

  if (responseType === 'instruction_only') {
    return (
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl">
        <p className="text-sm text-amber-800 font-medium leading-relaxed">{label}</p>
      </div>
    );
  }

  if (responseType === 'number' || responseType === 'percentage') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="font-semibold text-slate-800 mb-3">{label}</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={numValue}
            onChange={(e) => update({ numValue: e.target.value })}
            placeholder={responseType === 'percentage' ? 'e.g. 55' : 'e.g. 72'}
            className="flex-1 border border-slate-300 rounded-xl p-3 text-2xl font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-xl text-slate-500 font-semibold">{responseType === 'percentage' ? '%' : '°F'}</span>
        </div>
      </div>
    );
  }

  if (responseType === 'photo_only') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="font-semibold text-slate-800 mb-3">{label}</p>
        <div className="flex flex-wrap gap-3 items-center">
          {photos.map((url, idx) => (
            <div key={idx} className="relative">
              <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
              <button onClick={() => removePhoto(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-blue-50/50 transition-colors">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : (
              <>
                <Camera className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-blue-500 mt-1 font-medium">Take Photo</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>
    );
  }

  // Default: ok_issue_na
  const borderColor = val === 'ok' ? 'border-green-400' : val === 'issue' ? 'border-red-400' : val === 'na' ? 'border-slate-300' : 'border-slate-200';

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} p-4 shadow-sm transition-colors`}>
      <p className="font-semibold text-slate-800 mb-1 leading-snug text-[15px]">{label}</p>
      {instructions && <p className="text-xs text-slate-500 mb-2 italic leading-relaxed">{instructions}</p>}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { key: 'ok',    label: '✓ OK',    active: 'bg-green-500 border-green-500 text-white', inactive: 'border-green-200 text-green-600 bg-green-50' },
          { key: 'issue', label: '⚠ Issue', active: 'bg-red-500 border-red-500 text-white',     inactive: 'border-red-200 text-red-500 bg-red-50' },
          { key: 'na',    label: 'N/A',     active: 'bg-slate-500 border-slate-500 text-white', inactive: 'border-slate-200 text-slate-500 bg-slate-50' },
        ].map(btn => (
          <button key={btn.key} onClick={() => update({ value: btn.key })}
            className={`py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${val === btn.key ? btn.active : btn.inactive}`}>
            {btn.label}
          </button>
        ))}
      </div>

      {val && (
        <div className={`mt-4 pt-4 border-t space-y-3 ${val === 'issue' ? 'border-red-100' : 'border-slate-100'}`}>
          <textarea
            placeholder={val === 'issue' ? 'Describe the issue...' : 'Add a note (optional)...'}
            value={note}
            onChange={(e) => update({ note: e.target.value })}
            className={`w-full border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 ${
              val === 'issue'
                ? 'border-red-200 focus:ring-red-300 bg-red-50/30'
                : 'border-slate-200 focus:ring-blue-300 bg-slate-50/30'
            }`}
          />
          <div className="flex flex-wrap gap-2 items-center">
            {photos.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt="" className={`w-20 h-20 object-cover rounded-xl border ${val === 'issue' ? 'border-red-200' : 'border-slate-200'}`} />
                <button onClick={() => removePhoto(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              val === 'issue'
                ? 'border-red-200 hover:border-red-400 bg-red-50/30'
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/30'
            }`}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (
                <>
                  <Camera className={`w-5 h-5 ${val === 'issue' ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className={`text-xs mt-0.5 font-medium ${val === 'issue' ? 'text-red-400' : 'text-slate-400'}`}>Photo</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}