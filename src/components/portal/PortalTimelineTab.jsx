import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Camera, FileText, MapPin, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function VisitReportCard({ visit, property }) {
  const [expanded, setExpanded] = useState(false);
  const isAllClear = visit.overall_status === 'all_clear';
  const issueItems = visit.checklist_data?.flatMap(s =>
    (s.items || []).filter(i => i.flagged)
  ) || [];
  const allPhotos = visit.checklist_data?.flatMap(s =>
    (s.items || []).flatMap(i => i.photo_urls || [])
  ) || [];

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-4 h-5 w-5 rounded-full border-2 border-white shadow flex items-center justify-center ${
        isAllClear ? 'bg-emerald-500' : 'bg-amber-500'
      }`}>
        {isAllClear
          ? <CheckCircle2 className="h-3 w-3 text-white" />
          : <AlertTriangle className="h-3 w-3 text-white" />
        }
      </div>

      <Card className="bg-white mb-1">
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">
                  {format(new Date(visit.scheduled_date), 'MMMM d, yyyy')}
                </span>
                <Badge className={`text-xs ${
                  isAllClear
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {isAllClear ? '✓ All Clear' : `⚠ ${issueItems.length} Issue${issueItems.length !== 1 ? 's' : ''} Found`}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                {property && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.name || property.address}
                  </span>
                )}
                {visit.assigned_to_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {visit.assigned_to_name}
                  </span>
                )}
                {allPhotos.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 shrink-0 font-medium"
            >
              {expanded ? (
                <><ChevronUp className="h-4 w-4" /> Hide</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> View Report</>
              )}
            </button>
          </div>

          {/* Summary notes */}
          {visit.summary_notes && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
              <span className="font-medium text-slate-700 mr-1">Inspector Notes:</span>
              {visit.summary_notes}
            </div>
          )}

          {/* Expanded report */}
          {expanded && (
            <div className="mt-4 border-t pt-4 space-y-5">
              {/* Issues summary */}
              {issueItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Issues Found
                  </h4>
                  <div className="space-y-2">
                    {issueItems.map((item, i) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="font-medium text-amber-900 text-sm">{item.name}</p>
                        {item.notes && <p className="text-sm text-amber-800 mt-1">{item.notes}</p>}
                        {item.photo_urls?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {item.photo_urls.map((url, pi) => (
                              <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                                className="h-20 w-20 rounded-lg overflow-hidden bg-slate-100 border shrink-0">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist sections */}
              {visit.checklist_data?.map((section, si) => (
                <div key={si}>
                  <h4 className="font-semibold text-slate-800 mb-2 text-sm border-b pb-1">{section.section_name}</h4>
                  <div className="space-y-1.5">
                    {section.items?.map((item, ii) => (
                      <div key={ii} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm ${
                        item.flagged ? 'bg-amber-50 border border-amber-100' :
                        item.status === 'pass' ? 'bg-emerald-50/60' : 'bg-slate-50'
                      }`}>
                        {item.flagged ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <span className={`font-medium ${item.flagged ? 'text-amber-900' : 'text-slate-800'}`}>
                            {item.name}
                          </span>
                          {item.notes && item.notes !== 'No visible damage' && item.notes !== 'All locked and secure' && (
                            <p className="text-slate-500 mt-0.5">{item.notes}</p>
                          )}
                          {item.photo_urls?.length > 0 && !item.flagged && (
                            <div className="flex gap-1.5 mt-1.5">
                              {item.photo_urls.map((url, pi) => (
                                <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                                  className="h-14 w-14 rounded overflow-hidden bg-slate-100 shrink-0">
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Photo gallery */}
              {allPhotos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-1">
                    <Camera className="h-4 w-4" /> All Photos ({allPhotos.length})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allPhotos.map((url, pi) => (
                      <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortalTimelineTab({ visits, properties }) {
  const completed = [...visits]
    .filter(v => v.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

  if (completed.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="py-12 text-center text-slate-400">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No visit reports yet</p>
          <p className="text-xs mt-1">Reports will appear here after visits are completed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        {completed.length} completed visit{completed.length !== 1 ? 's' : ''} — click "View Report" to see the full checklist and photos
      </p>
      {/* Timeline line */}
      <div className="relative">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {completed.map(visit => (
            <VisitReportCard
              key={visit.id}
              visit={visit}
              property={properties.find(p => p.id === visit.property_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}