import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle } from 'lucide-react';

export default function ChecklistFooterBar({
  onSaveDraft,
  onSubmit,
  isSaving,
  isSubmitting
}) {
  return (
    <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200 p-4 space-y-2.5 shadow-lg">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || isSaving}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold"
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        {isSubmitting ? 'Submitting...' : 'Submit Checklist'}
      </Button>
      <Button
        onClick={onSaveDraft}
        disabled={isSaving}
        variant="outline"
        className="w-full py-3 text-sm"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Draft'}
      </Button>
    </div>
  );
}