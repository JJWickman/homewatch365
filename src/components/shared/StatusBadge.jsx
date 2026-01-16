import React from 'react';
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  // Inspection statuses
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  missed: 'bg-red-50 text-red-700 border-red-200',
  
  // Property statuses
  occupied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  vacant: 'bg-slate-50 text-slate-600 border-slate-200',
  seasonal: 'bg-blue-50 text-blue-700 border-blue-200',
  for_sale: 'bg-purple-50 text-purple-700 border-purple-200',
  
  // Task priorities
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
  
  // Task statuses
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  
  // Overall inspection status
  all_clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  issues_found: 'bg-amber-50 text-amber-700 border-amber-200',
  
  // Billing statuses
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  past_due: 'bg-red-50 text-red-700 border-red-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  trial: 'bg-purple-50 text-purple-700 border-purple-200',
  
  // Invoice statuses
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  
  // Inspection types
  routine: 'bg-slate-50 text-slate-600 border-slate-200',
  arrival: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  departure: 'bg-blue-50 text-blue-700 border-blue-200',
  pre_storm: 'bg-amber-50 text-amber-700 border-amber-200',
  post_storm: 'bg-purple-50 text-purple-700 border-purple-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  stop_by: 'bg-teal-50 text-teal-700 border-teal-200',
  custom: 'bg-slate-50 text-slate-600 border-slate-200',
};

const statusLabels = {
  in_progress: 'In Progress',
  all_clear: 'All Clear',
  issues_found: 'Issues Found',
  for_sale: 'For Sale',
  past_due: 'Past Due',
  bi_weekly: 'Bi-Weekly',
  pre_storm: 'Pre-Storm',
  post_storm: 'Post-Storm',
  stop_by: 'Stop By',
  };

export default function StatusBadge({ status, className = '' }) {
  const style = statusStyles[status] || statusStyles.pending;
  const label = statusLabels[status] || status?.replace(/_/g, ' ');
  
  return (
    <Badge 
      variant="outline" 
      className={`capitalize font-medium ${style} ${className}`}
    >
      {label}
    </Badge>
  );
}