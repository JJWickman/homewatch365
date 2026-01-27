import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Users, TrendingUp, Briefcase, Shield, Check, CreditCard, AlertCircle, X } from 'lucide-react';


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
    id: 'solopreneur_crm',
    name: 'Solopreneur + CRM',
    icon: Users,
    monthlyPrice: 149,
    annualPrice: 119,
    features: ['Everything in Solopreneur', 'CRM & Marketing Tools', 'Email Campaigns', 'SMS Marketing', 'Social Media Tools'],
    limits: { users: 1, admins: 1 },
    badge: 'CRM Bundle'
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
    id: 'growth_crm',
    name: 'Growth + CRM',
    icon: TrendingUp,
    monthlyPrice: 248,
    annualPrice: 198.40,
    features: ['Everything in Growth', 'CRM & Marketing Tools', 'Email Campaigns', 'SMS Marketing', 'Social Media Tools'],
    limits: { users: 5, admins: 1 },
    badge: 'CRM Bundle'
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
    id: 'professional_crm',
    name: 'Professional + CRM',
    icon: Briefcase,
    monthlyPrice: 299,
    annualPrice: 239.20,
    features: ['Everything in Professional', 'CRM & Marketing Tools', 'Email Campaigns', 'SMS Marketing', 'Social Media Tools'],
    limits: { users: 10, admins: 2 },
    badge: 'CRM Bundle'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    monthlyPrice: 499,
    annualPrice: 399,
    features: ['Everything in Professional', 'Up to 50 Team Members', '5 Admin Users', 'Contractor Management', 'CRM & Marketing Included'],
    limits: { users: 50, admins: 5 }
  }
];

export default function SubscriptionManagement({ company, companyMember }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [stripePrices, setStripePrices] = useState({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    console.log('SubscriptionManagement: company =', company);
    console.log('SubscriptionManagement: companyMember =', companyMember);
    loadStripePrices();
    if (company?.stripe_customer_id) {
      loadPaymentMethod();
    }

    // Check if returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id') || urlParams.get('payment_updated') === 'true') {
      // Reload after returning from Stripe to sync company data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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

  const handleSelectPlan = (tierId) => {
    if (!company) {
      console.error('No company found');
      return;
    }

    // If on trial or no active subscription, start new subscription directly
    if (company.subscription_status === 'trial' || !company.stripe_subscription_id) {
      startNewSubscription(tierId);
    } else if (company.stripe_subscription_id) {
      // If already subscribed, open Stripe billing portal
      handleUpdatePaymentMethod();
    }
  };

  const startNewSubscription = async (tierId) => {
    setLoadingCheckout(true);
    try {
      const priceId = stripePrices[tierId]?.[billingCycle];

      if (!priceId) {
        console.error('No price ID found for plan:', tierId, 'cycle:', billingCycle);
        console.error('Available stripePrices:', stripePrices);
        alert('Stripe products not configured yet. Please run "Create Stripe Products" from the Settings → Admin tab first.');
        setLoadingCheckout(false);
        return;
      }

      console.log('Creating checkout session for:', { tierId, priceId, billingCycle });
      const response = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        company_id: company.id,
        subscription_plan: tierId,
        billing_cycle: billingCycle,
        return_url: `${window.location.origin}/Settings?tab=billing`
      });

      console.log('Checkout response:', response.data);
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        console.error('No URL in response:', response.data);
        alert('Failed to create checkout session. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('Error with checkout session:', error);
      alert(`Error: ${error.message || 'Failed to process plan change. Please try again.'}`);
      setLoadingCheckout(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      setLoadingCheckout(true);
      const response = await base44.functions.invoke('createBillingPortalSession', {
        company_id: company.id,
        return_url: `${window.location.origin}/Settings?tab=billing&payment_updated=true`
      });
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        setLoadingCheckout(false);
      } else {
        alert('Failed to open billing portal. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Failed to open billing portal'}`);
      setLoadingCheckout(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setLoadingCheckout(false);
    loadPaymentMethod();
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
            Subscription Management
          </CardTitle>
          <CardDescription>Manage your subscription and payment information</CardDescription>
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
                  {loadingCheckout ? 'Loading...' : 'Manage Subscription'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-4">Access your Stripe billing portal to manage your subscription</p>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleUpdatePaymentMethod();
                }}
                disabled={loadingCheckout}
                className="bg-slate-900 hover:bg-slate-800"
                type="button"
              >
                {loadingCheckout ? 'Loading...' : 'Manage Subscription'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {PRICING_TIERS.map((tier) => {
              const TierIcon = tier.icon;
              const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
              const isCurrentPlan = company?.subscription_plan === tier.id;
              
              return (
                <Card 
                  key={tier.id}
                  className={`relative ${tier.popular ? 'border-2 border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${tier.badge ? 'border-purple-300' : ''}`}
                >
                  {tier.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  {tier.badge && !isCurrentPlan && !tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">{tier.badge}</Badge>
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


    </div>
    );
      }