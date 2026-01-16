import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, ClipboardCheck, Calendar, MapPin, 
  CheckCircle2, AlertTriangle, LogOut, User,
  Eye, FileText, Clock, Download, Play, File, CreditCard
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
  const [loadingCheckout, setLoadingCheckout] = useState(false);

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

  const handleSubscribe = async () => {
    if (!client || !client.monthly_rate) {
      alert('Subscription not configured. Please contact your property manager.');
      return;
    }

    setLoadingCheckout(true);
    try {
      const response = await base44.functions.invoke('createClientSubscription', {
        client_id: client.id,
        company_id: client.company_id,
        email: user.email,
        amount: client.monthly_rate,
        billing_frequency: client.billing_frequency || 'monthly'
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
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

        {/* Subscription Card */}
        {client.monthly_rate && client.billing_status !== 'active' && !client.stripe_customer_id && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Subscribe to Property Management Services
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      ${client.monthly_rate}/month • {client.billing_frequency || 'Monthly'} billing
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Secure payments via credit card, Apple Pay, or Google Pay
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSubscribe}
                  disabled={loadingCheckout}
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                >
                  {loadingCheckout ? 'Loading...' : 'Subscribe Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {client.billing_status === 'active' && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-slate-900">Active Subscription</p>
                  <p className="text-sm text-slate-600">
                    ${client.monthly_rate}/month • Next billing date: {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Documents & Media */}
        {client.files && client.files.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Documents & Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.files.map((file, index) => {
                const isVideo = file.type?.startsWith('video/') || file.name?.match(/\.(mp4|mov|avi|webm)$/i);
                const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                
                return (
                  <Card key={index} className="overflow-hidden">
                    {isVideo ? (
                      <div className="aspect-video bg-slate-900 relative">
                        <video 
                          src={file.url} 
                          className="w-full h-full object-contain"
                          controls
                        />
                      </div>
                    ) : isImage ? (
                      <div className="aspect-video bg-slate-100">
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        <File className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          {file.uploaded_at && (
                            <p className="text-xs text-slate-500">
                              {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4 text-slate-500" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

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