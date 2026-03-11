import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Home, Building, Building2, Edit2, Save, Globe, Plus, Trash2,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';

const TEMPLATES = [
  { key: 'sfh', title: 'Single Family Home', subtitle: 'Home Watch Visit Checklist', icon: Home, color: 'bg-blue-500', defaultSections: SFH_SECTIONS },
  { key: 'condo', title: 'Condo / Villa', subtitle: 'Home Watch Visit Checklist', icon: Building, color: 'bg-purple-500', defaultSections: CONDO_SECTIONS },
  { key: 'highrise', title: 'High Rise', subtitle: 'Home Watch Visit Checklist', icon: Building2, color: 'bg-emerald-500', defaultSections: HIGHRISE_SECTIONS },
];

const RESPONSE_TYPE_LABELS = {
  ok_issue_na: 'OK / Issue / N/A',
  number: 'Number (e.g. temperature)',
  percentage: 'Percentage (e.g. humidity)',
  photo_only: 'Photo Only',
  instruction_only: 'Advisory / Instruction',
};

export default function ChecklistTemplatesManager({ companyId, isAdmin }) {
  const [company, setCompany] = useState(null);
  const [checklists, setChecklists] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'sfh' | 'condo' | 'highrise'
  const [editingSections, setEditingSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (companyId) loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    const companies = await base44.entities.Company.filter({ id: companyId });
    const c = companies[0];
    setCompany(c);
    setChecklists(c?.settings?.checklists || {});
    setLoading(false);
  };

  const openEditor = (templateKey, defaultSections) => {
    const saved = checklists[templateKey];
    const raw = (saved?.sections?.length > 0)
      ? JSON.parse(JSON.stringify(saved.sections))
      : JSON.parse(JSON.stringify(defaultSections));
    // Normalize: ensure all items have instructions field
    raw.forEach(s => s.items.forEach(item => {
      if (item.instructions === undefined) item.instructions = '';
    }));
    setEditing(templateKey);
    setEditingSections(raw);
    setExpandedSections(Object.fromEntries(raw.map((_, i) => [i, true])));
  };

  const saveTemplate = async (published) => {
    setSaving(true);
    const updatedChecklists = {
      ...checklists,
      [editing]: {
        sections: editingSections,
        published,
        updatedAt: new Date().toISOString(),
      }
    };
    const updatedSettings = { ...(company.settings || {}), checklists: updatedChecklists };
    await base44.entities.Company.update(company.id, { settings: updatedSettings });
    setChecklists(updatedChecklists);
    setCompany(prev => ({ ...prev, settings: updatedSettings }));
    setSaving(false);
    setSavedMsg(published ? 'Published!' : 'Draft saved!');
    setTimeout(() => setSavedMsg(''), 2500);
    if (published) setEditing(null);
  };

  // --- Editor mutation helpers ---
  const updateSectionTitle = (sIdx, title) =>
    setEditingSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));

  const removeSection = (sIdx) =>
    setEditingSections(prev => prev.filter((_, i) => i !== sIdx));

  const addSection = () =>
    setEditingSections(prev => [...prev, { title: 'New Section', items: [{ label: 'New item', responseType: 'ok_issue_na', instructions: '' }] }]);

  const updateItem = (sIdx, iIdx, field, value) =>
    setEditingSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s,
      items: s.items.map((item, ii) => ii !== iIdx ? item : { ...item, [field]: value })
    }));

  const removeItem = (sIdx, iIdx) =>
    setEditingSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: s.items.filter((_, ii) => ii !== iIdx)
    }));

  const addItem = (sIdx) =>
    setEditingSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: [...s.items, { label: 'New item', responseType: 'ok_issue_na', instructions: '' }]
    }));

  const toggleSection = (sIdx) =>
    setExpandedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }));

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">Only administrators can manage checklist templates.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentTemplate = TEMPLATES.find(t => t.key === editing);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <p className="text-sm text-slate-500">
          Manage the 3 standard home watch checklist templates. Edit items, add notes, then publish to make the template live for field users.
        </p>
      </div>

      {/* Template Cards */}
      {TEMPLATES.map(t => {
        const saved = checklists[t.key];
        const isPublished = saved?.published === true;
        const isDraft = saved && !saved.published;
        const sectionCount = (saved?.sections || t.defaultSections).length;
        const itemCount = (saved?.sections || t.defaultSections)
          .reduce((acc, s) => acc + (s.items?.length || 0), 0);

        return (
          <Card key={t.key} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`${t.color} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <t.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{t.title}</h3>
                    {isPublished && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Published
                      </Badge>
                    )}
                    {isDraft && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />Draft
                      </Badge>
                    )}
                    {!saved && (
                      <Badge variant="outline" className="text-slate-400 text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{t.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sectionCount} sections · {itemCount} items
                    {saved?.updatedAt && ` · Updated ${new Date(saved.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  onClick={() => openEditor(t.key, t.defaultSections)}
                  variant="outline"
                  className="shrink-0"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" />Edit Template
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2">
              {currentTemplate && <currentTemplate.icon className="w-5 h-5" />}
              {currentTemplate?.title} — Edit Template
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Edit sections and items. Use "Save Draft" to keep changes, or "Publish" to make them live for field users.
            </p>
          </DialogHeader>

          <div className="px-6 py-4 space-y-3">
            {editingSections.map((section, sIdx) => (
              <div key={sIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
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
                    className="flex-1 bg-transparent border-0 shadow-none font-semibold text-slate-700 h-8 px-1 focus:bg-white focus:border focus:shadow-sm rounded"
                  />
                  <span className="text-xs text-slate-400 shrink-0">{section.items.length} items</span>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => removeSection(sIdx)}
                    className="text-red-400 hover:text-red-600 h-7 w-7 p-0 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Items */}
                {expandedSections[sIdx] && (
                  <div className="p-3 space-y-2 bg-white">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-start gap-2 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.label}
                            onChange={(e) => updateItem(sIdx, iIdx, 'label', e.target.value)}
                            placeholder="Item label"
                            className="text-sm h-9"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={item.responseType}
                              onValueChange={(v) => updateItem(sIdx, iIdx, 'responseType', v)}
                            >
                              <SelectTrigger className="h-8 text-xs w-auto min-w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(RESPONSE_TYPE_LABELS).map(([v, l]) => (
                                  <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      size="sm" variant="outline"
                      onClick={() => addItem(sIdx)}
                      className="w-full h-8 text-xs border-dashed border-slate-300 text-slate-500"
                    >
                      <Plus className="w-3 h-3 mr-1" />Add Item
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addSection}
              className="w-full border-dashed border-slate-300 text-slate-500"
            >
              <Plus className="w-4 h-4 mr-2" />Add Section
            </Button>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
            {savedMsg && (
              <span className="text-sm font-semibold text-green-600 mr-auto">{savedMsg}</span>
            )}
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}