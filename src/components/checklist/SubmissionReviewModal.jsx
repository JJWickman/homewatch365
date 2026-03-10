import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SubmissionReviewModal({
  open,
  onOpenChange,
  validationErrors,
  onConfirmSubmit,
  isSubmitting
}) {
  const hasErrors = validationErrors && validationErrors.length > 0;

  // Group errors by section
  const errorsBySection = {};
  if (validationErrors) {
    validationErrors.forEach(err => {
      if (!errorsBySection[err.section]) {
        errorsBySection[err.section] = [];
      }
      errorsBySection[err.section].push(err);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                Review Checklist
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ready to Submit
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasErrors
              ? 'Please complete the required items below before submitting.'
              : 'Your checklist is complete and ready for submission.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto py-4">
          {hasErrors ? (
            Object.entries(errorsBySection).map(([section, errors]) => (
              <div key={section} className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-900">{section}</h4>
                <ul className="space-y-1.5 ml-2">
                  {errors.map((err, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-600 font-bold shrink-0">•</span>
                      <span>
                        <strong>{err.item}</strong>
                        <br />
                        <span className="text-slate-600 text-xs">{err.error}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">All required items completed</p>
              <p className="text-xs text-slate-600 mt-1">Your checklist is ready to be submitted.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={onConfirmSubmit}
            disabled={hasErrors || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}