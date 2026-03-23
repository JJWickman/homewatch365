import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2, Star } from 'lucide-react';

const PLAN_FEATURES = {
  solopreneur: {
    highlight: false,
    tagline: 'Perfect for solo operators',
    features: [
      '1 user account',
      'Up to 50 properties',
      'Visit scheduling & checklists',
      'Client portal access',
      'Photo reports & PDF exports',
      'Email notifications',
    ]
  },
  growth: {
    highlight: true,
    tagline: 'Most popular for growing teams',
    features: [
      'Up to 2 user accounts',
      'Up to 100 properties',
      'Everything in Solopreneur',
      'Route optimizer',
      'Dispatcher dashboard',
      'Team scheduling',
    ]
  },
  professional: {
    highlight: false,
    tagline: 'For established businesses',
    features: [
      'Up to 5 user accounts',
      'Up to 500 properties',
      'Everything in Growth',
      'Advanced reporting',
      'Priority support',
      'Custom branding',
    ]
  }
};

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
              <Badge className="bg-green-500 text-white text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = company.subscription_plan === plan.id;
            const monthlyPrice = plan.prices?.monthly?.amount;
            const yearlyTotal = plan.prices?.yearly?.amount;
            // Show per-month equivalent for annual (total / 12)
            const yearlyPerMonth = yearlyTotal ? Math.round(yearlyTotal / 12) : null;
            const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPerMonth;
            
            const planMeta = PLAN_FEATURES[plan.id] || {};
            const isHighlighted = planMeta.highlight;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all flex flex-col ${
                  isCurrent
                    ? 'border-green-500 bg-white shadow-lg'
                    : isHighlighted
                    ? 'border-blue-500 bg-white shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Badges */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">Current Plan</Badge>
                  </div>
                )}
                {!isCurrent && isHighlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" /> Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Name & Price */}
                <div className="mb-2">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  {planMeta.tagline && (
                    <p className="text-sm text-slate-500 mb-4">{planMeta.tagline}</p>
                  )}
                  {displayPrice ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900">${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        <span className="text-slate-600">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && yearlyTotal && (
                        <p className="text-sm text-slate-500 mt-1">${yearlyTotal}/yr billed annually</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-slate-900">Custom Pricing</p>
                  )}
                </div>

                {/* Divider */}
                <hr className="my-6 border-slate-100" />

                {/* Features */}
                {planMeta.features && (
                  <ul className="space-y-3 mb-8 flex-1">
                    {planMeta.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={isCurrent || changingPlan}
                  className={`w-full font-semibold py-2.5 transition-all ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                      : isHighlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {changingPlan ? 'Loading...' : isCurrent ? 'Current Plan' : 'Subscribe'}
                </Button>

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