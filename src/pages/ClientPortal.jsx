import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  Building2, LogOut, User, Home, ClipboardCheck,
  DollarSign, Clock, LayoutList
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from '@/components/shared/StatusBadge';
import PortalVisitsTab from '@/components/portal/PortalVisitsTab';
import PortalTimelineTab from '@/components/portal/PortalTimelineTab';
import PortalBillingTab from '@/components/portal/PortalBillingTab';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'visits', label: 'Visits', icon: ClipboardCheck },
  { id: 'timeline', label: 'Timeline', icon: LayoutList },
  { id: 'billing', label: 'Billing', icon: DollarSign },
];

export default function ClientPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [properties, setProperties] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceSubscription, setServiceSubscription] = useState(null);
  const [additionalProducts, setAdditionalProducts] = useState([]);
  const [allStatements, setAllStatements] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const sessionEmail = sessionStorage.getItem('portal_client_email');
      const sessionClientId = sessionStorage.getItem('portal_client_id');
      const sessionToken = sessionStorage.getItem('portal_session_token');

      if (!sessionEmail || !sessionClientId || !sessionToken) {
        navigate(createPageUrl('ClientLogin'));
        return;
      }

      const sessionAge = Date.now() - parseInt(sessionToken);
      if (sessionAge > 24 * 60 * 60 * 1000) {
        sessionStorage.clear();
        navigate(createPageUrl('ClientLogin'));
        return;
      }

      const clients = await base44.entities.Client.filter({ id: sessionClientId, portal_user_email: sessionEmail });

      if (clients.length === 0 || !clients[0].portal_access) {
        sessionStorage.clear();
        setLoading(false);
        return;
      }

      const clientData = clients[0];
      setClient(clientData);

      const [companiesData, propertiesData, visitsData] = await Promise.all([
        base44.entities.Company.filter({ id: clientData.company_id }),
        base44.entities.Property.filter({ client_id: clientData.id }),
        base44.entities.Visit.filter({ client_id: clientData.id }, '-scheduled_date', 50)
      ]);

      if (companiesData.length > 0) setCompany(companiesData[0]);
      setProperties(propertiesData);
      setVisits(visitsData);

      if (clientData.service_subscription_id) {
        const services = await base44.entities.ProductService.filter({ id: clientData.service_subscription_id });
        if (services.length > 0) setServiceSubscription(services[0]);
      }

      if (clientData.additional_products?.length > 0) {
        const allProducts = await base44.entities.ProductService.list();
        setAdditionalProducts(allProducts.filter(p => clientData.additional_products.includes(p.id)));
      }

      const stmts = await base44.entities.MonthlyStatement.filter({ client_id: clientData.id }, '-billing_month');
      setAllStatements(stmts);

    } catch (error) {
      console.error('Error loading portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate(createPageUrl('ClientLogin'));
  };

  const handleDownloadInvoice = async (statementId) => {
    const response = await base44.functions.invoke('generateInvoicePDF', { statement_id: statementId });
    if (response.data?.success) window.open(response.data.pdf_url, '_blank');
  };

  const handlePayInvoice = (statement) => {
    setSelectedStatement(statement);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <p className="text-slate-500 mb-6">Your account is not linked to a portal. Please contact your property manager.</p>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedVisits = visits.filter(v => v.status === 'completed');
  const upcomingVisits = visits.filter(v => ['scheduled', 'open', 'in_progress'].includes(v.status));
  const initials = `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-auto max-w-[120px] object-contain" />
            ) : (
              <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{client.first_name} {client.last_name}</p>
              <p className="text-xs text-slate-500">{client.portal_user_email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Welcome card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
              <p className="text-blue-200 text-sm mt-2">{company?.name || 'Your Property Manager'}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
                <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Properties</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
                <p className="text-2xl font-bold text-emerald-600">{completedVisits.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{upcomingVisits.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Upcoming</p>
              </div>
            </div>

            {/* Properties */}
            <section>
              <h2 className="font-semibold text-slate-900 mb-3">Your Properties</h2>
              {properties.length === 0 ? (
                <Card className="bg-white"><CardContent className="py-8 text-center text-slate-400 text-sm">No properties on file</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {properties.map(property => (
                    <div key={property.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      {property.primary_photo_url && (
                        <div className="h-32 bg-slate-100">
                          <img src={property.primary_photo_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{property.name || property.address}</p>
                            <p className="text-sm text-slate-500">{property.address}</p>
                            <p className="text-sm text-slate-500">{property.city}, {property.state} {property.zip}</p>
                          </div>
                          <StatusBadge status={property.status} />
                        </div>
                        {property.visit_frequency && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {property.visit_frequency.replace('_', '-')} visits
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent visit */}
            {completedVisits.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-900">Most Recent Visit</h2>
                  <button onClick={() => setActiveTab('timeline')} className="text-sm text-blue-600 font-medium">View all →</button>
                </div>
                {(() => {
                  const latest = completedVisits[0];
                  const property = properties.find(p => p.id === latest.property_id);
                  const isAllClear = latest.overall_status === 'all_clear';
                  return (
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="w-full text-left bg-white rounded-xl border shadow-sm p-4 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isAllClear ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                          {isAllClear
                            ? <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                            : <ClipboardCheck className="h-5 w-5 text-amber-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{property?.name || property?.address}</p>
                          <p className="text-sm text-slate-500">{format(new Date(latest.scheduled_date), 'MMMM d, yyyy')}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isAllClear ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isAllClear ? 'All Clear' : 'Issues Found'}
                        </span>
                      </div>
                      {latest.summary_notes && (
                        <p className="text-sm text-slate-500 mt-3 line-clamp-2">{latest.summary_notes}</p>
                      )}
                    </button>
                  );
                })()}
              </section>
            )}

            {/* Company contact */}
            {company && (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="font-semibold text-slate-900 mb-2 text-sm">Your Property Manager</p>
                <p className="text-sm font-medium">{company.name}</p>
                <div className="space-y-1 mt-1">
                  {company.phone && <a href={`tel:${company.phone}`} className="block text-sm text-blue-600">{company.phone}</a>}
                  {company.email && <a href={`mailto:${company.email}`} className="block text-sm text-blue-600">{company.email}</a>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISITS TAB */}
        {activeTab === 'visits' && (
          <PortalVisitsTab
            visits={visits}
            properties={properties}
            onSelectVisit={() => setActiveTab('timeline')}
          />
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <PortalTimelineTab visits={visits} properties={properties} />
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <PortalBillingTab
            client={client}
            serviceSubscription={serviceSubscription}
            additionalProducts={additionalProducts}
            allStatements={allStatements}
            onDownloadInvoice={handleDownloadInvoice}
            onPayInvoice={handlePayInvoice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <a href="https://www.estatewatch365.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/b43168cee_image.png"
              alt="HomeWatch365"
              className="h-10 w-auto object-contain mx-auto opacity-70"
            />
          </a>
          {company?.phone && (
            <p className="text-xs text-slate-400 mt-2">{company.name} · {company.phone}</p>
          )}
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && selectedStatement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Pay Invoice</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Period</span>
                  <span className="font-medium">{format(new Date(selectedStatement.billing_month + '-01'), 'MMMM yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Amount Due</span>
                  <span className="text-2xl font-bold text-blue-600">${(selectedStatement.total || 0).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.open(`${window.location.origin}/InvoicePayment?statement_id=${selectedStatement.id}`, '_blank');
                  setShowPaymentModal(false);
                }}>
                Pay Securely
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}