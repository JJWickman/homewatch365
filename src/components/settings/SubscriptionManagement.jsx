import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, Check, Loader2 } from 'lucide-react';

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
      if (response.data.success) {
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
    <div className="space-y-8">
      {/* Billing Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethod ? (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-4">
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
          ) : (
            <div className="py-4 text-center mb-4">
              <p className="text-sm text-slate-600">Add a payment method to activate your subscription</p>
            </div>
          )}
          <Button 
            onClick={openBillingPortal}
            disabled={loadingPortal}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            {loadingPortal ? 'Opening...' : 'Manage Payment Method'}
          </Button>
        </CardContent>
      </Card>

      {/* Choose Your Plan Section */}
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Choose Your Plan</h2>
          <p className="text-slate-600 mt-1">Select the plan that best fits your needs</p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
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
        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <p className="text-sm text-slate-600 text-center">No plans available. Please configure plans in Stripe.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = company.subscription_plan === plan.id;
              const price = billingCycle === 'monthly' 
                ? plan.prices?.monthly?.amount 
                : plan.prices?.yearly?.amount;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${
                    isCurrent 
                      ? 'border-green-500 bg-white shadow-lg' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white px-3 py-1">Current Plan</Badge>
                    </div>
                  )}

                  {/* Plan Name & Price */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {price ? (
                      <div className="mt-3">
                        <span className="text-4xl font-bold text-slate-900">${price}</span>
                        <span className="text-slate-600 ml-2">/mo</span>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-slate-900 mt-3">Custom</p>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-sm text-slate-600 mb-6">{plan.description}</p>
                  )}

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isCurrent || changingPlan}
                    className={`w-full mb-6 font-semibold ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : 'Subscribe'}
                  </Button>

                  {/* Trial Notice */}
                  {company?.subscription_status === 'trial' && (
                    <p className="text-xs text-slate-500 text-center">14-day free trial included</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}