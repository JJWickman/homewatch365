import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import confetti from 'canvas-confetti';

export default function OnboardingTour({ open, onComplete, onDismiss, user, tenant }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [highlightElement, setHighlightElement] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const steps = [
    {
      selector: 'aside a:has-text("Settings")',
      title: 'Configure Your Company',
      description: 'Go to Settings → Company Tab. Update your logo & branding, enter company name, address, and website. Connect Google Business, Facebook, or Yelp if available (optional—you can come back later). This completes Step 1.',
      action: 'Click Settings'
    },
    {
      selector: 'aside a:has-text("Clients")',
      title: 'Create Your First Client',
      description: 'Go to Clients on the main menu. Click "Add Client". Enter name, address, billing address (if different), select services they\'ve opted into, choose billing frequency, and set a portal PIN. This completes Step 2.',
      action: 'Click Clients'
    },
    {
      selector: 'aside a:has-text("Properties")',
      title: 'Create Your First Property',
      description: 'Go to Properties on the main menu. Click "Add Property". Choose the client you just created. Enter property details (type, status, bedrooms, bathrooms, square feet, year built, lot size). Type the address—the app will validate it and show an aerial image. Add access info, emergency contact, storm protection, check-in schedule, contractors, and notes as known. Save the property. This completes Step 3.',
      action: 'Click Properties'
    },
    {
      selector: 'aside a:has-text("Properties")',
      title: 'Set Property Pricing',
      description: 'Go back to the property you just created. Go to the Pricing tab. Review the standard pricing ($60 base + $15/additional water zone). Modify based on your business if needed. Set number of water zones, visit frequency, and payment terms (per visit, monthly invoice, or pre-pay annually). Add additional services (optional) and notes. Save the property. This completes Step 4.',
      action: 'Click Properties'
    },
    {
      selector: 'aside a:has-text("Properties")',
      title: 'Customize Your Checklist',
      description: 'Open the property you created. Go to the Checklist tab. Click "Start Checklist Setup". Select the property type (Single Family Home, Condo/Villa, or High Rise). Name your checklist something memorable (e.g., "SuziesSummer2026 Checklist"). Click "Continue to Editor". The standard checklist will load—add/remove/move sections, add instructions as needed. Save your checklist. It will highlight in green and load every time a Check-In visit is recorded. This completes Step 5.',
      action: 'Click Properties'
    }
  ];

  useEffect(() => {
    if (!open || showCongrats) return;

    const step = steps[currentStep];
    if (!step) return;

    // Simple selector - find the element by text content
    const findElementByText = (text) => {
      const links = document.querySelectorAll('aside a');
      for (const link of links) {
        if (link.textContent.trim() === text) {
          return link;
        }
      }
      return null;
    };

    const text = step.selector.match(/\"(.+?)\"/)?.[1];
    const element = text ? findElementByText(text) : null;

    if (element) {
      setHighlightElement(element);
      
      // Cleanup previous styles
      return () => {
        if (element) {
          element.style.outline = '';
          element.style.outlineOffset = '';
          element.style.boxShadow = '';
        }
      };
    }
  }, [currentStep, open, showCongrats, steps]);

  useEffect(() => {
    if (!highlightElement) return;

    // Apply highlight styles
    highlightElement.style.outline = '3px solid #3b82f6';
    highlightElement.style.outlineOffset = '4px';
    highlightElement.style.boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.1)';
    highlightElement.style.borderRadius = '6px';
    highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Position tooltip near the element
    const rect = highlightElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 280;
    const gap = 16;

    let top = rect.top + window.scrollY - tooltipHeight - gap;
    let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

    // Ensure it doesn't go off-screen
    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) left = window.innerWidth - tooltipWidth - 16;
    if (top < 16) top = rect.bottom + window.scrollY + gap;

    setTooltipPos({ top, left });
  }, [highlightElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCongrats(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!open) return null;

  // Congratulations modal
  if (showCongrats) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md">
          <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">
            <div className="space-y-6 text-center">
              <div>
                <Sparkles className="h-16 w-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-2">You're All Set!</h3>
                <p className="text-blue-100 text-sm">Your Home Watch 365 account is ready to go</p>
              </div>

              <Card className="bg-blue-500/20 border-blue-400">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <p className="text-white text-sm">Company information configured</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <p className="text-white text-sm">First client added</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <p className="text-white text-sm">Property set up with GPS coordinates</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <p className="text-white text-sm">Pricing configured</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      <p className="text-white text-sm">Checklist template assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                <input
                  type="checkbox"
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 cursor-pointer"
                />
                <label htmlFor="dont-show-again" className="text-sm text-white/80 cursor-pointer flex-1 text-left">
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
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Start Using the App
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed pointer-events-none z-50" style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px`, width: '320px' }}>
      <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-6 pointer-events-auto">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
            <p className="text-blue-100 text-sm leading-relaxed">{step.description}</p>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-between gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-blue-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-2 pt-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} size="sm" className="border-white/20 text-white hover:bg-white/10">
                ← Back
              </Button>
            )}
            {currentStep === 0 && <div />}

            <Button
              onClick={handleNext}
              size="sm"
              className="ml-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}