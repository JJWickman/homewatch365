import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SubmissionSummaryModal({ open, onOpenChange, unansweredRequired, completedCount, totalCount, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogDescription>
            Review your completion status before submitting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-slate-900">Completion Status</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Items Completed:</span>
              <span className="font-semibold text-slate-900">{completedCount} of {totalCount}</span>
            </div>
          </div>

          {unansweredRequired.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Unanswered Required Items</p>
                  <ul className="text-xs text-red-800 mt-1 space-y-1">
                    {unansweredRequired.slice(0, 3).map((label, idx) => (
                      <li key={idx}>• {label}</li>
                    ))}
                    {unansweredRequired.length > 3 && (
                      <li>• And {unansweredRequired.length - 3} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm text-slate-600">
              {unansweredRequired.length === 0
                ? 'All required items are complete. You may submit the checklist.'
                : 'Please complete all required items before submitting.'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Continue Editing
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || unansweredRequired.length > 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Submitting...' : 'Submit Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}