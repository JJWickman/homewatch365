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
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    if (company?.stripe_customer_id) {
      loadPaymentMethod();
    }
  }, [company?.stripe_customer_id]);

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

  const openBillingPortal = async () => {
    try {
      setLoadingPortal(true);
      const response = await base44.functions.invoke('createBillingPortalSession', {
        company_id: company.id,
        return_url: `${window.location.origin}/Settings?tab=subscription`
      });
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      } else {
        alert('Failed to open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Failed to open billing portal'}`);
    } finally {
      setLoadingPortal(false);
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

      {/* Billing Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Your Subscription
          </CardTitle>
          <CardDescription>Update your plan, payment method, and billing details in the Stripe billing portal</CardDescription>
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
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Add a payment method to activate your subscription</p>
            </div>
          )}
          <Button 
            onClick={openBillingPortal}
            disabled={loadingPortal}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-4"
          >
            {loadingPortal ? 'Opening...' : 'Manage Subscription in Stripe'}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3">All billing changes are managed through Stripe</p>
        </CardContent>
      </Card>

      {/* Pricing Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Pricing Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.id} className="p-4 border rounded-lg bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-3">{tier.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Monthly:</span>
                    <span className="font-medium text-slate-900">${tier.monthlyPrice}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Annual:</span>
                    <span className="font-medium text-slate-900">${tier.annualPrice}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}