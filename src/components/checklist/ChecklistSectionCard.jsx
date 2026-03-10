import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ChecklistItemRow from './ChecklistItemRow';

export default function ChecklistSectionCard({ section, items, responses, onItemUpdate, completedCount, totalCount }) {
  const [expanded, setExpanded] = useState(true);

  const sectionProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h2 className="font-semibold text-slate-900">{section.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${sectionProgress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{completedCount}/{totalCount}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              response={responses[item.id]}
              onUpdate={(updates) => onItemUpdate(item.id, updates)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}