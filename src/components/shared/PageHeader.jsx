import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PageHeader({ 
  title, 
  subtitle, 
  action, 
  actionLabel, 
  actionIcon: ActionIcon = Plus,
  backLink,
  backLabel = 'Back',
  actionClassName = 'bg-slate-900 hover:bg-slate-800',
  children 
}) {
  return (
    <div className="mb-6">
      {backLink && (
        <Link 
          to={createPageUrl(backLink)} 
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button onClick={action} className={actionClassName}>
              <ActionIcon className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}