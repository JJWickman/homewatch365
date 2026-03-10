import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import ChecklistItemRow from './ChecklistItemRow';

export default function ChecklistSectionComponent({
  section,
  items,
  responses,
  onItemChange,
  onPhotoUpload
}) {
  const [expanded, setExpanded] = useState(true);

  // Sort items by sort_order
  const sortedItems = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Count completed items in this section
  const completedCount = sortedItems.filter(item => {
    if (item.response_type === 'instruction_only') return false;
    const resp = responses[item.id];
    return resp && (resp.response_value !== null || resp.numeric_value !== null || (resp.photo_urls && resp.photo_urls.length > 0));
  }).length;

  const actionableItems = sortedItems.filter(i => i.response_type !== 'instruction_only');

  return (
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors py-3 px-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base">{section.title}</h3>
            {section.description && (
              <p className="text-xs text-slate-600 mt-0.5">{section.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actionableItems.length > 0 && (
              <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {completedCount}/{actionableItems.length}
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-3">
          {sortedItems.map(item => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              response={responses[item.id]}
              onItemChange={onItemChange}
              onPhotoUpload={onPhotoUpload}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}