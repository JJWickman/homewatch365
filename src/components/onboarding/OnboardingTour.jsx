import React, { useEffect, useState } from 'react';
import IntroJs from 'intro.js';
import 'intro.js/introjs.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingTour({ open, onComplete, onDismiss, user, tenant }) {
  const [showCongrats, setShowCongrats] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: 'Step 1: Settings & Branding',
      intro: 'Go to Settings → Company tab. Update your company logo, name, address, and website. Optionally connect Google Business, Facebook, or Yelp profiles.',
      element: 'aside nav a[href*="Settings"]',
      position: 'right'
    },
    {
      title: 'Step 2: Add Your First Client',
      intro: 'Go to Clients and click "Add Client". Enter their name, address, select services, choose billing frequency, and set a portal PIN.',
      element: 'aside nav a[href*="Clients"]',
      position: 'right'
    },
    {
      title: 'Step 3: Create a Property',
      intro: 'Go to Properties and click "Add Property". Select the client, enter property details (type, bedrooms, bathrooms, square feet, year built). Validate the address for aerial imagery, add access info, emergency contacts, and check-in visit schedule. Save the property.',
      element: 'aside nav a[href*="Properties"]',
      position: 'right'
    },
    {
      title: 'Step 4: Set Property Pricing',
      intro: 'Open your property from Properties. Go to the Pricing tab. Configure base pricing ($60 standard + $15 per water zone), add water zones count, select visit frequency and payment terms (per visit, monthly, or annual). Save the property.',
      element: 'aside nav a[href*="Properties"]',
      position: 'right'
    },
    {
      title: 'Step 5: Customize a Checklist',
      intro: 'In your property, go to the Checklist tab. Click "Start Checklist Setup", select property type (Single Family, Condo/Villa, or High Rise). Name your checklist (e.g., "SuziesSummer2026 Checklist"), customize sections and instructions, then save. This checklist will load for all check-in visits at this property.',
      element: 'aside nav a[href*="Properties"]',
      position: 'right'
    }
  ];

  useEffect(() => {
    if (!open || showCongrats) return;

    const intro = IntroJs();
    const currentStepData = steps[currentStep];
    
    intro.setOptions({
      steps: [{
        element: currentStepData.element,
        intro: currentStepData.intro,
        position: currentStepData.position,
        highlightClass: 'introjs-highlight'
      }],
      tooltipClass: 'introjs-tooltip onboarding-tooltip',
      highlightClass: 'introjs-highlight onboarding-highlight',
      showBullets: false,
      showProgress: true,
      exitOnEsc: false,
      exitOnOverlayClick: false,
      skipLabel: 'Skip',
      nextLabel: currentStep === steps.length - 1 ? 'Complete' : 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Complete'
    });

    intro.oncomplete(() => {
      intro.exit();
      setShowCongrats(true);
    });

    intro.onexit(() => {
      onDismiss?.(false);
    });

    intro.start();

    return () => {
      intro.exit();
    };
  }, [open, showCongrats, currentStep, onDismiss]);

  const handleCompleteTour = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      onDismiss?.(dontShowAgain);
      onComplete();
    }, 500);
  };

  // Congratulations screen
  if (showCongrats) {
    return (
      <Dialog open={open && showCongrats} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Congratulations! 🎉</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center py-4">
            <div>
              <Sparkles className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Onboarding Complete!</h3>
              <p className="text-slate-600 text-sm">You've successfully set up your Home Watch 365 account</p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm"><strong>Step 1:</strong> Settings & Branding configured</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm"><strong>Step 2:</strong> First client added</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm"><strong>Step 3:</strong> Property created with details</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm"><strong>Step 4:</strong> Property pricing configured</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm"><strong>Step 5:</strong> Checklist customized & saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="dont-show-again"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer"
              />
              <label htmlFor="dont-show-again" className="text-sm text-slate-700 cursor-pointer flex-1 text-left">
                Don't show this again
              </label>
            </div>

            <Button 
              onClick={handleCompleteTour}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Start Using the App
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}