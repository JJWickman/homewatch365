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
    base44.entities.ChecklistTemplateV2.list('-created_date', 100)
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500 text-sm">Loading templates...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Checklist Templates</h1>
      <div className="space-y-3">
        {templates.map(t => (
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
        ))}
        {templates.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No templates found.</p>
        )}
      </div>
    </div>
  );
}