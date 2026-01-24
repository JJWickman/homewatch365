import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DailySchedule({ visits, onRefresh }) {
  const sortedVisits = [...visits].sort((a, b) => {
    const timeA = a.scheduled_time || '00:00';
    const timeB = b.scheduled_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-amber-100 text-amber-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-amber-600 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
          <Badge variant="outline" className="ml-2">
            {format(new Date(), 'EEEE, MMM d')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No visits scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedVisits.map((visit) => (
              <div 
                key={visit.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(visit.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {visit.property_name || `Property ${visit.property_id?.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {visit.client_name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(visit.status)}>
                      {visit.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    {visit.scheduled_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {visit.scheduled_time}
                      </span>
                    )}
                    {visit.assigned_to_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {visit.assigned_to_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 capitalize">
                      <MapPin className="h-3 w-3" />
                      {visit.visit_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}