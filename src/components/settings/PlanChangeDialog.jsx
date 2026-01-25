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

const PRICING_TIERS = [
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    monthlyPrice: 99,
    annualPrice: 79,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 199,
    annualPrice: 159,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 249,
    annualPrice: 199,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 499,
    annualPrice: 399,
  }
];

const PLAN_FEATURES = {
  solopreneur: { users: 1, admins: 1 },
  growth: { users: 5, admins: 1 },
  professional: { users: 10, admins: 2 },
  enterprise: { users: 50, admins: 5 }
};

export default function PlanChangeDialog({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  billingCycle,
  company,
  stripePrices,
  paymentMethod,
  onPaymentMethodChange,
  onPlanChangeComplete
}) {
  const [selectedPlan, setSelectedPlan] = useState(newPlan || null);
  const [loading, setLoading] = useState(false);
  const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);

  const currentTier = PRICING_TIERS.find(t => t.id === currentPlan);
  const selectedTier = selectedPlan ? PRICING_TIERS.find(t => t.id === selectedPlan) : null;

  const currentPrice = currentTier
    ? (billingCycle === 'monthly' ? currentTier.monthlyPrice : currentTier.annualPrice)
    : 0;

  const newPrice = selectedTier
    ? (billingCycle === 'monthly' ? selectedTier.monthlyPrice : selectedTier.annualPrice)
    : 0;

  const priceDifference = newPrice - currentPrice;
  const isUpgrade = priceDifference > 0;
  const isDowngrade = priceDifference < 0;

  const currentFeatures = PLAN_FEATURES[currentPlan] || {};
  const newFeatures = PLAN_FEATURES[selectedPlan] || {};
  
  const losingUsers = newFeatures.users < currentFeatures.users;
  const losingAdmins = newFeatures.admins < currentFeatures.admins;

  const handleChangePlan = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;

    setLoading(true);
    try {
      const priceId = stripePrices[selectedPlan]?.[billingCycle];

      if (!priceId) {
        alert('Stripe products not configured. Please contact support.');
        setLoading(false);
        return;
      }

      // If changing payment method, open billing portal first
      if (useNewPaymentMethod) {
        const portalResponse = await base44.functions.invoke('createBillingPortalSession', {
          company_id: company.id,
          return_url: `${window.location.origin}/Settings?tab=billing`
        });

        if (portalResponse.data?.url) {
          window.open(portalResponse.data.url, '_blank');
        }
      }

      // Now update subscription
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
                {PRICING_TIERS.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id} disabled={tier.id === currentPlan}>
                    {tier.name} {tier.id === currentPlan && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Information */}
          {selectedTier && selectedPlan !== currentPlan && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="text-sm">
                <p className="text-slate-600">Current Plan</p>
                <p className="font-semibold text-slate-900">
                  ${currentPrice}/month
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-sm text-slate-600">New Plan</p>
                <p className="font-semibold text-slate-900">
                  ${newPrice}/month
                </p>
              </div>

              {/* Billing Impact */}
              {priceDifference !== 0 && (
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

          {/* Billing Impact Alert */}
          {selectedTier && isUpgrade && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                You'll be charged ${Math.abs(priceDifference)}/month today for this upgrade. Your monthly billing continues on the same schedule.
              </AlertDescription>
            </Alert>
          )}

          {selectedTier && isDowngrade && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                You'll receive a credit of ${Math.abs(priceDifference)}/month applied to your next billing cycle.
              </AlertDescription>
            </Alert>
          )}

          {/* Downgrade Warning */}
          {selectedTier && isDowngrade && (losingUsers || losingAdmins) && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 text-sm">
                <strong>Note:</strong> This plan supports fewer users.
                {losingUsers && <div>• Max users: {currentFeatures.users} → {newFeatures.users}</div>}
                {losingAdmins && <div>• Admin users: {currentFeatures.admins} → {newFeatures.admins}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Method */}
          {selectedTier && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
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