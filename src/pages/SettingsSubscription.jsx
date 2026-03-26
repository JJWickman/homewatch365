import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PageHeader from '@/components/shared/PageHeader';

export default function SettingsSubscription() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.primary_tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: user.primary_tenant_id });
        if (tenants.length > 0) {
          setCompany(tenants[0]);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const res = await base44.functions.invoke('createBillingPortalSession', {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your plan, payment methods, and billing"
      />

      {/* Current Plan Card */}
      <Card className="rounded-2xl backdrop-blur-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Plan Name */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400">Plan Name</p>
              <p className="text-2xl font-bold text-white capitalize">{company?.subscription_plan}</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400">Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${
                  company?.subscription_status === 'active' ? 'bg-green-500' :
                  company?.subscription_status === 'trial' ? 'bg-blue-500' :
                  company?.subscription_status === 'past_due' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-white capitalize font-semibold">{company?.subscription_status}</span>
              </div>
            </div>

            {/* Trial Ends */}
            {company?.trial_ends_at && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">Trial Ends</p>
                <p className="text-white font-semibold">{new Date(company.trial_ends_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            {openingPortal ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening Portal...</>
            ) : (
              'Manage Subscription and Payment Methods'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}