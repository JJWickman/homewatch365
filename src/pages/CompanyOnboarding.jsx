import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Loader2, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLANS = [
  {
    id: 'trial',
    name: '14-Day Free Trial',
    price: 'Free',
    description: 'No credit card required. Full access for 14 days.',
  },
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    price: '$49/mo',
    description: 'Up to 50 properties, unlimited clients.',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$99/mo',
    description: 'Up to 100 properties, full team management.',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149/mo',
    description: 'Unlimited properties, white-label reports.',
  },
];

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=subdomain, 2=info+plan
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  const [form, setForm] = useState({
    subdomain: '',
    companyName: '',
    fullName: '',
    email: '',
    plan: 'trial',
    promoCode: '',
  });

  useEffect(() => {
    init();
  }, []);

  // Auto-generate subdomain from company name and auto-check it
  useEffect(() => {
    if (!form.companyName || step !== 1) return;
    const slug = form.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, subdomain: slug }));
    setSubdomainAvailable(null);
    // Debounce the availability check
    const timer = setTimeout(() => {
      if (slug) checkSubdomainFor(slug);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.companyName]);

  const init = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setForm(f => ({
        ...f,
        email: currentUser.email,
        fullName: currentUser.full_name || '',
      }));

      // Already onboarded?
      if (currentUser.primary_tenant_id && currentUser.onboarding_completed === true) {
        navigate(createPageUrl('Dashboard'));
      }
    } catch {
      base44.auth.redirectToLogin(createPageUrl('CompanyOnboarding'));
    } finally {
      setCheckingUser(false);
    }
  };

  // Frontend can't check Tenant availability due to RLS — backend validates on submit

  const handleSubmit = async () => {
    if (!form.companyName || !form.subdomain || !form.email) {
      toast.error('Please fill in all required fields');
      return;
    }


    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCompanyOnboarding', {
        companyName: form.companyName,
        fullName: form.fullName,
        email: form.email,
        subdomain: form.subdomain,
        subscriptionPlan: form.plan,
        promoCode: form.promoCode || null,
      });

      if (response.data?.success) {
        console.log('Onboarding success, company_id:', response.data.company_id);
        if (form.plan !== 'trial' && response.data.price_id) {
          const checkout = await base44.functions.invoke('createCheckoutSession', {
            price_id: response.data.price_id,
            company_id: response.data.company_id,
            subscription_plan: form.plan,
          });
          if (checkout.data?.url) {
            window.location.href = checkout.data.url;
            return;
          }
        }
        toast.success('Welcome to Home Watch 365!');
        // Wait 1s for user record to update in backend before Layout checks for company_id
        setTimeout(() => {
          console.log('Navigating to Dashboard');
          navigate(createPageUrl('Dashboard'));
        }, 1000);
      } else {
        let errMsg = response.data?.error || 'Something went wrong';
        if (response.status === 409) {
          errMsg = 'That subdomain is already taken. Please choose another.';
        }
        toast.error(errMsg);
      }
    } catch (error) {
      let errMsg = error.message || 'Failed to create account.';
      if (error.response?.status === 409) {
        errMsg = 'That subdomain is already taken. Please choose another.';
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/26b3196de_image.png"
            alt="Home Watch 365"
            className="h-16 w-16 rounded-2xl object-contain mx-auto mb-4 bg-white"
          />
          <h1 className="text-3xl font-bold text-white">Home Watch 365</h1>
          <p className="text-blue-200 mt-1">Let's get your account set up</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step === s ? 'bg-blue-500 border-blue-400 text-white' :
                step > s ? 'bg-green-500 border-green-400 text-white' :
                'bg-white/10 border-white/30 text-white/50'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 ${step > s ? 'bg-green-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">

          {/* STEP 1: Company name + subdomain */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Company</h2>
                <p className="text-blue-200 text-sm">This sets up your unique subdomain on estatewatch365.app</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Company Name <span className="text-red-400">*</span></Label>
                <Input
                  value={form.companyName}
                  onChange={e => field('companyName', e.target.value)}
                  placeholder="Coastal Property Concierge"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Your Subdomain <span className="text-red-400">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={form.subdomain}
                    onChange={e => field('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-company"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  </div>
                  {form.subdomain && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200">{form.subdomain}.estatewatch365.app</span>
                  </div>
                  )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!form.companyName || !form.subdomain}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
              </Button>
            </div>
          )}

          {/* STEP 2: Personal info + plan */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Info & Plan</h2>
                <p className="text-blue-200 text-sm">Confirm your details and choose a subscription</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={form.fullName}
                    onChange={e => field('fullName', e.target.value)}
                    placeholder="Jason Wickman"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Contact Email <span className="text-red-400">*</span></Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => field('email', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {form.email !== user?.email && (
                    <p className="text-xs text-yellow-300">Different from login email ({user?.email}) — that's OK, we'll link them.</p>
                  )}
                </div>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
               <Label className="text-white">Promo Code <span className="text-white/50">(optional)</span></Label>
               <Input
                 value={form.promoCode}
                 onChange={e => field('promoCode', e.target.value)}
                 placeholder="Enter promo code if you have one"
                 className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
               />
              </div>

              {/* Plan selection */}
              <div className="space-y-2">
               <Label className="text-white">Choose Your Plan</Label>
               <div className="grid grid-cols-2 gap-3">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => field('plan', plan.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        form.plan === plan.id
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white text-sm">{plan.name}</span>
                        {form.plan === plan.id && <Check className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="text-blue-300 font-bold text-sm">{plan.price}</div>
                      <div className="text-white/50 text-xs mt-1">{plan.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !form.email}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up...</>
                  ) : (
                    <>{form.plan === 'trial' ? 'Start Free Trial' : 'Continue to Payment'} <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}