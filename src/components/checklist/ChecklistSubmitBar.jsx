import React from 'react';
import { Button } from '@/components/ui/button';

export default function ChecklistSubmitBar({ onSaveDraft, onSubmit, saving, hasUnansweredRequired }) {
  return (
    <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200 p-4 space-y-2 safe-bottom-padding">
      <Button
        onClick={onSaveDraft}
        disabled={saving}
        variant="outline"
        className="w-full"
      >
        {saving ? 'Saving Draft...' : 'Save Draft'}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={saving || hasUnansweredRequired}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {saving ? 'Submitting...' : 'Submit Checklist'}
      </Button>
      {hasUnansweredRequired && (
        <p className="text-xs text-red-600 text-center">Complete all required items before submitting</p>
      )}
    </div>
  );
}