import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Loader2, Check, Mail } from 'lucide-react';
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
  const { authError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [onboardingType, setOnboardingType] = useState(null);
  const [hasExistingTenant, setHasExistingTenant] = useState(false);
  const [existingTenantName, setExistingTenantName] = useState('');
  const [confirmedMultiTenant, setConfirmedMultiTenant] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    plan: 'trial',
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setForm(f => ({
        ...f,
        email: currentUser.email,
        fullName: currentUser.full_name || '',
      }));

      if (currentUser.primary_tenant_id) {
        try {
          const tenants = await base44.entities.Tenant.filter({ id: currentUser.primary_tenant_id });
          if (tenants.length > 0) {
            setHasExistingTenant(true);
            setExistingTenantName(tenants[0].name);
          }
        } catch (e) { /* ignore */ }
      }
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl('CompanyOnboarding'));
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const slug = form.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setLoading(true);

    try {
      // PAID plan: fetch price and go directly to Stripe checkout
      if (form.plan !== 'trial') {
        const pricesRes = await base44.functions.invoke('getStripePrices', {});
        const plans = pricesRes?.data?.plans || [];
        const plan = plans.find(p => p.id === form.plan);
        const price_id = plan?.prices?.monthly?.priceId || null;

        if (!price_id) {
          toast.error('Could not load pricing for this plan. Please try again.');
          setLoading(false);
          return;
        }

        const checkout = await base44.functions.invoke('createCheckoutSession', {
          price_id,
          subscription_plan: form.plan,
          company_name: form.companyName,
          slug,
          email: form.email,
        });

        if (checkout.data?.url) {
          window.location.href = checkout.data.url;
          return;
        } else {
          toast.error('Could not create checkout session. Please try again.');
          setLoading(false);
          return;
        }
      }

      // TRIAL plan: create tenant directly
      const response = await base44.functions.invoke('createCompanyOnboarding', {
        companyName: form.companyName,
        fullName: form.fullName,
        email: form.email,
        slug,
        subscriptionPlan: form.plan,
        promoCode: form.promoCode || null,
        isCreatingTenant: true,
      });

      if (response.data?.success && response.data?.tenant_id) {
        toast.success('Welcome to Home Watch 365!');
        const tenantSlug = response.data.tenant?.slug;
        if (tenantSlug) {
          window.location.href = `/?tenant=${tenantSlug}`;
        } else {
          navigate(createPageUrl('Dashboard'));
        }
      } else {
        toast.error(response.data?.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Loading
  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Intent selection screen
  if (!onboardingType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <img
              src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/26b3196de_image.png"
              alt="Home Watch 365"
              className="h-16 w-16 rounded-2xl object-contain mx-auto mb-4 bg-white"
            />
            <h1 className="text-3xl font-bold text-white">Home Watch 365</h1>
            <p className="text-blue-200 mt-1">Welcome</p>
          </div>

          <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">What brings you here?</h2>
            <p className="text-blue-200 text-sm mb-6">Choose how you'd like to get started</p>

            <div className="space-y-3">
              <button
                onClick={() => setOnboardingType('create')}
                className="w-full text-left p-4 rounded-xl border-2 border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Create a New Company</p>
                    <p className="text-white/60 text-sm mt-1">I Operate a Home Watch Business</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-300" />
                </div>
              </button>

              <button
                onClick={() => setOnboardingType('join')}
                className="w-full text-left p-4 rounded-xl border-2 border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Join Existing Company</p>
                    <p className="text-white/60 text-sm mt-1">I was invited to join a company</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-300" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Join screen — no form, just instructions
  if (onboardingType === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/26b3196de_image.png"
              alt="Home Watch 365"
              className="h-16 w-16 rounded-2xl object-contain mx-auto mb-4 bg-white"
            />
            <h1 className="text-3xl font-bold text-white">Home Watch 365</h1>
          </div>

          <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
            <p className="text-blue-200 text-sm mb-4">
              To join an existing company, ask your <strong className="text-white">company admin</strong> to invite you from their <strong className="text-white">Settings → Team</strong> page.
            </p>
            <p className="text-blue-200 text-sm mb-6">
              You'll receive an email with a link to accept the invitation and access your account.
            </p>
            <p className="text-blue-300 text-xs mb-8 italic">
              Already received an invite? Check your inbox for a message from Home Watch 365 and click the link inside.
            </p>
            <button
              onClick={() => setOnboardingType(null)}
              className="text-sm text-blue-300 hover:text-white underline transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth error screen
  if (authError && authError.type !== 'no_tenant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-blue-200">{authError.message}</p>
        </div>
      </div>
    );
  }

  // Create company form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/26b3196de_image.png"
            alt="Home Watch 365"
            className="h-16 w-16 rounded-2xl object-contain mx-auto mb-4 bg-white"
          />
          <h1 className="text-3xl font-bold text-white">Home Watch 365</h1>
          <p className="text-blue-200 mt-1">Let's get your account set up</p>
        </div>

        <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Create Your Account</h2>
              <p className="text-blue-200 text-sm">Set up your company and subscription</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Tenant Name <span className="text-red-400">*</span></Label>
                <Input
                  value={form.companyName}
                  onChange={e => field('companyName', e.target.value)}
                  placeholder="My Home Watch Company"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-blue-200">Your unique tenant identifier in the URL (e.g., ?tenant=my-home-watch-company).</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Full Name</Label>
                <Input
                  value={form.fullName}
                  onChange={e => field('fullName', e.target.value)}
                  placeholder="Jason Wickman"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
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

            {/* Multi-tenant confirmation warning */}
            {hasExistingTenant && (
              <div className="rounded-xl border-2 border-yellow-400/50 bg-yellow-400/10 p-4">
                <p className="text-yellow-300 font-semibold text-sm mb-1">⚠️ You already have a tenant</p>
                <p className="text-yellow-200 text-xs mb-3">
                  You're currently linked to <strong>{existingTenantName}</strong>. Creating a new company will add another tenant to your account.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedMultiTenant}
                    onChange={e => setConfirmedMultiTenant(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="text-yellow-200 text-xs">I understand and want to create an additional company</span>
                </label>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !form.email || !form.companyName || (hasExistingTenant && !confirmedMultiTenant)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up...</>
              ) : (
                <>{form.plan === 'trial' ? 'Start Free Trial' : 'Continue to Payment'} <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>

            <button
              onClick={() => setOnboardingType(null)}
              className="w-full text-center text-sm text-blue-300 hover:text-white underline transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}