import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight, AlertCircle, Loader2, Zap, Rocket, Crown, Gift } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-4xl font-black text-white bg-clip-text">Choose Your Plan</h2>
        <p className="text-slate-300 text-lg">Start free or upgrade to a paid plan immediately</p>
      </div>

      {loadingPlans ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const isPopular = plan.id === 'growth';
            const iconMap = { trial: Gift, solopreneur: Zap, growth: Rocket, professional: Crown };
            const Icon = iconMap[plan.id] || Gift;
            const gradients = {
              trial: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
              solopreneur: 'from-blue-500/15 via-blue-500/5 to-transparent',
              growth: 'from-purple-500/15 via-purple-500/5 to-transparent',
              professional: 'from-amber-500/15 via-amber-500/5 to-transparent'
            };
            const borderColors = {
              trial: 'border-emerald-400/60',
              solopreneur: 'border-blue-400/60',
              growth: 'border-purple-400/60',
              professional: 'border-amber-400/60'
            };
            const accentColors = {
              trial: 'text-emerald-400',
              solopreneur: 'text-blue-400',
              growth: 'text-purple-400',
              professional: 'text-amber-400'
            };
            const bgGradient = {
              trial: 'from-emerald-950/40',
              solopreneur: 'from-blue-950/40',
              growth: 'from-purple-950/40',
              professional: 'from-amber-950/40'
            };
            
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative text-left transition-all duration-300 group h-full w-full ${
                  isPopular && selectedPlan !== plan.id ? 'lg:scale-105' : ''
                }`}
              >
                {isPopular && selectedPlan !== plan.id && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                    ⭐ Most Popular
                  </div>
                )}
                <div
                  className={`h-full cursor-pointer rounded-2xl p-8 backdrop-blur-xl border-2 transition-all duration-300 relative overflow-hidden group-hover:shadow-2xl ${
                    selectedPlan === plan.id
                      ? `bg-gradient-to-br ${bgGradient[plan.id]} to-white/10 ${borderColors[plan.id]} shadow-2xl`
                      : `bg-gradient-to-br ${bgGradient[plan.id]} to-white/5 ${borderColors[plan.id]} hover:to-white/10 hover:shadow-xl`
                  }`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[plan.id]} pointer-events-none opacity-60`} />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all`}>
                        <Icon className={`h-6 w-6 ${accentColors[plan.id]}`} />
                      </div>
                      {selectedPlan === plan.id && (
                        <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full p-1.5 shadow-lg">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Plan name and description */}
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-slate-300 mb-6 opacity-90">{plan.description}</p>
                    )}

                    {/* Pricing */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        {plan.prices?.monthly?.amount ? (
                          <>
                            <span className="text-5xl font-bold text-white">${plan.prices.monthly.amount}</span>
                            <span className="text-slate-400 font-medium">/month</span>
                          </>
                        ) : (
                          <span className="text-5xl font-bold text-white">Free</span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features && (
                      <ul className="space-y-3 flex-1 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 group/item">
                            <div className="mt-1">
                              <Check className="h-4 w-4 text-emerald-400 group-hover/item:scale-110 transition-transform" />
                            </div>
                            <span className="text-slate-200 font-medium text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA Button */}
                    <div className="mt-auto">
                      {selectedPlan === plan.id && (
                        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-400/50 rounded-lg p-3 backdrop-blur-sm">
                          <p className="text-xs font-bold text-emerald-300">✓ Selected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Promo Code Section */}
      <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all">
        <h3 className="text-lg font-bold text-white mb-4">Have a Promo Code?</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo" className="text-slate-200 font-medium">Promo Code (Optional)</Label>
            <div className="flex gap-3">
              <Input
                id="promo"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  setPromoSuccess('');
                }}
                placeholder="Enter code"
                className="backdrop-blur-sm bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/20"
              />
              <Button
                onClick={handleValidatePromoCode}
                disabled={!promoCode.trim() || validatingPromo}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                {validatingPromo ? 'Checking...' : 'Apply'}
              </Button>
            </div>
          </div>
          {promoError && (
            <Alert className="bg-red-500/20 border-red-400/50 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{promoError}</AlertDescription>
            </Alert>
          )}
          {promoSuccess && (
            <Alert className="bg-emerald-500/20 border-emerald-400/50 backdrop-blur-sm">
              <Check className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-200">{promoSuccess}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onSkip}
          className="w-full backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold"
          disabled={isLoading}
          variant="outline"
        >
          Skip for Now
        </Button>
        <Button
          onClick={() => onContinue(selectedPlan, promoCode)}
          className="w-full backdrop-blur-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}