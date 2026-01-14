import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, ArrowLeft, Calendar, User, MapPin,
  CheckCircle2, AlertTriangle, Camera, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from '@/components/shared/StatusBadge';

export default function ClientInspectionView() {
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [property, setProperty] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspection();
  }, []);

  const loadInspection = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('ClientPortal'));
      return;
    }

    try {
      const user = await base44.auth.me();
      const clients = await base44.entities.Client.filter({ portal_user_email: user.email });
      
      if (clients.length === 0) {
        navigate(createPageUrl('ClientPortal'));
        return;
      }

      const inspectionData = await base44.entities.Inspection.filter({ id, client_id: clients[0].id });
      
      if (inspectionData.length === 0) {
        navigate(createPageUrl('ClientPortal'));
        return;
      }

      setInspection(inspectionData[0]);

      const [propertyData, companyData] = await Promise.all([
        base44.entities.Property.filter({ id: inspectionData[0].property_id }),
        base44.entities.Company.filter({ id: inspectionData[0].company_id })
      ]);

      if (propertyData.length > 0) setProperty(propertyData[0]);
      if (companyData.length > 0) setCompany(companyData[0]);

    } catch (error) {
      console.error('Error loading inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!inspection) {
    return null;
  }

  const totalItems = inspection.checklist_data?.reduce((sum, section) => sum + (section.items?.length || 0), 0) || 0;
  const flaggedItems = inspection.checklist_data?.reduce((sum, section) => 
    sum + (section.items?.filter(item => item.flagged)?.length || 0), 0) || 0;
  const allPhotos = inspection.checklist_data?.flatMap(section => 
    section.items?.flatMap(item => item.photo_urls || []) || []
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl('ClientPortal'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-semibold">{company?.name || 'Property Portal'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <Card className={`mb-6 ${
          inspection.overall_status === 'all_clear' 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <CardContent className="flex items-center gap-4 py-4">
            {inspection.overall_status === 'all_clear' ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            )}
            <div>
              <p className={`text-lg font-semibold ${
                inspection.overall_status === 'all_clear' ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {inspection.overall_status === 'all_clear' 
                  ? 'All Clear - No Issues Found' 
                  : 'Issues Found - Review Required'}
              </p>
              <p className="text-sm opacity-80">
                Inspection completed on {format(new Date(inspection.completed_at || inspection.scheduled_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {property?.primary_photo_url ? (
                  <img src={property.primary_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{property?.name || property?.address}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {property?.city}, {property?.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(inspection.scheduled_date), 'MMM d, yyyy')}
                  </span>
                  <span className="capitalize">{inspection.type} Inspection</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-slate-500">Items Checked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${flaggedItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {flaggedItems}
              </p>
              <p className="text-sm text-slate-500">Issues Found</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{allPhotos.length}</p>
              <p className="text-sm text-slate-500">Photos</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {inspection.summary_notes && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Inspector Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{inspection.summary_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="checklist">
          <TabsList className="mb-4">
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="photos">Photos ({allPhotos.length})</TabsTrigger>
            {flaggedItems > 0 && (
              <TabsTrigger value="issues">Issues ({flaggedItems})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="checklist">
            <Card>
              <CardContent className="pt-6">
                {inspection.checklist_data?.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6 last:mb-0">
                    <h3 className="font-semibold text-slate-900 mb-3">{section.section_name}</h3>
                    <div className="space-y-2">
                      {section.items?.map((item, itemIndex) => (
                        <div 
                          key={itemIndex}
                          className={`p-3 rounded-lg border ${
                            item.flagged 
                              ? 'bg-amber-50 border-amber-200' 
                              : item.status === 'pass' || item.status === 'yes'
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {item.flagged ? (
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                              ) : item.status === 'pass' || item.status === 'yes' ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.notes && (
                                  <p className="text-sm text-slate-600 mt-1">{item.notes}</p>
                                )}
                              </div>
                            </div>
                            {item.status && (
                              <Badge variant="outline" className="capitalize shrink-0">
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          {item.photo_urls?.length > 0 && (
                            <div className="flex gap-2 mt-3 ml-7">
                              {item.photo_urls.map((url, photoIndex) => (
                                <a 
                                  key={photoIndex}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100"
                                >
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardContent className="pt-6">
                {allPhotos.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Camera className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p>No photos taken during this inspection</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allPhotos.map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {flaggedItems > 0 && (
            <TabsContent value="issues">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {inspection.checklist_data?.flatMap((section, sectionIndex) => 
                      section.items?.filter(item => item.flagged).map((item, itemIndex) => (
                        <div 
                          key={`${sectionIndex}-${itemIndex}`}
                          className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-amber-900">{item.name}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                {section.section_name}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-amber-800 mt-2">{item.notes}</p>
                              )}
                            </div>
                          </div>
                          {item.photo_urls?.length > 0 && (
                            <div className="flex gap-2 mt-3 ml-8">
                              {item.photo_urls.map((url, photoIndex) => (
                                <a 
                                  key={photoIndex}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-20 w-20 rounded-lg overflow-hidden bg-slate-100"
                                >
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>Report generated by {company?.name || 'Estate Watch'}</p>
        </div>
      </footer>
    </div>
  );
}