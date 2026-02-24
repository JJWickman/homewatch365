import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, Check, Loader2 } from 'lucide-react';

export default function SubscriptionManagement({ company, companyMember }) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlans();
    if (company?.stripe_customer_id) {
      loadPaymentMethod();
    }
  }, [company?.stripe_customer_id]);

  const loadPlans = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices', {});
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
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

  const handlePlanChange = async (planId) => {
    if (planId === company.subscription_plan) return;

    try {
      setChangingPlan(true);
      await base44.entities.Company.update(company.id, {
        subscription_plan: planId
      });
      window.location.reload();
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan. Please try again.');
    } finally {
      setChangingPlan(false);
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
                   {company.subscription_plan?.replace(/_/g, ' ')}
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
            {loadingPortal ? 'Opening...' : 'Manage Payment Method'}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3">Payment processing is handled by Stripe</p>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
          <CardDescription>Select a plan to upgrade or downgrade your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-slate-600">No plans available. Please configure plans in Stripe.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = company.subscription_plan === plan.id;
                const monthlyPrice = plan.prices?.monthly?.amount;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-lg border-2 p-4 transition-all ${
                      isCurrent ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600">Current</Badge>
                      </div>
                    )}
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {monthlyPrice ? `$${monthlyPrice}` : 'Custom'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                    <Button
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={isCurrent || changingPlan}
                      variant={isCurrent ? 'outline' : 'default'}
                      className="w-full mt-4"
                      size="sm"
                    >
                      {isCurrent ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4" /> Current
                        </span>
                      ) : (
                        'Select Plan'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}