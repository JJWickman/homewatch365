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

  useEffect(() => {
    if (!open || showCongrats) return;

    const intro = IntroJs();
    intro.setOptions({
      steps: [
        {
          element: 'h1',
          intro: 'Welcome to Home Watch 365! Let\'s set up your account. First, update your company name in Settings.',
          position: 'bottom'
        },
        {
          element: 'main button:has-text("Add Property")',
          intro: 'Click here to add your first property. This is where you\'ll manage inspections and visits.',
          position: 'bottom'
        },
        {
          element: 'nav a[href*="Clients"]',
          intro: 'Create clients - the property owners you manage properties for.',
          position: 'bottom'
        },
        {
          element: 'nav a[href*="Properties"]',
          intro: 'View and manage all your properties here.',
          position: 'bottom'
        },
        {
          element: 'nav a[href*="Settings"]',
          intro: 'Configure pricing, templates, and company details in Settings.',
          position: 'bottom'
        }
      ],
      tooltipClass: 'introjs-tooltip onboarding-tooltip',
      highlightClass: 'introjs-highlight onboarding-highlight',
      showBullets: true,
      showProgress: true,
      exitOnEsc: true,
      exitOnOverlayClick: true,
      skipLabel: 'Skip',
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Got it!'
    });



    intro.oncomplete(() => {
      intro.exit();
      setShowCongrats(true);
    });

    intro.onexit(() => {
      if (intro._currentStep < intro._introItems.length - 1) {
        // User skipped - ask if they want to dismiss
        onDismiss?.(false);
      }
    });

    intro.start();

    return () => {
      intro.exit();
    };
  }, [open, showCongrats, onDismiss]);

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
            <DialogTitle className="text-center">Congratulations!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center py-4">
            <div>
              <Sparkles className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">You're All Set!</h3>
              <p className="text-slate-600 text-sm">Your Home Watch 365 account is ready to go</p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm">Company information configured</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm">First client added</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm">Property set up with GPS coordinates</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm">Pricing configured</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="text-slate-900 text-sm">Checklist template assigned</p>
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