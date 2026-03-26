import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    price: '$49/mo',
    description: 'Up to 50 properties, unlimited clients.',
    features: ['50 properties', 'Unlimited clients', 'Basic reports', 'Email support']
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$99/mo',
    description: 'Up to 100 properties, full team management.',
    features: ['100 properties', 'Unlimited clients', 'Advanced reports', 'Team management', 'Priority support']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149/mo',
    description: 'Unlimited properties, white-label reports.',
    features: ['Unlimited properties', 'Unlimited clients', 'White-label reports', 'Full team management', '24/7 support']
  },
];

export default function SettingsSubscription() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [selectingPlan, setSelectingPlan] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser?.primary_tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: currentUser.primary_tenant_id });
        if (tenants.length > 0) {
          setTenant(tenants[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load subscription info');
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
      toast.error('Failed to open billing portal');
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleUpgradePlan = async (planId) => {
    if (planId === tenant?.subscription_plan) {
      toast.info('You are already on this plan');
      return;
    }

    setSelectingPlan(planId);
    try {
      // Get Stripe price ID for the plan
      const res = await base44.functions.invoke('getStripePrices', {});
      const prices = res.data?.prices || {};
      const priceId = prices[planId];

      if (!priceId) {
        toast.error('Plan pricing not available');
        setSelectingPlan(null);
        return;
      }

      // Create checkout session
      const checkout = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        subscription_plan: planId,
      });

      if (checkout.data?.url) {
        window.location.href = checkout.data.url;
      } else {
        toast.error('Failed to initiate checkout');
        setSelectingPlan(null);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error(error.message || 'Failed to upgrade plan');
      setSelectingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === tenant?.subscription_plan);
  const isActive = tenant?.subscription_status === 'active';
  const isPastDue = tenant?.subscription_status === 'past_due';
  const isTrial = tenant?.subscription_status === 'trial';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your SAAS plan and payment methods"
      />

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Plan */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Plan</p>
              <p className="text-xl font-bold text-slate-900 capitalize">{tenant?.subscription_plan}</p>
              {currentPlan && <p className="text-xs text-slate-500">{currentPlan.price}</p>}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Status</p>
              <div className="flex items-center gap-2">
                {isActive && (
                  <>
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </>
                )}
                {isTrial && (
                  <>
                    <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Trial</Badge>
                  </>
                )}
                {isPastDue && (
                  <>
                    <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Past Due</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Trial Ends */}
            {isTrial && tenant?.trial_ends_at && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Trial Ends</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(tenant.trial_ends_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Next Billing */}
            {isActive && tenant?.stripe_subscription_id && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Next Billing</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Past Due Alert */}
          {isPastDue && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Payment Required</p>
                <p className="text-sm text-red-800 mt-1">Your subscription payment failed. Please update your payment method.</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="w-full bg-slate-900 hover:bg-slate-800"
          >
            {openingPortal ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening Portal...</>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Payment Methods & Billing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Change Your Plan</h3>
          <p className="text-sm text-slate-600">Select a plan below to upgrade or downgrade your subscription</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === tenant?.subscription_plan;
            
            return (
              <Card
                key={plan.id}
                className={`transition-all cursor-pointer overflow-hidden ${
                  isCurrent
                    ? 'ring-2 ring-slate-900 bg-slate-50'
                    : 'hover:shadow-lg'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-base font-semibold text-slate-900 mt-1">
                        {plan.price}
                      </CardDescription>
                    </div>
                    {isCurrent && (
                      <Badge className="bg-slate-900 text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{plan.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgradePlan(plan.id)}
                    disabled={isCurrent || selectingPlan === plan.id}
                    className={`w-full ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {selectingPlan === plan.id ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>Select Plan <ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Need custom terms?</strong> Contact our sales team at support@estatewatch365.com for enterprise pricing and custom configurations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}