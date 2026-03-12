import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Home, Building, Building2, Save, Globe, Plus, Trash2,
  ChevronDown, ChevronRight, Loader2, ArrowLeft, MessageSquare, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';

const TEMPLATES = [
  { key: 'sfh', title: 'Single Family Home', subtitle: 'Home Watch Visit Checklist', icon: Home, color: 'bg-blue-500', defaultSections: SFH_SECTIONS },
  { key: 'condo', title: 'Condo / Villa', subtitle: 'Home Watch Visit Checklist', icon: Building, color: 'bg-purple-500', defaultSections: CONDO_SECTIONS },
  { key: 'highrise', title: 'High Rise', subtitle: 'Home Watch Visit Checklist', icon: Building2, color: 'bg-emerald-500', defaultSections: HIGHRISE_SECTIONS },
];

export default function ChecklistEditor() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const templateKey = urlParams.get('type') || 'sfh';

  const [company, setCompany] = useState(null);
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const template = TEMPLATES.find(t => t.key === templateKey) || TEMPLATES[0];
  const Icon = template.icon;

  useEffect(() => {
    loadData();
  }, [templateKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      if (!members.length) return;
      const companies = await base44.entities.Company.filter({ id: members[0].company_id });
      const c = companies[0];
      setCompany(c);
      const saved = c?.settings?.checklists?.[templateKey];
      const raw = (saved?.sections?.length > 0)
        ? JSON.parse(JSON.stringify(saved.sections))
        : JSON.parse(JSON.stringify(template.defaultSections));
      raw.forEach(s => s.items.forEach(item => {
        if (item.instructions === undefined) item.instructions = '';
      }));
      setSections(raw);
      setExpandedSections(Object.fromEntries(raw.map((_, i) => [i, true])));
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (published) => {
    setSaving(true);
    const checklists = company?.settings?.checklists || {};
    const updatedChecklists = {
      ...checklists,
      [templateKey]: { sections, published, updatedAt: new Date().toISOString() }
    };
    const updatedSettings = { ...(company.settings || {}), checklists: updatedChecklists };
    await base44.entities.Company.update(company.id, { settings: updatedSettings });
    setCompany(prev => ({ ...prev, settings: updatedSettings }));
    setSaving(false);
    setSavedMsg(published ? 'Published!' : 'Draft saved!');
    setTimeout(() => setSavedMsg(''), 2500);
    if (published) navigate(createPageUrl('Settings') + '?tab=templates');
  };

  const updateSectionTitle = (sIdx, title) =>
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));

  const removeSection = (sIdx) =>
    setSections(prev => prev.filter((_, i) => i !== sIdx));

  const addSection = () => {
    setSections(prev => [...prev, { title: 'New Section', items: [{ label: 'New item', responseType: 'ok_issue_na', instructions: '' }] }]);
    setSections(prev => {
      setExpandedSections(es => ({ ...es, [prev.length - 1]: true }));
      return prev;
    });
  };

  const updateItem = (sIdx, iIdx, field, value) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: s.items.map((item, ii) => ii !== iIdx ? item : { ...item, [field]: value })
    }));

  const removeItem = (sIdx, iIdx) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: s.items.filter((_, ii) => ii !== iIdx)
    }));

  const addItem = (sIdx) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: [...s.items, { label: 'New item', responseType: 'ok_issue_na', instructions: '' }]
    }));

  const toggleSection = (sIdx) =>
    setExpandedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Settings') + '?tab=templates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={`${template.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{template.title} Checklist</h1>
            <p className="text-sm text-slate-500">{template.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-sm font-semibold text-green-600">{savedMsg}</span>}
          <Button
            variant="outline"
            onClick={() => saveTemplate(false)}
            disabled={saving}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Save Draft
          </Button>
          <Button
            onClick={() => saveTemplate(true)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Globe className="w-4 h-4 mr-1.5" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Template selector tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TEMPLATES.map(t => (
          <button
            key={t.key}
            onClick={() => navigate(createPageUrl('ChecklistEditor') + `?type=${t.key}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              t.key === templateKey
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, sIdx) => (
          <Card key={sIdx} className="overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <button
                onClick={() => toggleSection(sIdx)}
                className="text-slate-400 hover:text-slate-700 shrink-0"
              >
                {expandedSections[sIdx]
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />}
              </button>
              <Input
                value={section.title}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                className="flex-1 bg-transparent border-0 shadow-none font-semibold text-slate-700 h-8 px-1 focus:bg-white focus:border focus:shadow-sm rounded text-base"
              />
              <span className="text-xs text-slate-400 shrink-0">{section.items.length} items</span>
              <Button
                size="sm" variant="ghost"
                onClick={() => removeSection(sIdx)}
                className="text-red-400 hover:text-red-600 h-8 w-8 p-0 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Items */}
            {expandedSections[sIdx] && (
              <CardContent className="p-4 space-y-2 bg-white">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-start gap-3 border border-slate-100 rounded-lg p-3 bg-slate-50/60 hover:bg-slate-50">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(sIdx, iIdx, 'label', e.target.value)}
                        placeholder="Item label"
                        className="text-sm h-9 font-medium"
                      />
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(RESPONSE_TYPE_LABELS).map(([v, l]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => updateItem(sIdx, iIdx, 'responseType', v)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                              item.responseType === v
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              item.responseType === v ? 'border-white bg-white' : 'border-slate-400'
                            }`}>
                              {item.responseType === v && <span className="w-2 h-2 rounded-full bg-blue-600 block" />}
                            </span>
                            {l}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={item.instructions || ''}
                        onChange={(e) => updateItem(sIdx, iIdx, 'instructions', e.target.value)}
                        placeholder="Instructions / notes for field user (optional)"
                        className="text-xs h-8 text-slate-500"
                      />
                    </div>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => removeItem(sIdx, iIdx)}
                      className="text-red-400 hover:text-red-600 h-8 w-8 p-0 shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  size="sm" variant="outline"
                  onClick={() => addItem(sIdx)}
                  className="w-full h-9 text-sm border-dashed border-slate-300 text-slate-500"
                >
                  <Plus className="w-4 h-4 mr-1" />Add Item
                </Button>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addSection}
          className="w-full border-dashed border-slate-300 text-slate-600 h-11"
        >
          <Plus className="w-4 h-4 mr-2" />Add Section
        </Button>
      </div>
    </div>
  );
}