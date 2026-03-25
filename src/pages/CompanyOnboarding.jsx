import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PlanSelectionStep from '@/components/onboarding/PlanSelectionStep';

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [promoCode, setPromoCode] = useState('');
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('force_restart') === 'true') {
      setCheckingUser(false);
      setStep('welcome');
      return;
    }
    checkExistingCompany();
  }, []);

  const checkExistingCompany = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load company data from app settings
      const companies = await base44.entities.Company.list('-updated_date', 1);
      if (companies.length > 0) {
        setCompany(companies[0]);
      }

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0 && currentUser.onboarding_completed === true) {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      // If user has a company with a paid plan, skip plan selection and go to company form
      if (members.length > 0 && currentUser.company_id) {
        const userCompanies = await base44.entities.Company.filter({ id: currentUser.company_id });
        if (userCompanies.length > 0) {
          setCompany(userCompanies[0]);
          if (userCompanies[0].subscription_plan && userCompanies[0].subscription_plan !== 'trial') {
            setSelectedPlan(userCompanies[0].subscription_plan);
            setStep('company');
            setCheckingUser(false);
            return;
          }
        }
      }
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl('CompanyOnboarding'));
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!user || !companyData.companyName || !companyData.email) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCompanyOnboarding', {
        companyName: companyData.companyName,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zip: companyData.zip,
        subscriptionPlan: selectedPlan
      });

      if (response.data.success) {
        await base44.auth.updateMe({ onboarding_completed: true });

        // If paid plan, redirect to Stripe checkout
        if (selectedPlan !== 'trial') {
          const checkoutResponse = await base44.functions.invoke('createCheckoutSession', {
            price_id: response.data.price_id,
            company_id: response.data.company_id,
            subscription_plan: selectedPlan,
            promo_code: promoCode || undefined
          });

          if (checkoutResponse.data?.url) {
            window.location.href = checkoutResponse.data.url;
            return;
          }
        }

        // Trial plan - redirect to dashboard
        toast.success('Company created! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = createPageUrl('Dashboard');
        }, 500);
      } else {
        toast.error(response.data.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/26b3196de_image.png" alt="Base44" className="h-16 w-16 rounded-2xl object-contain mx-auto mb-4 bg-white" />
          <h1 className="text-2xl font-bold text-white">Home Watch 365</h1>
          <p className="text-slate-400 mt-1">Partners in Your Successful Home Watch Business</p>
        </div>

        <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl">
          {step === 'plan' && (
            <PlanSelectionStep 
              onContinue={(plan, promo) => {
                setSelectedPlan(plan);
                setPromoCode(promo);
                setStep('company');
              }}
              onSkip={() => {
                setSelectedPlan('trial');
                setStep('company');
              }}
              isLoading={loading}
            />
          )}

          {step === 'company' && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Create Your Company</CardTitle>
                <CardDescription>
                  Set up your estate management business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your Company Name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Company Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={companyData.state}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      value={companyData.zip}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, zip: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep('welcome')}
                    variant="outline"
                    disabled={loading}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateCompany}
                    disabled={loading || !companyData.companyName || !companyData.email}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Creating...' : 'Create Company'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}