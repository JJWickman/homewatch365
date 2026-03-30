import React from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, AlertTriangle, Clock, Calendar, 
  ChevronRight, ClipboardCheck
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '@/components/shared/StatusBadge';

export default function PortalVisitsTab({ visits, properties, onSelectVisit }) {
  const upcoming = visits.filter(v => ['scheduled', 'open', 'in_progress'].includes(v.status));
  const completed = visits.filter(v => v.status === 'completed');

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);

  const VisitCard = ({ visit, clickable }) => {
    const property = getProperty(visit.property_id);
    const isAllClear = visit.overall_status === 'all_clear';
    const hasIssues = visit.overall_status === 'issues_found';
    const isCompleted = visit.status === 'completed';

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all ${
          clickable ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
        }`}
        onClick={clickable ? () => onSelectVisit(visit) : undefined}
      >
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
          isAllClear ? 'bg-emerald-100' :
          hasIssues ? 'bg-amber-100' :
          'bg-blue-100'
        }`}>
          {isAllClear ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : hasIssues ? (
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          ) : (
            <Clock className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">
            {property?.name || property?.address || 'Property'}
          </p>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(visit.scheduled_date), 'MMM d, yyyy')}
            </span>
            <span className="capitalize">{visit.checkin_type || visit.visit_type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && visit.overall_status && (
            <Badge className={`text-xs ${
              isAllClear ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
              'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {isAllClear ? 'All Clear' : 'Issues Found'}
            </Badge>
          )}
          {!isCompleted && <StatusBadge status={visit.status} />}
          {clickable && <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Upcoming */}
      <section>
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Upcoming Visits ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-8 text-center text-slate-400">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming visits scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map(v => <VisitCard key={v.id} visit={v} clickable={false} />)}
          </div>
        )}
      </section>

      {/* Completed */}
      <section>
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Completed Visits ({completed.length})
        </h3>
        {completed.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="py-8 text-center text-slate-400">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No completed visits yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completed.map(v => <VisitCard key={v.id} visit={v} clickable={true} />)}
          </div>
        )}
      </section>
    </div>
  );
}