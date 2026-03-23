import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Home, Building, Building2, Edit2, CheckCircle2, AlertCircle, Loader2,
  Car, AlertTriangle, Users, Package, Wind, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';
import { ARRIVAL_DEPARTURE_SECTIONS, ACCESS_VISIT_SECTIONS, EMERGENCY_VISIT_SECTIONS, DAMAGE_RECOVERY_SECTIONS, AUTO_CARE_SECTIONS, POST_STORM_SECTIONS, CLIENT_SERVICE_SECTIONS, CONCIERGE_SERVICE_SECTIONS } from '@/components/checklist/serviceVisitDefaults';

const TEMPLATES = [
  // Property-based templates
  { key: 'sfh', title: 'Single Family Home', subtitle: 'Home Watch Visit Checklist', icon: Home, color: 'bg-blue-500', defaultSections: SFH_SECTIONS, category: 'property' },
  { key: 'condo', title: 'Condo / Villa', subtitle: 'Home Watch Visit Checklist', icon: Building, color: 'bg-purple-500', defaultSections: CONDO_SECTIONS, category: 'property' },
  { key: 'highrise', title: 'High Rise', subtitle: 'Home Watch Visit Checklist', icon: Building2, color: 'bg-emerald-500', defaultSections: HIGHRISE_SECTIONS, category: 'property' },
  // Service visit templates
  { key: 'arrival_departure', title: 'Arrival/Departure Visit', subtitle: 'Service Visit Template', icon: Home, color: 'bg-indigo-500', defaultSections: ARRIVAL_DEPARTURE_SECTIONS, category: 'service' },
  { key: 'access_visit', title: 'Access Visit – Vendor Key-In', subtitle: 'Service Visit Template', icon: Wrench, color: 'bg-orange-500', defaultSections: ACCESS_VISIT_SECTIONS, category: 'service' },
  { key: 'emergency_visit', title: 'Unscheduled/Emergency Visit', subtitle: 'Service Visit Template', icon: AlertTriangle, color: 'bg-red-500', defaultSections: EMERGENCY_VISIT_SECTIONS, category: 'service' },
  { key: 'damage_recovery', title: 'Damage and Recovery Log', subtitle: 'Service Visit Template', icon: AlertTriangle, color: 'bg-yellow-600', defaultSections: DAMAGE_RECOVERY_SECTIONS, category: 'service' },
  { key: 'auto_care', title: 'Auto Care – Car Drive', subtitle: 'Service Visit Template', icon: Car, color: 'bg-cyan-500', defaultSections: AUTO_CARE_SECTIONS, category: 'service' },
  { key: 'post_storm', title: 'Post-Storm Visit', subtitle: 'Service Visit Template', icon: Wind, color: 'bg-slate-600', defaultSections: POST_STORM_SECTIONS, category: 'service' },
  { key: 'client_service', title: 'Client Requested Service', subtitle: 'Service Visit Template', icon: Users, color: 'bg-pink-500', defaultSections: CLIENT_SERVICE_SECTIONS, category: 'service' },
  { key: 'concierge_service', title: 'Concierge Service', subtitle: 'Service Visit Template', icon: Package, color: 'bg-teal-500', defaultSections: CONCIERGE_SERVICE_SECTIONS, category: 'service' },
];

const RESPONSE_TYPE_LABELS = {
  ok_issue_na: 'No Visible Issues / Issue Observed / Not Observed',
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
      {/* Home Watch Academy Banner */}
      <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-sm text-center">
        <img
          src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/b9e08eb9c_image.png"
          alt="Home Watch Academy"
          className="h-16 w-auto object-contain mb-3"
        />
        <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">
          Registered by Home Watch Academy
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-slate-500">
          Manage checklist templates for home watch visits and service visits. Edit items, add notes, then publish to make templates live for field users.
        </p>
      </div>

      {/* Property Templates Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Home Watch Visit Templates</h3>
        <div className="space-y-3">

      {TEMPLATES.filter(t => t.category === 'property').map(t => {
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
      </div>

      {/* Service Visit Templates Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Service Visit Templates</h3>
        <div className="space-y-3">
      {TEMPLATES.filter(t => t.category === 'service').map(t => {
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
      </div>
    </div>
  );
}