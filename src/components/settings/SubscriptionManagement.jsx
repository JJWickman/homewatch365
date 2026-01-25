import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, TrendingUp, Briefcase, Shield, Check, CreditCard, AlertCircle } from 'lucide-react';

const PRICING_TIERS = [
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    icon: Users,
    monthlyPrice: 99,
    annualPrice: 79,
    features: ['Unlimited Clients', 'Unlimited Properties', 'Inspections & Scheduling', 'Follow-ups & Tasks'],
    limits: { users: 1, admins: 1 }
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: TrendingUp,
    monthlyPrice: 199,
    annualPrice: 159,
    popular: true,
    features: ['Everything in Solopreneur', 'Up to 5 Field Inspectors', '1 Admin User', 'Team Collaboration', 'Route Optimization'],
    limits: { users: 5, admins: 1 }
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Briefcase,
    monthlyPrice: 249,
    annualPrice: 199,
    features: ['Everything in Growth', 'Up to 10 Team Members', '2 Admin Users', 'Priority Support', 'Route Optimization'],
    limits: { users: 10, admins: 2 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    monthlyPrice: 499,
    annualPrice: 399,
    features: ['Everything in Professional', 'Up to 50 Team Members', '5 Admin Users', 'Contractor Management', 'Marketing Tools'],
    limits: { users: 50, admins: 5 }
  }
];

export default function SubscriptionManagement({ company, companyMember }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [stripePrices, setStripePrices] = useState({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    loadStripePrices();
    if (company?.stripe_customer_id) {
      loadPaymentMethod();
    }

    // Check if returning from Stripe billing portal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_updated') === 'true') {
      // Reload payment method after a short delay to ensure Stripe webhook processed
      setTimeout(() => {
        loadPaymentMethod();
      }, 2000);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=billing');
    }
  }, [company?.stripe_customer_id]);

  const loadStripePrices = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices');
      if (response.data.success) {
        setStripePrices(response.data.prices);
      }
    } catch (error) {
      console.error('Error loading Stripe prices:', error);
    }
  };

  const loadPaymentMethod = async () => {
    try {
      const response = await base44.functions.invoke('getPaymentMethod', {
        company_id: company.id
      });
      if (response.data.success && response.data.payment_method) {
        setPaymentMethod(response.data.payment_method);
      }
    } catch (error) {
      console.error('Error loading payment method:', error);
    }
  };

  const handleSelectPlan = async (tierId) => {
    if (!company) return;
    
    setLoadingCheckout(true);
    try {
      const priceId = stripePrices[tierId]?.[billingCycle];
      
      if (!priceId) {
        alert('Stripe products not configured yet. Please run "Create Stripe Products" from the Settings → Admin tab first.');
        setLoadingCheckout(false);
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        company_id: company.id,
        subscription_plan: tierId,
        billing_cycle: billingCycle
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(`Error: ${error.message || 'Failed to start checkout. Please try again.'}`);
      setLoadingCheckout(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setLoadingCheckout(true);
    try {
      const response = await base44.functions.invoke('createBillingPortalSession', {
        company_id: company.id
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to open billing portal. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert(`Error: ${error.message || 'Failed to open billing portal. Please try again.'}`);
      setLoadingCheckout(false);
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

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      {company?.subscription_status === 'trial' && company.trial_ends_at && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Free Trial Active</p>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.ceil((new Date(company.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Trial ends {new Date(company.trial_ends_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className="bg-amber-600 text-white">Free Trial</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {company?.subscription_status === 'active' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Current Plan</p>
                <p className="text-2xl font-bold capitalize text-slate-900">
                  {PRICING_TIERS.find(t => t.id === company.subscription_plan)?.name || company.subscription_plan}
                </p>
              </div>
              <Badge className="bg-blue-600 text-white">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethod ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-sm text-slate-500">
                      Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={handleUpdatePaymentMethod}
                  disabled={loadingCheckout}
                >
                  {loadingCheckout ? 'Loading...' : 'Update'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-4">No payment method on file</p>
              <Button 
                onClick={handleUpdatePaymentMethod}
                disabled={loadingCheckout}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {loadingCheckout ? 'Loading...' : 'Add Payment Method'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Billing Cycle Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <CardDescription>Select the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center rounded-lg border p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {PRICING_TIERS.map((tier) => {
              const TierIcon = tier.icon;
              const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
              const isCurrentPlan = company?.subscription_plan === tier.id;
              
              return (
                <Card 
                  key={tier.id}
                  className={`relative ${tier.popular ? 'border-2 border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white">Current Plan</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <TierIcon className="h-6 w-6 text-slate-700" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-slate-500 ml-2">/mo</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-sm text-green-600 mt-2">
                          Save ${(tier.monthlyPrice * 12) - (tier.annualPrice * 12)}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-5 w-5 text-green-600 shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handleSelectPlan(tier.id)}
                      disabled={isCurrentPlan || loadingCheckout}
                      className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                      {loadingCheckout ? 'Loading...' : (isCurrentPlan ? 'Current Plan' : company?.subscription_status === 'trial' ? 'Start Subscription' : 'Change Plan')}
                    </Button>
                    {company?.subscription_status === 'trial' && !isCurrentPlan && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        14-day free trial included
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add-Ons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Add-Ons</CardTitle>
          <CardDescription>Enhance your plan with additional features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">CRM & Marketing</h3>
                    <p className="text-2xl font-bold text-slate-900">$99<span className="text-sm font-normal text-slate-500">/month</span></p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Advanced CRM features and contact management</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Email marketing campaigns</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">SMS marketing campaigns</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Newsletter templates and automation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Social media marketing tools</span>
                  </li>
                </ul>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> Add-on to any plan • Included in Enterprise • Up to 5,000 emails per month
                  </p>
                </div>

                {company?.marketing_addon_active && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                )}
                {company?.subscription_plan === 'enterprise' && !company?.marketing_addon_active && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Included in Plan</Badge>
                )}
              </div>

              <Button 
                variant={company?.marketing_addon_active ? "outline" : "default"}
                className={company?.marketing_addon_active ? "" : "bg-purple-600 hover:bg-purple-700"}
                disabled={loadingCheckout}
              >
                {company?.marketing_addon_active ? "Remove Add-On" : "Add to Plan"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Add-ons are billed monthly in addition to your base subscription plan.
          </p>
        </CardContent>
      </Card>


    </div>
  );
}