import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Building, Building2, ChevronRight, ClipboardList } from 'lucide-react';

const FORMS = [
  {
    title: 'Single Family Home',
    subtitle: 'Home Watch Visit Checklist',
    description: 'Standard checklist for single family home visits including exterior, interior, water zone, AC, and departure.',
    icon: Home,
    color: 'bg-blue-500',
    page: 'SingleFamilyHomeChecklistPage',
  },
  {
    title: 'Condo / Villa',
    subtitle: 'Home Watch Visit Checklist',
    description: 'Checklist for condo and villa visits including pool, interior, water zone, AC, storm protection, and departure.',
    icon: Building,
    color: 'bg-purple-500',
    page: 'CondoVillaChecklistPage',
  },
  {
    title: 'High Rise',
    subtitle: 'Home Watch Visit Checklist',
    description: 'Checklist for high-rise property visits including balcony, interior, water zone, AC, storm protection, and departure.',
    icon: Building2,
    color: 'bg-emerald-500',
    page: 'HighRiseChecklistPage',
  },
];

export default function ChecklistFormsPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Visit Checklists</h1>
        </div>
        <p className="text-slate-500 ml-13">Select the property type to begin a home watch visit checklist.</p>
      </div>

      <div className="space-y-4">
        {FORMS.map((form) => (
          <Link key={form.page} to={createPageUrl(form.page)} className="block">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-98 cursor-pointer">
              <div className={`${form.color} w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                <form.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 text-lg">{form.title}</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{form.subtitle}</p>
                <p className="text-slate-500 text-sm mt-1 leading-snug">{form.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}