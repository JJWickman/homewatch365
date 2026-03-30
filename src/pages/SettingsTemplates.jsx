import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SettingsTemplates() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-slate-900">Checklist Templates</h1>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-slate-500 text-sm">Manage your checklist templates here. Go to Settings → Templates tab to configure templates.</p>
        <Button className="mt-4" onClick={() => navigate('/Settings?tab=templates')}>
          Go to Templates Settings
        </Button>
      </div>
    </div>
  );
}