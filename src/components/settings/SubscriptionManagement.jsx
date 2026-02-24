import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CreditCard, AlertCircle } from 'lucide-react';

export default function SubscriptionManagement({ company, companyMember }) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    loadPricingPlans();
    if (company?.stripe_customer_id) {
      loadPaymentMethod();
    }
  }, [company?.stripe_customer_id]);

  const loadPricingPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await base44.functions.invoke('getStripePrices', {});
      // Get all Stripe products with their metadata and prices
      const pricesResponse = await fetch('https://api.stripe.com/v1/products?active=true&limit=100', {
        headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
      });
      // For now, display a simple message that pricing is managed in Stripe
      setPricingPlans([]);
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    } finally {
      setLoadingPlans(false);
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
          <CardTitle className="text-lg">Available Plans</CardTitle>
          <CardDescription>Pricing is managed in Stripe. View all available plans there.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            All subscription plans and pricing are configured in Stripe. To view or modify available plans, visit your Stripe dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}