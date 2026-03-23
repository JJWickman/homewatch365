import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from 'lucide-react';

export default function PlanChangeDialog({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  billingCycle,
  company,
  paymentMethod,
  onPaymentMethodChange,
  onPlanChangeComplete
}) {
  const [selectedPlan, setSelectedPlan] = useState(newPlan || null);
  const [loading, setLoading] = useState(false);
  const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);
  const [stripePlans, setStripePlans] = useState([]);

  useEffect(() => {
    if (open) {
      setSelectedPlan(newPlan || null);
      loadPlans();
    }
  }, [open, newPlan]);

  const loadPlans = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices', {});
      if (response.data?.success) setStripePlans(response.data.plans);
    } catch (e) {
      console.error('Error loading plans:', e);
    }
  };

  const getPlanPrice = (planId, cycle) => {
    const plan = stripePlans.find(p => p.id === planId);
    return cycle === 'monthly' ? plan?.prices?.monthly?.amount : plan?.prices?.yearly?.amount;
  };

  const getPriceId = (planId, cycle) => {
    const plan = stripePlans.find(p => p.id === planId);
    return cycle === 'monthly' ? plan?.prices?.monthly?.priceId : plan?.prices?.yearly?.priceId;
  };

  const currentPrice = getPlanPrice(currentPlan, billingCycle) || 0;
  const newPrice = getPlanPrice(selectedPlan, billingCycle) || 0;
  const priceDifference = newPrice - currentPrice;
  const isUpgrade = priceDifference > 0;
  const isDowngrade = priceDifference < 0;

  const handleChangePlan = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;

    setLoading(true);
    try {
      const priceId = getPriceId(selectedPlan, billingCycle);

      if (!priceId) {
        alert('Stripe products not configured. Please contact support.');
        setLoading(false);
        return;
      }

      if (useNewPaymentMethod) {
        const portalResponse = await base44.functions.invoke('createBillingPortalSession', {
          company_id: company.id,
          return_url: `${window.location.origin}/Settings?tab=billing`
        });
        if (portalResponse.data?.url) {
          window.open(portalResponse.data.url, '_blank');
        }
      }

      const response = await base44.functions.invoke('updateSubscription', {
        subscription_id: company.stripe_subscription_id,
        price_id: priceId,
        company_id: company.id,
        subscription_plan: selectedPlan,
        billing_cycle: billingCycle
      });

      if (response.data.success) {
        onOpenChange(false);
        onPlanChangeComplete?.();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Failed to update plan. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Failed to change plan'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <DialogDescription>
            Select a new plan and review your billing details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Select New Plan</label>
            <Select value={selectedPlan || ''} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {stripePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id} disabled={plan.id === currentPlan}>
                    {plan.name} {plan.id === currentPlan && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Information */}
          {selectedPlan && selectedPlan !== currentPlan && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="text-sm">
                <p className="text-slate-600">Current Plan</p>
                <p className="font-semibold text-slate-900">
                  {currentPrice ? `$${currentPrice}/month` : '—'}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-sm text-slate-600">New Plan</p>
                <p className="font-semibold text-slate-900">
                  {newPrice ? `$${newPrice}/month` : '—'}
                </p>
              </div>
              {priceDifference !== 0 && currentPrice > 0 && newPrice > 0 && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-sm text-slate-600">
                    {isUpgrade ? 'Additional charge today' : 'Credit applied next billing cycle'}
                  </p>
                  <p className={`font-semibold text-lg ${isUpgrade ? 'text-green-600' : 'text-blue-600'}`}>
                    {isUpgrade ? '+' : ''}${Math.abs(priceDifference)}/month
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedPlan && selectedPlan !== currentPlan && isUpgrade && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                You'll be charged ${Math.abs(priceDifference)}/month today for this upgrade.
              </AlertDescription>
            </Alert>
          )}

          {selectedPlan && selectedPlan !== currentPlan && isDowngrade && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                You'll receive a credit of ${Math.abs(priceDifference)}/month applied to your next billing cycle.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Method */}
          {selectedPlan && selectedPlan !== currentPlan && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium">Payment Method</span>
              </div>
              {paymentMethod ? (
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <p className="text-slate-900">
                    {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No payment method on file</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseNewPaymentMethod(!useNewPaymentMethod)}
                className="w-full"
              >
                {useNewPaymentMethod ? 'Keep Current Method' : 'Change Payment Method'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={!selectedPlan || selectedPlan === currentPlan || loading}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {loading ? 'Processing...' : 'Change Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}