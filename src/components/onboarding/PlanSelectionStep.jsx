import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PlanSelectionStep({ onContinue, onSkip, isLoading }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  useEffect(() => {
    loadStripePlans();
  }, []);

  const loadStripePlans = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices', {});
      if (response.data?.success && response.data.plans) {
        // Add default features if missing, prepend the free trial option
        const plansWithFeatures = response.data.plans.map(plan => ({
          ...plan,
          features: plan.features || ['Full access', 'Manage clients & properties', 'Mobile inspections']
        }));
        setPlans([{ id: 'trial', name: '14-Day Free Trial', description: 'No credit card required', features: ['Full access to all features', 'Unlimited clients & properties', 'No commitment'] }, ...plansWithFeatures]);
      } else {
        console.error('Failed to load plans:', response.data);
      }
    } catch (e) {
      console.error('Error loading plans:', e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setValidatingPromo(true);
    setPromoError('');
    setPromoSuccess('');
    
    try {
      const response = await base44.functions.invoke('validatePromoCode', { code: promoCode });
      if (response.data?.valid) {
        setPromoSuccess(response.data.description || 'Promo code applied successfully!');
      } else {
        setPromoError(response.data?.message || 'Invalid promo code');
      }
    } catch (e) {
      console.error('Error validating promo code:', e);
      setPromoError('Failed to validate promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-slate-400">Start free or upgrade to a paid plan immediately</p>
      </div>

      {/* Plan Selection */}
      {loadingPlans ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative text-left transition-all ${
              selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Card className={`h-full cursor-pointer ${
              selectedPlan === plan.id ? 'border-blue-500 border-2' : ''
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.description && <CardDescription>{plan.description}</CardDescription>}
                {plan.prices?.monthly?.amount && (
                  <p className="text-2xl font-bold text-slate-900 mt-1">${plan.prices.monthly.amount}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                )}
              </CardHeader>
              <CardContent>
                {plan.features && (
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedPlan === plan.id && (
                  <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600">✓ Selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      )}

      {/* Promo Code Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Have a Promo Code?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="promo" className="text-slate-300">Promo Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="promo"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  setPromoSuccess('');
                }}
                placeholder="Enter code"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={validatePromoCode}
                variant="outline"
                disabled={!promoCode.trim() || validatingPromo}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {validatingPromo ? 'Checking...' : 'Apply'}
              </Button>
            </div>
          </div>
          {promoError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{promoError}</AlertDescription>
            </Alert>
          )}
          {promoSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{promoSuccess}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSkip}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          disabled={isLoading}
        >
          Skip
        </Button>
        <Button
          onClick={() => onContinue(selectedPlan, promoCode)}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}