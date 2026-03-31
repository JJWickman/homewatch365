import React, { useEffect, useState } from 'react';
import IntroJs from 'intro.js';
import 'intro.js/introjs.css';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import confetti from 'canvas-confetti';

export default function OnboardingTour({ open, onComplete, onDismiss, user, tenant }) {
  const [showCongrats, setShowCongrats] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      element: 'aside nav a[href*="Settings"]',
      title: 'Step 1: Click Settings',
      intro: 'Click Settings in the menu.',
      position: 'right'
    },
    {
      element: 'aside nav a[href*="Clients"]',
      title: 'Step 2: Click Clients',
      intro: 'Click Clients in the menu.',
      position: 'right'
    },
    {
      element: 'aside nav a[href*="Properties"]',
      title: 'Step 3: Click Properties',
      intro: 'Click Properties in the menu.',
      position: 'right'
    }
  ];

  useEffect(() => {
    if (!open || showCongrats) return;

    const intro = IntroJs();

    intro.setOptions({
      steps: steps,
      tooltipClass: 'introjs-tooltip onboarding-tooltip',
      highlightClass: 'introjs-highlight onboarding-highlight',
      showBullets: true,
      showProgress: true,
      exitOnEsc: false,
      exitOnOverlayClick: false,
      skipLabel: 'Skip Tour',
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Complete Tour',
      disableInteraction: false,
      scrollToElement: true,
      scrollPadding: 30
    });

    intro.oncomplete(() => {
      intro.exit();
      setShowCongrats(true);
    });

    intro.onexit(() => {
      onDismiss?.(false);
    });

    setTimeout(() => {
      intro.start();
    }, 300);

    return () => {
      intro.exit();
    };
  }, [open, showCongrats, onDismiss]);

  // Congratulations modal
  if (showCongrats) {
    return (
      <>
        <style>{`
          .introjs-tooltip {
            max-width: 400px !important;
            padding: 16px !important;
            border-radius: 8px !important;
          }
          .introjs-tooltip .introjs-tooltiptext {
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          .introjs-tooltip .introjs-tooltip-title {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 8px !important;
          }
          .introjs-highlight {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 4px !important;
          }
          .introjs-button {
            background-color: #3b82f6 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
          }
        `}</style>
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
                      <p className="text-slate-900 text-sm"><strong>Settings:</strong> Company branding configured</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-slate-900 text-sm"><strong>Clients:</strong> First client added</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-slate-900 text-sm"><strong>Properties:</strong> Created with full details</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-slate-900 text-sm"><strong>Pricing:</strong> Visit fees configured</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-slate-900 text-sm"><strong>Checklist:</strong> Customized & ready</p>
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
                onClick={() => {
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                  setTimeout(() => {
                    onDismiss?.(dontShowAgain);
                    onComplete();
                  }, 500);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                Start Using the App
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}