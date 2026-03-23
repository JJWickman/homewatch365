import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const PLAN_FEATURES = {
  solopreneur: { name: 'Solopreneur', tagline: 'Solo inspectors' },
  professional: { name: 'Professional', tagline: 'Growing teams' },
  enterprise: { name: 'Enterprise', tagline: 'Large teams' },
};

export default function AdminSubscriptions() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is super admin
      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const companiesData = await base44.entities.Company.list('-created_date', 1000);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Admin Subscriptions" />
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold">Access Denied</p>
          <p className="text-slate-600 text-sm">Only super admins can access this page.</p>
        </Card>
      </div>
    );
  }

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="All Subscriptions"
        subtitle={`${companies.length} total companies`}
      />

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Companies Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No companies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Company</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Plan</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Trial Ends</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Marketing Add-on</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => {
                  const planInfo = PLAN_FEATURES[company.subscription_plan] || { name: company.subscription_plan || 'None', tagline: '' };
                  const trialEndsDate = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
                  const isTrialExpired = trialEndsDate && trialEndsDate < new Date();

                  return (
                    <tr key={company.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 capitalize">{planInfo.name}</p>
                          {planInfo.tagline && <p className="text-xs text-slate-500">{planInfo.tagline}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${
                          company.subscription_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                          company.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          company.subscription_status === 'past_due' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          company.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {company.subscription_status?.charAt(0).toUpperCase() + company.subscription_status?.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {trialEndsDate ? (
                          <div>
                            <p className={isTrialExpired ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                              {trialEndsDate.toLocaleDateString()}
                            </p>
                            {isTrialExpired && <p className="text-xs text-red-600">Expired</p>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {company.marketing_addon_active ? (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Active</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}