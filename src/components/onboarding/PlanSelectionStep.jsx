import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleValidatePromoCode = async () => {
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
        <p className="text-slate-300">Start free or upgrade to a paid plan immediately</p>
      </div>

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
                selectedPlan === plan.id ? 'ring-2 ring-white/80' : ''
              }`}
            >
              <div className={`h-full cursor-pointer rounded-xl p-6 backdrop-blur-xl border transition-all ${
                selectedPlan === plan.id 
                  ? 'bg-white/95 border-white/80 shadow-2xl' 
                  : 'bg-white/70 border-white/40 hover:bg-white/80 hover:border-white/60'
              }`}>
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                {plan.description && <p className="text-sm text-slate-600 mt-1">{plan.description}</p>}
                {plan.prices?.monthly?.amount && (
                  <p className="text-2xl font-bold text-slate-900 mt-2">${plan.prices.monthly.amount}<span className="text-sm font-normal text-slate-600 ml-1">/mo</span></p>
                )}
                <div className="mt-4">
                  {plan.features && (
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedPlan === plan.id && (
                    <div className="mt-4 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/50 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-emerald-700">✓ Selected</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl p-6 backdrop-blur-xl bg-white/70 border border-white/40">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Have a Promo Code?</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="promo" className="text-slate-700">Promo Code (Optional)</Label>
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
                className="backdrop-blur-sm bg-white/70 border-white/40 text-slate-900 placeholder:text-slate-500"
              />
              <Button
                onClick={handleValidatePromoCode}
                disabled={!promoCode.trim() || validatingPromo}
                className="bg-white/80 hover:bg-white/90 text-slate-900 border-0 backdrop-blur-sm"
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
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSkip}
          className="w-full backdrop-blur-sm bg-white/50 hover:bg-white/70 text-slate-900 border-white/40 border"
          disabled={isLoading}
        >
          Skip
        </Button>
        <Button
          onClick={() => onContinue(selectedPlan, promoCode)}
          className="w-full backdrop-blur-sm bg-white/90 hover:bg-white text-slate-900 shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Continue'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}