import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Eye, Users, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';

export default function SuperAdminConsole() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [companyStats, setCompanyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is a platform admin (role === 'admin')
      if (currentUser.role === 'admin') {
        setIsAdmin(true);
        await loadAllCompanies();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllCompanies = async () => {
    try {
      const allCompanies = await base44.entities.Company.list('-updated_date', 100);
      setCompanies(allCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleViewCompany = async (company) => {
    setSelectedCompany(company);
    setShowCompanyDetails(true);
    await loadCompanyStats(company.id);
  };

  const loadCompanyStats = async (companyId) => {
    setStatsLoading(true);
    try {
      const [clients, properties, visits, members] = await Promise.all([
        base44.entities.Client.filter({ company_id: companyId }),
        base44.entities.Property.filter({ company_id: companyId }),
        base44.entities.Visit.filter({ company_id: companyId }),
        base44.entities.CompanyMember.filter({ company_id: companyId })
      ]);

      setCompanyStats({
        totalClients: clients.length,
        totalProperties: properties.length,
        totalVisits: visits.length,
        completedVisits: visits.filter(v => v.status === 'completed').length,
        teamMembers: members.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Super Admin Console"
          subtitle="SaaS administration tools"
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Access Denied</p>
                <p className="text-sm text-amber-800 mt-1">Only platform administrators can access this console.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      trial: 'bg-blue-50 text-blue-700 border-blue-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      past_due: 'bg-amber-50 text-amber-700 border-amber-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Console"
        subtitle="Manage all customer accounts and view their data"
      />

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>View and manage all customer accounts ({companies.length} total)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by company name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Companies List */}
          <div className="space-y-2">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>No companies found</p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{company.name}</p>
                        <p className="text-sm text-slate-500">{company.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <Badge
                        variant="outline"
                        className={`capitalize ${getStatusColor(company.subscription_status)}`}
                      >
                        {company.subscription_status}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{company.subscription_plan}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCompany(company)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Details Dialog */}
      <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCompany?.logo_url ? (
                <img src={selectedCompany.logo_url} alt={selectedCompany?.name} className="h-6 w-6 rounded" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
              {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>{selectedCompany?.email}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : companyStats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-slate-500">Total Clients</p>
                    <p className="text-2xl font-bold text-slate-900">{companyStats.totalClients}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-slate-500">Total Properties</p>
                    <p className="text-2xl font-bold text-slate-900">{companyStats.totalProperties}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-slate-500">Total Visits</p>
                    <p className="text-2xl font-bold text-slate-900">{companyStats.totalVisits}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-slate-500">Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{companyStats.completedVisits}</p>
                  </div>
                  <div className="p-3 border rounded-lg col-span-2">
                    <p className="text-xs text-slate-500">Team Members</p>
                    <p className="text-2xl font-bold text-slate-900">{companyStats.teamMembers}</p>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Plan</p>
                  <p className="font-semibold capitalize">{selectedCompany?.subscription_plan}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge className={`capitalize ${getStatusColor(selectedCompany?.subscription_status)}`}>
                    {selectedCompany?.subscription_status}
                  </Badge>
                </div>
                {selectedCompany?.trial_ends_at && (
                  <div>
                    <p className="text-sm text-slate-600">Trial Ends</p>
                    <p className="font-semibold">
                      {new Date(selectedCompany.trial_ends_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedCompany?.stripe_customer_id && (
                  <div>
                    <p className="text-sm text-slate-600">Stripe ID</p>
                    <p className="font-mono text-xs text-slate-600">{selectedCompany.stripe_customer_id}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-semibold">{selectedCompany?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="font-semibold">{selectedCompany?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Address</p>
                  <p className="text-sm text-slate-700">
                    {selectedCompany?.address && selectedCompany?.city
                      ? `${selectedCompany.address}, ${selectedCompany.city}, ${selectedCompany.state} ${selectedCompany.zip}`
                      : 'Not provided'}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}