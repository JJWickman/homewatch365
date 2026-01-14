import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, ClipboardCheck, Calendar, MapPin, 
  CheckCircle2, AlertTriangle, LogOut, User,
  Eye, FileText, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from '@/components/shared/StatusBadge';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [properties, setProperties] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Find client record by portal email
      const clients = await base44.entities.Client.filter({ portal_user_email: currentUser.email });
      
      if (clients.length === 0) {
        // Not a client - might be staff
        setLoading(false);
        return;
      }

      const clientData = clients[0];
      setClient(clientData);

      // Load related data
      const [companiesData, propertiesData, inspectionsData] = await Promise.all([
        base44.entities.Company.filter({ id: clientData.company_id }),
        base44.entities.Property.filter({ client_id: clientData.id }),
        base44.entities.Inspection.filter({ client_id: clientData.id, status: 'completed' }, '-scheduled_date', 20)
      ]);

      if (companiesData.length > 0) {
        setCompany(companiesData[0]);
      }
      setProperties(propertiesData);
      setInspections(inspectionsData);

    } catch (error) {
      console.error('Error loading portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Not Found</h2>
            <p className="text-slate-500 mb-6">
              Your account is not linked to a client portal. Please contact your property management company.
            </p>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = () => {
    return `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-900 text-white text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {client.first_name}
          </h1>
          <p className="text-slate-500">View your property inspections and reports</p>
        </div>

        {/* Properties */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-slate-100">
                  {property.primary_photo_url ? (
                    <img 
                      src={property.primary_photo_url} 
                      alt={property.name || property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium">{property.name || property.address}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.city}, {property.state}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <StatusBadge status={property.status} />
                    <span className="text-sm text-slate-500 capitalize">
                      {property.inspection_frequency?.replace('_', '-')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Inspections */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Inspections</h2>
          {inspections.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No completed inspections yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {inspections.map((inspection) => {
                const property = properties.find(p => p.id === inspection.property_id);
                return (
                  <Card 
                    key={inspection.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(createPageUrl('ClientInspectionView') + `?id=${inspection.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            inspection.overall_status === 'all_clear' 
                              ? 'bg-emerald-100' 
                              : 'bg-amber-100'
                          }`}>
                            {inspection.overall_status === 'all_clear' ? (
                              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-6 w-6 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{property?.name || property?.address}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(inspection.scheduled_date), 'MMM d, yyyy')}
                              </span>
                              <span className="capitalize">{inspection.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={inspection.overall_status} />
                          <Eye className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>Powered by Estate Watch</p>
          {company?.phone && (
            <p className="mt-1">
              Questions? Call {company.phone}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}