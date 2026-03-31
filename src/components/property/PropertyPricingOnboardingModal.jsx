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
import { CheckCircle2, ArrowRight, DollarSign } from 'lucide-react';

export default function PropertyPricingOnboardingModal({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Set Up Property Pricing',
      description: 'Configure the pricing for this property before setting up a checklist.',
      content: (
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Step 1: Base Service Pricing
            </h4>
            <p className="text-sm text-blue-800">Enter the base price per visit and any additional charges (water zones).</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Step 2: Visit Frequency</h4>
            <p className="text-sm text-blue-800">Select how often the property should be visited (2, 3, or 4-5 times per month).</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Step 3: Payment Terms</h4>
            <p className="text-sm text-blue-800">Choose how this property will be billed: per visit, monthly, or annual pre-pay.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Step 4: Optional Add-Ons</h4>
            <p className="text-sm text-blue-800">Select any additional services like concierge, emergency visits, or storm preparation.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Step 5: Save
            </h4>
            <p className="text-sm text-green-800">Click "Save Pricing Configuration" to save your settings.</p>
          </div>
        </div>
      ),
    },
    {
      title: "You're Ready!",
      description: 'Pricing has been configured successfully.',
      content: (
        <div className="space-y-4 py-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Pricing Configured</p>
                  <p className="text-sm text-green-700">Now you can set up a checklist for this property in the Checklist tab.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-slate-600">
            Once you click "Complete," you'll be guided to set up the property's checklist template.
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
        <DialogHeader className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-4">
          <DialogTitle className="text-white text-lg font-semibold">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-blue-100">{currentStep.description}</DialogDescription>
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
              <Button onClick={() => setStep(step + 1)} className="ml-auto bg-blue-600 hover:bg-blue-700">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onComplete();
                  onOpenChange(false);
                }}
                className="ml-auto bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}