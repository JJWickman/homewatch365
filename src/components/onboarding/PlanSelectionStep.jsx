import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const PLANS = [
  {
    id: 'trial',
    name: '14-Day Free Trial',
    description: 'No credit card required',
    features: ['Full access to all features', 'Unlimited clients & properties', 'No commitment']
  },
  {
    id: 'solopreneur',
    name: 'Solopreneur - $99/mo',
    description: 'Perfect for solo operators',
    features: ['Unlimited clients & properties', 'Inspections & scheduling', 'Follow-ups & tasks']
  },
  {
    id: 'growth',
    name: 'Growth - $199/mo',
    description: 'Most popular for growing teams',
    features: ['Everything in Solopreneur', 'Up to 5 team members', 'Route optimization'],
    popular: true
  }
];

export default function PlanSelectionStep({ onContinue, onSkip, isLoading }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('');
      setPromoSuccess('');
      return;
    }

    setValidatingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      // Call backend to validate promo code
      // This would check if code exists, is active, not expired, etc.
      const response = await fetch(`/api/validate-promo?code=${encodeURIComponent(promoCode)}`);
      const data = await response.json();

      if (data.valid) {
        setPromoSuccess(`✓ ${data.benefit_description || 'Promo code applied!'}`);
      } else {
        setPromoError(data.message || 'Invalid promo code');
      }
    } catch (error) {
      setPromoError('Unable to validate code. Please try again.');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
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
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
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