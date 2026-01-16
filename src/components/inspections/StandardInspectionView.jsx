import React, { useState } from 'react';
import { 
  Camera, Check, X, AlertTriangle, ChevronRight, ChevronLeft,
  Save, CheckCircle2, Upload, Loader2, MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function StandardInspectionView({
  checklist,
  updateItem,
  handlePhotoUpload,
  uploading,
  saving,
  saveProgress
}) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  const currentSection = checklist[currentSectionIndex];
  const totalItems = checklist.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = checklist.reduce((sum, s) => sum + s.items.filter(i => i.status).length, 0);
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium">{completedItems}/{totalItems} items</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {checklist.map((section, index) => {
          const sectionComplete = section.items.every(i => i.status);
          return (
            <button
              key={index}
              onClick={() => setCurrentSectionIndex(index)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                index === currentSectionIndex
                  ? 'bg-slate-900 text-white'
                  : sectionComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {section.section_name}
            </button>
          );
        })}
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {currentSection?.items.map((item, itemIndex) => (
          <Card key={itemIndex} className={item.flagged ? 'border-amber-300 bg-amber-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                  {item.requires_photo && (
                    <span className="text-xs text-slate-500">Photo required</span>
                  )}
                </div>
                <button
                  onClick={() => updateItem(currentSectionIndex, itemIndex, 'flagged', !item.flagged)}
                  className={`p-1.5 rounded ${item.flagged ? 'bg-amber-200 text-amber-700' : 'hover:bg-slate-100 text-slate-400'}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </div>

              {/* Check Type Input */}
              {item.check_type === 'pass_fail' && (
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={item.status === 'pass' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'pass')}
                    className={item.status === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Pass
                  </Button>
                  <Button
                    type="button"
                    variant={item.status === 'fail' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'fail')}
                    className={item.status === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Fail
                  </Button>
                </div>
              )}

              {item.check_type === 'yes_no' && (
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={item.status === 'yes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'yes')}
                    className={item.status === 'yes' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={item.status === 'no' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItem(currentSectionIndex, itemIndex, 'status', 'no')}
                    className={item.status === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    No
                  </Button>
                </div>
              )}

              {item.check_type === 'text' && (
                <Input
                  placeholder="Enter value..."
                  value={item.value || ''}
                  onChange={(e) => {
                    updateItem(currentSectionIndex, itemIndex, 'value', e.target.value);
                    updateItem(currentSectionIndex, itemIndex, 'status', 'checked');
                  }}
                  className="mb-3"
                />
              )}

              {/* Notes */}
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-xs text-slate-500">Notes</Label>
                </div>
                <Textarea
                  placeholder="Add notes..."
                  value={item.notes || ''}
                  onChange={(e) => updateItem(currentSectionIndex, itemIndex, 'notes', e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Camera className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-xs text-slate-500">Photos</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.photo_urls?.map((url, photoIndex) => (
                    <div key={photoIndex} className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <label className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(currentSectionIndex, itemIndex, e)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:left-64">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {currentSectionIndex === checklist.length - 1 ? (
            <Button 
              onClick={saveProgress}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save & Review
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentSectionIndex(Math.min(checklist.length - 1, currentSectionIndex + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}