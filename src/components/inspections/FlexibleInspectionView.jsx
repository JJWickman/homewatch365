import React, { useState } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function FlexibleInspectionView({
  inspection,
  photoUrls,
  handlePhotoUpload,
  summaryNotes,
  setSummaryNotes,
  uploading,
  saving,
  saveProgress
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Quick Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 uppercase">Inspection Type</Label>
              <p className="font-medium capitalize text-lg mt-1">{inspection.type.replace(/_/g, ' ')}</p>
            </div>
            {inspection.custom_inspection_name && (
              <div>
                <Label className="text-xs text-slate-500 uppercase">Name</Label>
                <p className="font-medium text-lg mt-1">{inspection.custom_inspection_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <div>
        <Label htmlFor="notes" className="text-sm font-medium mb-2 block">Notes & Observations</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about what you inspected..."
          value={summaryNotes}
          onChange={(e) => setSummaryNotes(e.target.value)}
          rows={5}
          className="text-sm"
        />
      </div>

      {/* Photos Section */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Photos</Label>
        <div className="grid grid-cols-2 gap-3">
          {photoUrls.map((url, index) => (
            <div key={index} className="rounded-lg overflow-hidden bg-slate-100 aspect-square">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          <label className="rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50 aspect-square">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : (
              <div className="text-center">
                <Camera className="h-8 w-8 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-500">Add Photo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Complete Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:left-64">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={saveProgress}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Complete Inspection
          </Button>
        </div>
      </div>
    </div>
  );
}