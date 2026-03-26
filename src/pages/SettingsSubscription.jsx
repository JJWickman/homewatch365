import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Loader2 } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription & Billing
          </CardTitle>
          <CardDescription>Manage your billing and subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Current Plan</p>
              <p className="text-2xl font-bold capitalize mt-1">{company?.subscription_plan}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Subscription Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  company?.subscription_status === 'active' ? 'bg-green-500' :
                  company?.subscription_status === 'trial' ? 'bg-blue-500' :
                  company?.subscription_status === 'past_due' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="capitalize font-semibold">{company?.subscription_status}</span>
              </div>
            </div>

            {company?.trial_ends_at && (
              <div>
                <p className="text-sm font-medium text-slate-600">Trial Ends</p>
                <p className="mt-1">{new Date(company.trial_ends_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {openingPortal ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening...</>
            ) : (
              'Manage Billing & Payment Methods'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}