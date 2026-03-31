import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      description: 'Start by clicking Settings in the sidebar to set up your company branding and information.',
      action: 'Click Settings'
    },
    {
      selector: 'aside a:has-text("Clients")',
      title: 'Add Your First Client',
      description: 'Navigate to Clients to add the property owners you manage.',
      action: 'Click Clients'
    },
    {
      selector: 'aside a:has-text("Properties")',
      title: 'Create a Property',
      description: 'Add your first property with address, photos, and access information.',
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

  const handleSkip = () => {
    onDismiss?.(false);
  };

  if (!open) return null;

  // Congratulations modal
  if (showCongrats) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
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
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed z-40 max-w-sm" style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}>
      <Card className="shadow-xl border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                  Step {currentStep + 1} of {steps.length}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between pt-2">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="text-slate-600"
                  >
                    ← Back
                  </Button>
                )}
              </div>
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'} →
              </Button>
            </div>

            {/* Skip link */}
            <button
              onClick={handleSkip}
              className="w-full text-xs text-slate-500 hover:text-slate-700 transition-colors py-2"
            >
              Skip tour
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}