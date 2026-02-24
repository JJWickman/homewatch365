import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2 } from 'lucide-react';

export default function SubscriptionManagement({ company, companyMember }) {
  const [changingPlan, setChangingPlan] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices', {});
      if (response.data.success && response.data.plans) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanChange = async (planId) => {
    if (planId === company.subscription_plan) return;

    try {
      setChangingPlan(true);
      const plan = plans.find(p => p.id === planId);
      const priceId = billingCycle === 'monthly' 
        ? plan.prices?.monthly?.priceId 
        : plan.prices?.yearly?.priceId;
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        company_id: company.id,
        price_id: priceId,
        subscription_plan: planId,
        billing_cycle: billingCycle
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to initiate checkout. Please try again.');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan. Please try again.');
    } finally {
      setChangingPlan(false);
    }
  };

  const isAdmin = companyMember?.role === 'administrator' || companyMember?.role === 'owner' || companyMember?.is_owner;

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only administrators can manage subscription settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No plans available. Please configure plans in Stripe.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Choose Your Plan</h2>
          <p className="text-slate-600 mt-1">Select the plan that best fits your needs</p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              {billingCycle === 'yearly' && (
                <Badge className="bg-green-500 text-white text-xs">Save 20%</Badge>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = company.subscription_plan === plan.id;
            const monthlyPrice = plan.prices?.monthly?.amount;
            const yearlyPrice = plan.prices?.yearly?.amount;
            const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all ${
                  isCurrent 
                    ? 'border-green-500 bg-white shadow-lg' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">Current Plan</Badge>
                  </div>
                )}

                {/* Plan Name & Price */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{plan.name}</h3>
                  {displayPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-slate-900">${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      <span className="text-slate-600">/mo</span>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-slate-900">Custom Pricing</p>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-sm text-slate-600 mb-8 line-clamp-2">{plan.description}</p>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={isCurrent || changingPlan}
                  className={`w-full font-semibold py-2.5 transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {changingPlan ? 'Loading...' : isCurrent ? 'Current Plan' : 'Subscribe'}
                </Button>

                {/* Trial Notice - only show if they haven't completed a trial yet */}
                {!company?.trial_ends_at && !isCurrent && (
                  <p className="text-xs text-slate-500 text-center mt-4">14-day free trial included</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}