import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, X, Shield, Users, Briefcase, TrendingUp, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';

const PRICING_TIERS = [
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    icon: Users,
    description: 'Perfect for individual property managers',
    monthlyPrice: 99,
    annualPrice: 79, // 20% discount
    features: [
      { name: 'Unlimited Clients', included: true },
      { name: 'Unlimited Properties', included: true },
      { name: 'Inspections & Scheduling', included: true },
      { name: 'Follow-ups & Tasks', included: true },
      { name: 'Mobile App Access', included: true },
      { name: 'Additional Users', included: false },
      { name: 'Contractor Management', included: false },
      { name: 'Marketing Tools', included: false },
    ],
    limits: {
      users: 1,
      admins: 1
    }
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: TrendingUp,
    description: 'For growing teams',
    monthlyPrice: 199,
    annualPrice: 159, // 20% discount
    popular: true,
    features: [
      { name: 'Everything in Solopreneur', included: true },
      { name: 'Up to 5 Field Inspectors', included: true },
      { name: '1 Admin User', included: true },
      { name: 'Team Collaboration', included: true },
      { name: 'Advanced Reporting', included: true },
      { name: 'Route Optimization', included: true },
      { name: 'Contractor Management', included: false },
      { name: 'Marketing Tools', included: false },
    ],
    limits: {
      users: 5,
      admins: 1
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Briefcase,
    description: 'For established businesses',
    monthlyPrice: 249,
    annualPrice: 199, // 20% discount
    features: [
      { name: 'Everything in Growth', included: true },
      { name: 'Up to 10 Team Members', included: true },
      { name: '2 Admin Users', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Route Optimization', included: true },
      { name: 'Contractor Management', included: false },
      { name: 'Marketing Tools', included: false },
    ],
    limits: {
      users: 10,
      admins: 2
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    description: 'For large operations',
    monthlyPrice: 499,
    annualPrice: 399, // 20% discount
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Up to 50 Team Members', included: true },
      { name: '5 Admin Users', included: true },
      { name: 'Contractor Management', included: true },
      { name: 'Marketing Tools & Campaigns', included: true },
      { name: 'Dedicated Support', included: true },
      { name: 'Custom Integrations', included: true },
    ],
    limits: {
      users: 50,
      admins: 5
    }
  }
];

export default function Pricing() {
  const [company, setCompany] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setCompanyMember(members[0]);
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companies.length > 0) {
          setCompany(companies[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [stripePrices, setStripePrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);

  useEffect(() => {
    loadStripePrices();
  }, []);

  const loadStripePrices = async () => {
    setPricesLoading(true);
    setPricesError(null);
    try {
      const response = await base44.functions.invoke('getStripePrices');
      if (response.data.success && response.data.prices) {
        setStripePrices(response.data.prices);
      } else {
        setPricesError('Failed to load pricing');
      }
    } catch (error) {
      console.error('Error loading Stripe prices:', error);
      setPricesError('Failed to load pricing information');
    } finally {
      setPricesLoading(false);
    }
  };

  const getPriceId = (tierId) => {
    // Map UI plan IDs to Stripe price keys
    const priceKeyMap = {
      solopreneur: 'solopreneur_crm',
      growth: 'growth_crm',
      professional: 'professional_crm',
      enterprise: 'enterprise'
    };
    const priceKey = priceKeyMap[tierId];
    return stripePrices[priceKey]?.[billingCycle];
  };

  const handleSelectPlan = async (tierId) => {
    if (!company) {
      console.error('No company found');
      return;
    }
    
    setLoadingCheckout(true);
    try {
      const priceId = getPriceId(tierId);
      
      if (!priceId) {
        alert('Unable to load pricing information. Please refresh the page and try again.');
        setLoadingCheckout(false);
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        company_id: company.id,
        subscription_plan: tierId,
        billing_cycle: billingCycle,
        return_url: `${window.location.origin}/Settings?tab=billing`
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(`Failed to start checkout: ${error.message || 'Please try again.'}`);
      setLoadingCheckout(false);
    }
  };

  const calculateSavings = (tier) => {
    const annualTotal = tier.annualPrice * 12;
    const monthlyTotal = tier.monthlyPrice * 12;
    return monthlyTotal - annualTotal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const isOwner = companyMember?.is_owner || companyMember?.role === 'owner' || companyMember?.role === 'administrator';

  return (
    <div>
      <PageHeader
        title="Pricing Plans"
        subtitle="Choose the perfect plan for your business"
      />

      {/* Current Plan Badge */}
      {company?.subscription_plan && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Current Plan</p>
                <p className="text-2xl font-bold capitalize text-slate-900">
                  {PRICING_TIERS.find(t => t.id === company.subscription_plan)?.name || company.subscription_plan}
                </p>
              </div>
              <Badge className="bg-blue-600 text-white">
                {company.subscription_status === 'trial' ? 'Trial' : 'Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {PRICING_TIERS.map((tier) => {
          const TierIcon = tier.icon;
          const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
          const isCurrentPlan = company?.subscription_plan === tier.id;
          
          return (
            <Card 
              key={tier.id}
              className={`relative ${tier.popular ? 'border-2 border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white">Current Plan</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <TierIcon className="h-6 w-6 text-slate-700" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="min-h-12">{tier.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-slate-500 ml-2">/{billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 mt-2">
                      Save ${calculateSavings(tier)}/year
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {isOwner && (
                   <Button 
                     onClick={() => handleSelectPlan(tier.id)}
                     disabled={isCurrentPlan || loadingCheckout}
                     className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                   >
                     {loadingCheckout ? 'Loading...' : (isCurrentPlan ? 'Current Plan' : 'Subscribe')}
                   </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Detailed breakdown of features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Feature</th>
                  {PRICING_TIERS.map(tier => (
                    <th key={tier.id} className="text-center py-3 px-4 font-medium">{tier.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Users Included</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4 text-sm">{tier.limits.users}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Admin Users</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4 text-sm">{tier.limits.admins}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Client Management</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Property Management</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Inspections</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">Contractor Management</td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.id === 'enterprise' ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                   <td className="py-3 px-4 text-sm">Route Optimization</td>
                   {PRICING_TIERS.map(tier => (
                     <td key={tier.id} className="text-center py-3 px-4">
                       {tier.id === 'growth' || tier.id === 'professional' || tier.id === 'enterprise' ? (
                         <Check className="h-5 w-5 text-green-600 mx-auto" />
                       ) : (
                         <X className="h-5 w-5 text-slate-300 mx-auto" />
                       )}
                     </td>
                   ))}
                 </tr>
                 <tr className="border-b">
                   <td className="py-3 px-4 text-sm">Marketing Tools</td>
                   {PRICING_TIERS.map(tier => (
                     <td key={tier.id} className="text-center py-3 px-4">
                       {tier.id === 'enterprise' ? (
                         <Check className="h-5 w-5 text-green-600 mx-auto" />
                       ) : (
                         <X className="h-5 w-5 text-slate-300 mx-auto" />
                       )}
                     </td>
                   ))}
                 </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isOwner && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900">
              Only company owners can change subscription plans. Contact your administrator to upgrade or downgrade your plan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}