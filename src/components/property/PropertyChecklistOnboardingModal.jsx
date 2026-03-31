import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, ClipboardList } from 'lucide-react';

export default function PropertyChecklistOnboardingModal({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Set Up Property Checklist',
      description: 'Create a checklist template for property inspections.',
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Step 1: Start Checklist Setup
            </h4>
            <p className="text-sm text-green-800">Click "Start Checklist Setup" in the Checklist tab to begin.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Step 2: Select a Template</h4>
            <p className="text-sm text-green-800">Choose a template based on property type (Single Family Home, Condo/Villa, High-Rise, etc.).</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Step 3: Customize (Optional)</h4>
            <p className="text-sm text-green-800">Customize the checklist by adding, removing, or modifying sections to fit your needs.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Step 4: Save Checklist</h4>
            <p className="text-sm text-green-800">Save the checklist to activate it for property inspections and visits.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Ready to Use
            </h4>
            <p className="text-sm text-blue-800">Once saved, field staff will use this checklist when recording property visits.</p>
          </div>
        </div>
      ),
    },
    {
      title: "You're Ready!",
      description: 'The property checklist is now set up.',
      content: (
        <div className="space-y-4 py-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Checklist Configured</p>
                  <p className="text-sm text-green-700">You can now record property visits using the Record Visit button.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-slate-600">
            Staff members assigned to this property can now use the checklist when performing inspections.
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
        <DialogHeader className="rounded-t-2xl bg-gradient-to-r from-green-600 to-green-700 px-6 pt-6 pb-4">
          <DialogTitle className="text-white text-lg font-semibold">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-green-100">{currentStep.description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          {currentStep.content}

          <div className="flex justify-between gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 0 && <div />}

            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="ml-auto bg-green-600 hover:bg-green-700">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onComplete();
                  onOpenChange(false);
                }}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}