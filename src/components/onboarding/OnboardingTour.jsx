import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

const STEPS = [
  {
    selector: null,
    title: '🏡 Welcome to Home Watch 365!',
    description: 'Congratulations on taking an important step toward running a successful Home Watch business! Home Watch 365 is your trusted partner — a platform built specifically for aspiring and growing Home Watch business owners like you.\n\nWe\'re going to walk you through 5 quick steps to help you get acquainted with the application and get your business up and running.',
  },
  {
    selector: 'Settings',
    title: 'Configure Your Company',
    description: 'Go to Settings → Company to set up your business name, logo, contact info, and branding. This is the foundation of your Home Watch business on the platform. This completes Step 1.',
  },
  {
    selector: 'Clients',
    title: 'Add Your First Client',
    description: 'Go to Clients on the main menu and click "Add Client". Enter the client\'s name, email, phone, and address. Set their service subscription and billing frequency. Save the client. This completes Step 2.',
  },
  {
    selector: 'Properties',
    title: 'Add a Property',
    description: 'Go to Properties on the main menu. Click "Add Property". Choose the client you just created. Enter property details and address — the app will validate it and show an aerial image. Add access info, emergency contact, and notes as needed. Save the property. This completes Step 3.',
  },
  {
    selector: 'Properties',
    title: 'Set Property Pricing',
    description: 'Go back to the property you just created. Go to the Pricing tab. Review the standard pricing ($60 base + $15/additional water zone). Modify based on your business if needed. Set number of water zones, visit frequency, and payment terms (per visit, monthly invoice, or pre-pay annually). Add additional services (optional) and notes. Save the property. This completes Step 4.',
  },
  {
    selector: 'Properties',
    title: 'Customize Your Checklist',
    description: 'Open the property you created. Go to the Checklist tab. Click "Start Checklist Setup". Select the property type, name your checklist, and click "Continue to Editor". The standard checklist will load — add/remove/move sections as needed. Save your checklist. This completes Step 5.',
  }
];

function getSavedStep() {
  try { return parseInt(localStorage.getItem('onboarding_step') || '0', 10); } catch { return 0; }
}
function getSavedCongrats() {
  try { return localStorage.getItem('onboarding_congrats') === 'true'; } catch { return false; }
}

export default function OnboardingTour({ open, onComplete, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(getSavedStep);
  const [showCongrats, setShowCongrats] = useState(getSavedCongrats);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 80, left: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarding_drag_pos');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Highlight nav element for current step
  useEffect(() => {
    if (!open || showCongrats) return;
    const step = STEPS[currentStep];
    if (!step || !step.selector) return;

    const links = document.querySelectorAll('aside a');
    let element = null;
    for (const link of links) {
      if (link.textContent && link.textContent.trim() === step.selector) {
        element = link;
        break;
      }
    }

    if (!element) return;

    element.style.outline = '3px solid #3b82f6';
    element.style.outlineOffset = '4px';
    element.style.boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.1)';
    element.style.borderRadius = '6px';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (!dragPos) {
      const rect = element.getBoundingClientRect();
      const tw = 320, th = 200, gap = 48;
      let top = rect.top + window.scrollY - th - gap;
      let left = rect.left + window.scrollX + rect.width / 2 - tw / 2;
      if (left < 16) left = 16;
      if (left + tw > window.innerWidth - 16) left = window.innerWidth - tw - 16;
      if (top < 16) top = rect.bottom + window.scrollY + gap;
      setTooltipPos({ top, left });
    }

    return () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
      element.style.boxShadow = '';
      element.style.borderRadius = '';
    };
  }, [currentStep, open, showCongrats, dragPos]);

  // Persist step
  useEffect(() => {
    try { localStorage.setItem('onboarding_step', currentStep.toString()); } catch {}
  }, [currentStep]);

  useEffect(() => {
    try { localStorage.setItem('onboarding_congrats', showCongrats.toString()); } catch {}
  }, [showCongrats]);

  useEffect(() => {
    if (dragPos) {
      try { localStorage.setItem('onboarding_drag_pos', JSON.stringify(dragPos)); } catch {}
    }
  }, [dragPos]);

  // Drag handling
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => setDragPos({ top: e.clientY - dragOffset.y, left: e.clientX - dragOffset.x });
    const up = () => setIsDragging(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [isDragging, dragOffset]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCongrats(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      try {
        if (dontShowAgain) localStorage.setItem('onboarding_dismissed', 'true');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_congrats');
        localStorage.removeItem('onboarding_drag_pos');
      } catch {}
      onDismiss?.(dontShowAgain);
      onComplete?.();
    }, 500);
  };

  try {
    if (localStorage.getItem('onboarding_dismissed') === 'true') return null;
  } catch {}

  if (!open) return null;

  // Congratulations screen
  if (showCongrats) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/20 shadow-2xl relative">
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 z-10 text-white/60 hover:text-white transition-colors bg-black/30 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          <div className="relative h-52 overflow-hidden">
              <img
                src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/930dadf8d_image.png"
                alt="Congratulations"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <h3 className="text-2xl font-bold text-white">You're All Set!</h3>
                <p className="text-blue-200 text-sm mt-1">Here's to your success 🥂</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-white/80 text-sm text-center leading-relaxed">
                Congratulations on completing your onboarding! You've taken the most important steps to get your Home Watch business up and running with Home Watch 365. Go make it happen!
              </p>
              <div
                className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20 cursor-pointer"
                onClick={() => setDontShowAgain(!dontShowAgain)}
              >
                <input
                  type="checkbox"
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 cursor-pointer"
                />
                <label htmlFor="dont-show-again" className="text-sm text-white/80 cursor-pointer flex-1">
                  Don't show this tour again
                </label>
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Start Using the App 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];
  if (!step) return null;
  const currentPos = dragPos || tooltipPos;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ top: `${currentPos.top}px`, left: `${currentPos.left}px`, width: '400px' }}
    >
      <div
        className="rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-6 pointer-events-auto cursor-grab active:cursor-grabbing select-none relative"
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors pointer-events-auto"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
            <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-line">{step.description}</p>
          </div>

          <div className="flex justify-between gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-blue-400' : 'bg-white/20'}`}
              />
            ))}
          </div>

          <div className="flex justify-between gap-2 pt-2">
            {currentStep > 0 ? (
              <Button onClick={handleBack} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                ← Back
              </Button>
            ) : <div />}
            <Button onClick={handleNext} size="sm" className="ml-auto bg-blue-500 hover:bg-blue-600 text-white">
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}