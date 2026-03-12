import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Home, Building, Building2, Edit2, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [checklists, setChecklists] = useState({});
  const [loading, setLoading] = useState(true);

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
                  onClick={() => navigate(createPageUrl('ChecklistEditor') + `?type=${t.key}`)}
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

    </div>
  );
}