import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import MobileChecklistItem from '@/components/checklist/MobileChecklistItem';
import { base44 } from '@/api/base44Client';
import { SFH_SECTIONS } from '@/components/checklist/checklistDefaults';

const STORAGE_KEY = 'draft_sfh_checklist';

export default function SingleFamilyHomeChecklistPage() {
  const [sections, setSections] = useState(SFH_SECTIONS);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [responses, setResponses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const user = await base44.auth.me();
        const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
        if (members.length > 0) {
          const companies = await base44.entities.Company.filter({ id: members[0].company_id });
          const company = companies[0];
          const published = company?.settings?.checklists?.sfh;
          if (published?.published && published?.sections?.length > 0) {
            setSections(published.sections);
          }
        }
      } catch (e) {
        // use defaults
      } finally {
        setTemplateLoading(false);
      }
    };
    loadTemplate();
  }, []);

  const updateResponse = (sIdx, iIdx, val) =>
    setResponses(prev => ({ ...prev, [`${sIdx}_${iIdx}`]: val }));

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleSubmit = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
  };

  const totalActionable = sections.flatMap(s => s.items).filter(i => i.responseType !== 'instruction_only').length;
  const completed = Object.values(responses).filter(r => r.value || r.numValue || (r.photos?.length > 0)).length;
  const progress = totalActionable > 0 ? Math.round((completed / totalActionable) * 100) : 0;

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Checklist Submitted!</h2>
        <p className="text-slate-500 mb-8">Single Family Home visit checklist submitted successfully.</p>
        <Link to={createPageUrl('ChecklistFormsPage')}>
          <Button variant="outline" className="px-8"><ArrowLeft className="w-4 h-4 mr-2" />Back to Checklists</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto pb-28">
        <div className="flex items-center gap-3 mb-5">
          <Link to={createPageUrl('ChecklistFormsPage')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Single Family Home</h1>
            <p className="text-sm text-slate-500">Home Watch Visit Checklist</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progress</span>
            <span className="text-sm font-bold text-slate-900">{completed} / {totalActionable} · {progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {sections.map((section, sIdx) => (
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