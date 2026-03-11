import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Send, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import MobileChecklistItem from '@/components/checklist/MobileChecklistItem';

const SECTIONS = [
  {
    title: 'Upon Arrival',
    items: [
      { label: 'Check mailbox, remove newspapers, forward mail if requested, etc.', responseType: 'ok_issue_na' },
      { label: 'Exterior check of landscape for brown spots or dead plants', responseType: 'ok_issue_na' },
      { label: 'Check for signs of rodents, insects, or other critters', responseType: 'ok_issue_na' },
      { label: 'Turn the water ON at the main supply valve, slowly and gingerly', responseType: 'ok_issue_na' },
      { label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Pool and Spa',
    items: [
      { label: 'Pool water level checked', responseType: 'ok_issue_na' },
      { label: 'Pool equipment checked', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Interior Check',
    items: [
      { label: 'Disarm security system', responseType: 'ok_issue_na' },
      { label: 'Test the phone line', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Water Zone Home Watch Method',
    items: [
      { label: 'Short cycle on the dishwasher, check for visible leaks', responseType: 'ok_issue_na' },
      { label: 'Run the garbage disposal, check for proper operation and visible leaks', responseType: 'ok_issue_na' },
      { label: 'Short cycle on the washing machine, check for visible leaks', responseType: 'ok_issue_na' },
      { label: 'Operate clothes dryer', responseType: 'ok_issue_na' },
      { label: 'Run water in sinks, check for visible leaks', responseType: 'ok_issue_na' },
      { label: 'Check the refrigerator and freezer temp and for proper operation', responseType: 'ok_issue_na' },
      { label: 'Ice maker emptied and OFF', responseType: 'ok_issue_na' },
      { label: 'Perishable and frozen foods removed from fridge and freezer', responseType: 'ok_issue_na' },
      { label: 'Check wine cooler or wine room for proper temp, signs of water, moisture, or condensation', responseType: 'ok_issue_na' },
      { label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', responseType: 'instruction_only' },
      { label: 'Run water in showers and tubs, checking for visible leaks', responseType: 'ok_issue_na' },
      { label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', responseType: 'instruction_only' },
      { label: 'Brush and flush toilets, check for visible leaks and signs of water damage', responseType: 'ok_issue_na' },
      { label: 'Water heater should be OFF at the breaker or set to Vacation Mode. Circulator pump must be OFF.', responseType: 'instruction_only' },
      { label: 'Check water heater for signs of visible leaks and rust', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'AC System',
    items: [
      { label: 'Main room temperature', responseType: 'number' },
      { label: 'Main room humidity', responseType: 'percentage' },
      { label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', responseType: 'ok_issue_na' },
      { label: 'AC is blowing cold air', responseType: 'ok_issue_na' },
      { label: 'AC filters, if accessible, checked', responseType: 'ok_issue_na' },
      { label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Observe and Report',
    items: [
      { label: 'Check visible ceilings for signs of water intrusion or other damage', responseType: 'ok_issue_na' },
      { label: 'Check visible walls for signs of water intrusion or other damage', responseType: 'ok_issue_na' },
      { label: 'Check visible baseboards for signs of water or other damage', responseType: 'ok_issue_na' },
      { label: 'Check or test electronics only if requested by homeowner', responseType: 'ok_issue_na' },
      { label: 'Check windows and sliders for damage or leaks, and make sure locked', responseType: 'ok_issue_na' },
      { label: 'Ceiling fans are ON', responseType: 'ok_issue_na' },
      { label: 'Check for signs of insects or rodents', responseType: 'ok_issue_na' },
      { label: 'Check furniture for any irregularities', responseType: 'ok_issue_na' },
      { label: 'Home Watch Mode includes opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources', responseType: 'instruction_only' },
      { label: 'Is the residence in Home Watch Mode', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Storm Protection',
    items: [
      { label: 'Everything about storm protection will need to be customized for the property', responseType: 'instruction_only' },
      { label: 'Exercise electric storm shutters', responseType: 'ok_issue_na' },
      { label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Garage',
    items: [
      { label: 'Check visible ceiling, walls, and baseboards for signs of damage', responseType: 'ok_issue_na' },
      { label: 'Exercise the garage door', responseType: 'ok_issue_na' },
      { label: 'Check breaker box', responseType: 'ok_issue_na' },
    ],
  },
  {
    title: 'Departure',
    items: [
      { label: 'Always take a few moments before leaving the home to listen for unusual sounds', responseType: 'instruction_only' },
      { label: 'Thermostat(s) returned to proper setting', responseType: 'ok_issue_na' },
      { label: 'Turn water OFF at the main supply valve, slowly and gingerly, water lines drained', responseType: 'ok_issue_na' },
      { label: 'Photo of water valve in the OFF position', responseType: 'photo_only' },
      { label: 'Security system armed', responseType: 'ok_issue_na' },
      { label: 'Doors locked', responseType: 'ok_issue_na' },
    ],
  },
];

const STORAGE_KEY = 'draft_condo_villa_checklist';

export default function CondoVillaChecklistPage() {
  const [responses, setResponses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const updateResponse = (sIdx, iIdx, val) => {
    setResponses(prev => ({ ...prev, [`${sIdx}_${iIdx}`]: val }));
  };

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleSubmit = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
  };

  const totalActionable = SECTIONS.flatMap(s => s.items).filter(i => i.responseType !== 'instruction_only').length;
  const completed = Object.values(responses).filter(r => r.value || r.numValue || (r.photos && r.photos.length > 0)).length;
  const progress = totalActionable > 0 ? Math.round((completed / totalActionable) * 100) : 0;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Checklist Submitted!</h2>
        <p className="text-slate-500 mb-8">Condo / Villa visit checklist submitted successfully.</p>
        <Link to={createPageUrl('ChecklistFormsPage')}>
          <Button variant="outline" className="px-8"><ArrowLeft className="w-4 h-4 mr-2" />Back to Checklists</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link to={createPageUrl('ChecklistFormsPage')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Condo / Villa</h1>
            <p className="text-sm text-slate-500">Home Watch Visit Checklist</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progress</span>
            <span className="text-sm font-bold text-slate-900">{completed} / {totalActionable} · {progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{section.title}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-3">
              {section.items.map((item, iIdx) => (
                <MobileChecklistItem
                  key={iIdx}
                  label={item.label}
                  instructions={item.instructions}
                  responseType={item.responseType}
                  response={responses[`${sIdx}_${iIdx}`] || {}}
                  onChange={(val) => updateResponse(sIdx, iIdx, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            {draftSaved && <p className="text-sm text-green-600 font-semibold">✓ Draft saved</p>}
          </div>
          <Button variant="outline" onClick={saveDraft} className="shrink-0">
            <Save className="w-4 h-4 mr-1.5" />Save Draft
          </Button>
          <Button onClick={handleSubmit} className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
            <Send className="w-4 h-4 mr-1.5" />Submit
          </Button>
        </div>
      </div>
    </>
  );
}