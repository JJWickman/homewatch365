import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Edit } from 'lucide-react';

const CATEGORY_LABELS = {
  home_watch_visit: 'Home Watch',
  arrival_departure: 'Arrival/Departure',
  access_visit: 'Access Visit',
  emergency_visit: 'Emergency Visit',
  damage_recovery: 'Damage Recovery',
  auto_care: 'Auto Care',
  post_storm: 'Post-Storm',
  client_service: 'Client Service',
  concierge: 'Concierge',
};

export default function SettingsTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ChecklistTemplate.filter({ tenant_id: null }, '-created_date', 100)
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500 text-sm">Loading templates...</div>;
  }

  const coreTemplateCodes = ['single_family_standard', 'condo_villa_standard', 'high_rise_standard'];
  const coreTemplates = templates.filter(t => coreTemplateCodes.includes(t.template_slug));
  const additionalTemplates = templates.filter(t => !coreTemplateCodes.includes(t.template_slug));

  const TemplateCard = ({ t }) => (
    <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500 truncate">{t.template_slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[t.category] || t.category}</Badge>
        {t.active ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-slate-400">Inactive</Badge>
        )}
        <Button size="sm" variant="ghost" onClick={() => navigate(`/ChecklistEditor?template_id=${t.id}`)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Checklist Templates</h1>
      
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
        <img src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/2763cff61_image.png" alt="Home Watch Academy" className="h-20 w-auto object-contain shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Templates created in partnership with <span className="font-bold">Home Watch Academy</span></p>
          <p className="text-xs text-blue-700 mt-1">These checklist templates are registered intellectual property of Home Watch Academy.</p>
        </div>
      </div>

      {/* Core Templates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Core Templates</h2>
        <div className="space-y-3">
          {coreTemplates.map(t => <TemplateCard key={t.id} t={t} />)}
          {coreTemplates.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No core templates found.</p>
          )}
        </div>
      </div>

      {/* Additional Services */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Services</h2>
        <div className="space-y-3">
          {additionalTemplates.map(t => <TemplateCard key={t.id} t={t} />)}
          {additionalTemplates.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No additional templates found.</p>
          )}
        </div>
      </div>
    </div>
  );
}