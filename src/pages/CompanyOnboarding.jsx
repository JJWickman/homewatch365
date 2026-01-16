import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building, ArrowRight, Check, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    checkExistingCompany();
  }, []);

  const checkExistingCompany = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check if user already has a company
      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
    } catch (error) {
      // User not logged in - redirect to login
      base44.auth.redirectToLogin(createPageUrl('CompanyOnboarding'));
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.companyName) return;
    
    setLoading(true);
    try {
      // Create company
      const slug = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const company = await base44.entities.Company.create({
        name: formData.companyName,
        slug: slug + '-' + Date.now().toString(36),
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        logo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/7e2dc0976_EstateIQFavIcon.png',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      });

      // Create company member (owner)
      await base44.entities.CompanyMember.create({
        company_id: company.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'owner',
        is_active: true,
        can_manage_clients: true,
        can_manage_staff: true,
        can_manage_billing: true
      });

      // Create default inspection template
      await base44.entities.InspectionTemplate.create({
        company_id: company.id,
        name: 'Standard Weekly Inspection',
        description: 'Default template for routine property inspections',
        type: 'routine',
        is_default: true,
        is_active: true,
        sections: [
          {
            name: 'Exterior',
            order: 1,
            items: [
              { name: 'Front entrance & doors', check_type: 'pass_fail', requires_photo: true, order: 1 },
              { name: 'Windows & screens', check_type: 'pass_fail', requires_photo: false, order: 2 },
              { name: 'Landscaping condition', check_type: 'pass_fail', requires_photo: true, order: 3 },
              { name: 'Pool/spa (if applicable)', check_type: 'pass_fail', requires_photo: true, order: 4 },
              { name: 'Gutters & drainage', check_type: 'pass_fail', requires_photo: false, order: 5 }
            ]
          },
          {
            name: 'Interior - Main Areas',
            order: 2,
            items: [
              { name: 'Foyer/entry', check_type: 'pass_fail', requires_photo: true, order: 1 },
              { name: 'Living areas', check_type: 'pass_fail', requires_photo: true, order: 2 },
              { name: 'Kitchen appliances', check_type: 'yes_no', requires_photo: false, order: 3 },
              { name: 'Refrigerator/freezer', check_type: 'pass_fail', requires_photo: false, order: 4 },
              { name: 'Pest inspection', check_type: 'yes_no', requires_photo: false, order: 5 }
            ]
          },
          {
            name: 'Systems & Utilities',
            order: 3,
            items: [
              { name: 'HVAC operation', check_type: 'pass_fail', requires_photo: false, order: 1 },
              { name: 'Thermostat setting', check_type: 'text', requires_photo: false, order: 2 },
              { name: 'Water heater', check_type: 'pass_fail', requires_photo: false, order: 3 },
              { name: 'Plumbing - no leaks', check_type: 'yes_no', requires_photo: false, order: 4 },
              { name: 'Smoke/CO detectors', check_type: 'pass_fail', requires_photo: false, order: 5 }
            ]
          }
        ]
      });

      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error creating company:', error);
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500 mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Estate Watch</h1>
          <p className="text-slate-400 mt-1">Property Management Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Company</CardTitle>
            <CardDescription>
              Set up your estate concierge business in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.companyName}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Company'}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Start your 14-day free trial. No credit card required.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
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