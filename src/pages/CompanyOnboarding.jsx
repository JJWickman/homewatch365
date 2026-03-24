import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building, ArrowRight, Check, Loader2, Image as ImageIcon
} from 'lucide-react';
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
  
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [propertyData, setPropertyData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    propertyType: 'single_family'
  });

  const [skipFutureOnboarding, setSkipFutureOnboarding] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [promoCode, setPromoCode] = useState('');

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

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        if (currentUser.onboarding_completed === true) {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companies.length > 0) {
          setCompany(companies[0]);
        }
        setStep('complete');
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
    
    console.log('Creating company with plan:', selectedPlan);
    setLoading(true);
    try {
      const newCompany = await base44.entities.Company.create({
        name: companyData.companyName,
        slug: companyData.companyName.toLowerCase().replace(/\s+/g, '-'),
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zip: companyData.zip,
        subscription_plan: selectedPlan,
        subscription_status: selectedPlan === 'trial' ? 'trial' : 'active',
        trial_ends_at: selectedPlan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null
      });

      await base44.entities.CompanyMember.create({
        company_id: newCompany.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'administrator',
        access_level: 'admin',
        is_owner: true,
        is_active: true
      });

      await base44.auth.updateMe({ company_id: newCompany.id });

      await base44.functions.invoke('seedCompanyTemplates', { data: newCompany });

      setCompany(newCompany);
      setStep('client');
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!company || !clientData.firstName || !clientData.lastName || !clientData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Client.create({
        company_id: company.id,
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        is_active: true
      });

      setStep('property');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async () => {
    if (!company || !clientData.firstName || !propertyData.address || !propertyData.city || !propertyData.state) return;
    
    setLoading(true);
    try {
      const clients = await base44.entities.Client.filter({
        company_id: company.id,
        first_name: clientData.firstName,
        last_name: clientData.lastName
      });

      if (clients.length === 0) {
        throw new Error('Client not found');
      }

      await base44.entities.Property.create({
        company_id: company.id,
        client_id: clients[0].id,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip: propertyData.zip,
        property_type: propertyData.propertyType,
        status: 'occupied',
        is_active: true
      });

      setStep('complete');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to complete onboarding. Please try again.');
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
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-700 mb-4 border-2 border-dashed border-slate-500">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Your Company Name</h1>
          <p className="text-slate-400 mt-1">Property Management Platform</p>
        </div>

        <Card>
          {step === 'welcome' && (
            <div className="px-6 py-8">
              <PlanSelectionStep
                onContinue={(plan, promo) => {
                  console.log('Plan selected:', plan);
                  setSelectedPlan(plan);
                  setPromoCode(promo);
                  setStep('company');
                }}
                onSkip={() => {
                  console.log('Skipping plan selection');
                  setSelectedPlan('trial');
                  setStep('company');
                }}
                isLoading={loading}
              />
            </div>
          )}

          {step === 'company' && (
            <>
              <CardHeader>
                <CardTitle>Step 1: Create Your Company</CardTitle>
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
                  <p className="text-xs text-slate-500 mt-1">Required field</p>
                </div>

                <div>
                  <Label htmlFor="email">Company Email *</Label>
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
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </CardContent>
            </>
          )}

          {step === 'client' && (
            <>
              <CardHeader>
                <CardTitle>Step 2: Create Your First Client</CardTitle>
                <CardDescription>
                  Add a client to your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={clientData.firstName}
                    onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={clientData.lastName}
                    onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    value={clientData.phone}
                    onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep('company')}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('complete')}
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-700"
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={handleCreateClient}
                    disabled={loading || !clientData.firstName || !clientData.lastName || !clientData.email}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Creating...' : 'Continue'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 'complete' && (
            <>
              <CardHeader>
                <CardTitle className="text-center text-2xl">🎉 Congratulations!</CardTitle>
                <CardDescription className="text-center">
                  Your account is all set up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/1552114f9_CongratulationsLeomeme.jpg" 
                    alt="Congratulations" 
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-slate-900">You're ready to go!</p>
                  <p className="text-slate-600">Your company, first client, and property have been created. Let's get started managing properties.</p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                  <input
                    type="checkbox"
                    id="skipOnboarding"
                    checked={skipFutureOnboarding}
                    onChange={(e) => setSkipFutureOnboarding(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="skipOnboarding" className="text-sm text-slate-700 cursor-pointer">
                    Don't show onboarding on startup
                  </label>
                </div>
                <Button 
                  onClick={async () => {
                    if (skipFutureOnboarding && user) {
                      await base44.auth.updateMe({ onboarding_completed: true });
                    }
                    window.location.href = createPageUrl('Dashboard');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Take me to the Dashboard
                </Button>
              </CardContent>
            </>
          )}

          {step === 'property' && (
            <>
              <CardHeader>
                <CardTitle>Step 3: Create Your First Property</CardTitle>
                <CardDescription>
                  Add a property for your client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propName">Property Name</Label>
                  <Input
                    id="propName"
                    value={propertyData.name}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Beach House"
                  />
                </div>

                <div>
                  <Label htmlFor="propAddress">Address *</Label>
                  <Input
                    id="propAddress"
                    value={propertyData.address}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Ocean Ave"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="propCity">City *</Label>
                    <Input
                      id="propCity"
                      value={propertyData.city}
                      onChange={(e) => setPropertyData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propState">State *</Label>
                    <Input
                      id="propState"
                      value={propertyData.state}
                      onChange={(e) => setPropertyData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propZip">ZIP</Label>
                    <Input
                      id="propZip"
                      value={propertyData.zip}
                      onChange={(e) => setPropertyData(prev => ({ ...prev, zip: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="propType">Property Type</Label>
                  <select
                    id="propType"
                    value={propertyData.propertyType}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="single_family">Single Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="estate">Estate</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep('client')}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('complete')}
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-700"
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={handleCreateProperty}
                    disabled={loading || !propertyData.address || !propertyData.city || !propertyData.state}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Creating...' : 'Complete Onboarding'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          {[
            'Unlimited Properties',
            'Mobile Inspections',
            'Client Portal',
            'Auto Reports'
          ].map((feature) => (
            <div key={feature} className="flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}