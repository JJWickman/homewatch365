import React, { useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChecklistSection({
  section,
  items = [],
  responses = {},
  onItemChange,
  onPhotoUpload
}) {
  const [expanded, setExpanded] = useState(true);

  // Sort items by sort_order
  const sortedItems = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Count completed items
  const completedCount = sortedItems.filter(item => {
    if (item.response_type === 'instruction_only') return false;
    const resp = responses[item.id];
    return resp && (resp.response_value || resp.numeric_value !== null || (resp.photo_urls && resp.photo_urls.length > 0));
  }).length;

  const actionableItems = sortedItems.filter(i => i.response_type !== 'instruction_only');

  return (
    <Card className="border-slate-200">
      <CardHeader
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:bg-slate-50 pb-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {section.title}
              {completedCount === actionableItems.length && actionableItems.length > 0 && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {completedCount} of {actionableItems.length} completed
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {sortedItems.map(item => {
            const ChecklistItemRow = require('./ChecklistItemRow').default;
            return (
              <ChecklistItemRow
                key={item.id}
                item={item}
                response={responses[item.id]}
                onItemChange={onItemChange}
                onPhotoUpload={onPhotoUpload}
              />
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}