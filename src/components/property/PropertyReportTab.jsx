import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ClipboardCheck, AlertTriangle, Wrench, CheckCircle2,
  Clock, XCircle, Calendar, User, ChevronDown, ChevronRight,
  FileText, Camera, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/shared/StatusBadge';

const getVisitIcon = (visit) => {
  if (visit.visit_type === 'followup') {
    const priority = visit.priority;
    if (priority === 'urgent' || priority === 'high') return AlertTriangle;
    return Wrench;
  }
  return ClipboardCheck;
};

const getVisitColor = (visit) => {
  if (visit.visit_type === 'followup') {
    if (visit.priority === 'urgent') return 'bg-red-100 border-red-300 text-red-700';
    if (visit.priority === 'high') return 'bg-orange-100 border-orange-300 text-orange-700';
    return 'bg-amber-100 border-amber-300 text-amber-700';
  }
  if (visit.status === 'completed') return 'bg-emerald-100 border-emerald-300 text-emerald-700';
  if (visit.status === 'cancelled') return 'bg-slate-100 border-slate-300 text-slate-500';
  return 'bg-blue-100 border-blue-300 text-blue-700';
};

const getDotColor = (visit) => {
  if (visit.visit_type === 'followup') {
    if (visit.priority === 'urgent') return 'bg-red-500';
    if (visit.priority === 'high') return 'bg-orange-500';
    return 'bg-amber-500';
  }
  if (visit.status === 'completed') return 'bg-emerald-500';
  if (visit.status === 'cancelled') return 'bg-slate-400';
  return 'bg-blue-500';
};

const getStatusIcon = (visit) => {
  if (visit.status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (visit.status === 'cancelled') return <XCircle className="h-3.5 w-3.5" />;
  if (visit.status === 'in_progress') return <Clock className="h-3.5 w-3.5" />;
  return <Calendar className="h-3.5 w-3.5" />;
};

const issuesFromChecklist = (visit) => {
  if (!visit.checklist_data) return [];
  return visit.checklist_data.filter(item => item.response === 'issue' || item.issue_flag);
};

function TimelineItem({ visit }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getVisitIcon(visit);
  const dotColor = getDotColor(visit);
  const cardColor = getVisitColor(visit);
  const issues = issuesFromChecklist(visit);
  const hasIssues = issues.length > 0 || visit.overall_status === 'issues_found' || visit.overall_status === 'urgent';

  const dateStr = visit.scheduled_date
    ? format(parseISO(visit.scheduled_date), 'MMM d, yyyy')
    : visit.completed_at
    ? format(parseISO(visit.completed_at), 'MMM d, yyyy')
    : 'Unknown date';

  return (
    <div className="flex gap-4">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${dotColor} shrink-0 mt-1`} />
        <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
      </div>

      {/* Card */}
      <div className={`flex-1 mb-6 rounded-xl border shadow-sm ${cardColor.split(' ').slice(0, 2).join(' ')} border-slate-200 bg-white overflow-hidden`}>
        <button
          className="w-full text-left px-4 py-4 hover:bg-slate-50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${cardColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 text-sm">
                    {visit.visit_type === 'followup'
                      ? (visit.title || 'Follow-Up')
                      : visit.visit_type === 'pre_storm'
                      ? 'Pre-Storm Visit'
                      : visit.visit_type === 'post_storm'
                      ? 'Post-Storm Visit'
                      : `Check-In · ${visit.checkin_type ? visit.checkin_type.replace(/_/g, ' ') : 'Routine'}`}
                  </p>
                  {hasIssues && (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      <AlertCircle className="h-3 w-3" /> Issues Found
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{dateStr}
                  </span>
                  {visit.assigned_to_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />{visit.assigned_to_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={visit.status} />
              {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-slate-100 space-y-3 pt-3">
            {/* Description / notes */}
            {(visit.description || visit.summary_notes) && (
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <p className="font-medium text-slate-700 mb-1 text-xs uppercase tracking-wide">Notes</p>
                <p>{visit.description || visit.summary_notes}</p>
              </div>
            )}

            {/* Issues list */}
            {issues.length > 0 && (
              <div>
                <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-2">Issues Flagged</p>
                <div className="space-y-1.5">
                  {issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-800 font-medium">{issue.label || issue.name || 'Issue'}</p>
                        {issue.note && <p className="text-slate-600 text-xs mt-0.5">{issue.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {visit.photo_urls && visit.photo_urls.length > 0 && (
              <div>
                <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" /> Photos ({visit.photo_urls.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {visit.photo_urls.slice(0, 6).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                  {visit.photo_urls.length > 6 && (
                    <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                      +{visit.photo_urls.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follow-up specifics */}
            {visit.visit_type === 'followup' && (
              <div className="flex flex-wrap gap-2 text-xs">
                {visit.followup_type && (
                  <Badge variant="outline" className="capitalize">{visit.followup_type.replace(/_/g, ' ')}</Badge>
                )}
                {visit.priority && (
                  <Badge variant="outline" className={`capitalize ${
                    visit.priority === 'urgent' ? 'border-red-300 text-red-700' :
                    visit.priority === 'high' ? 'border-orange-300 text-orange-700' : ''
                  }`}>{visit.priority} priority</Badge>
                )}
              </div>
            )}

            {/* View detail link */}
            {visit.visit_type !== 'followup' && (
              <Link
                to={createPageUrl('VisitDetail') + `?id=${visit.id}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <FileText className="h-3.5 w-3.5" /> View full visit report →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyReportTab({ visits }) {
  const [filter, setFilter] = useState('all');

  const sorted = [...visits].sort((a, b) => {
    const aDate = a.scheduled_date || a.completed_at || '';
    const bDate = b.scheduled_date || b.completed_at || '';
    return bDate.localeCompare(aDate);
  });

  const filtered = sorted.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'checkin') return v.visit_type === 'check-in' || v.visit_type === 'inspection';
    if (filter === 'followup') return v.visit_type === 'followup';
    if (filter === 'issues') return v.overall_status === 'issues_found' || v.overall_status === 'urgent' || (v.checklist_data && v.checklist_data.some(i => i.response === 'issue' || i.issue_flag));
    return true;
  });

  const issueCount = sorted.filter(v =>
    v.overall_status === 'issues_found' || v.overall_status === 'urgent' ||
    (v.checklist_data && v.checklist_data.some(i => i.response === 'issue' || i.issue_flag))
  ).length;

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{sorted.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Events</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{sorted.filter(v => v.status === 'completed').length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{issueCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">With Issues</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All Activity' },
          { key: 'checkin', label: 'Check-Ins' },
          { key: 'followup', label: 'Follow-Ups' },
          { key: 'issues', label: '⚠️ Issues Only' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity to display</p>
          <p className="text-sm mt-1">Visit history will appear here as visits are scheduled and completed.</p>
        </div>
      ) : (
        <div className="relative">
          {filtered.map((visit, idx) => (
            <TimelineItem key={visit.id} visit={visit} />
          ))}
          {/* End cap */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-slate-200 border-2 border-white" />
            </div>
            <p className="text-xs text-slate-400 pb-2 mt-0.5">End of history</p>
          </div>
        </div>
      )}
    </div>
  );
}