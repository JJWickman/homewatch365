import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChecklistProgressHeader({ property, visit, completedCount, totalCount, onBack }) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-900 truncate">{property?.name || 'Property'}</h1>
          <p className="text-xs text-slate-500">
            {visit?.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString() : 'Visit'}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium text-slate-900">{completedCount} of {totalCount}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}