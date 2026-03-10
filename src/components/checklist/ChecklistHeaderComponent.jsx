import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, User, Save, AlertCircle } from 'lucide-react';

export default function ChecklistHeaderComponent({ property, visit, completionPercent, saveStatus }) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="p-4 space-y-3">
        {/* Property and Visit Info */}
        <div>
          <h1 className="text-lg font-bold text-slate-900 line-clamp-2">
            {property?.name || property?.address || 'Property'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {property?.address && `${property.address}`}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-xs">
          {visit?.scheduled_date && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-4 w-4" />
              <span>{new Date(visit.scheduled_date).toLocaleDateString()}</span>
            </div>
          )}
          {visit?.assigned_to_name && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="h-4 w-4" />
              <span>{visit.assigned_to_name}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm font-bold text-slate-900">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2.5" />
        </div>

        {/* Save Status */}
        <div className="flex items-center justify-end gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Save className="h-3.5 w-3.5" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Save error</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}