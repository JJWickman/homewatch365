import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building, Link2, ExternalLink, Unlink, Save, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PageHeader from '@/components/shared/PageHeader';
import CompanyLogo from '@/components/settings/CompanyLogo';

export default function SettingsCompany() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    primary_color: '#1e3a5f',
    accent_color: '#c9a962',
    logo_url: '',
    google_business_url: '',
    facebook_business_url: '',
    yelp_business_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.primary_tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: user.primary_tenant_id });
        if (tenants.length > 0) {
          const t = tenants[0];
          setCompany(t);
          setCompanyForm({
            name: t.name || '',
            phone: t.phone || '',
            email: t.email || '',
            address: t.address || '',
            city: t.city || '',
            state: t.state || '',
            zip: t.zip || '',
            website: t.website || '',
            primary_color: t.primary_color || '#1e3a5f',
            accent_color: t.accent_color || '#c9a962',
            logo_url: t.logo_url || '',
            google_business_url: t.google_business_url || '',
            facebook_business_url: t.facebook_business_url || '',
            yelp_business_url: t.yelp_business_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    if (!company) return;
    
    setSaving(true);
    setSaveSuccess(false);
    try {
      await base44.entities.Tenant.update(company.id, companyForm);
      setCompany({ ...company, ...companyForm });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Company Settings"
        subtitle="Update your company information and branding"
      />

      <CompanyLogo
        company={company}
        companyForm={companyForm}
        setCompanyForm={setCompanyForm}
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={saveCompanySettings}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Update your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              value={companyForm.name}
              onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={companyForm.phone}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={companyForm.website}
              onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://"
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={companyForm.address}
              onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Label>City</Label>
              <Input
                value={companyForm.city}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={companyForm.state}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={companyForm.zip}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, zip: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="h-4 w-4" /> Saved!
              </div>
            )}
            <Button onClick={saveCompanySettings} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Integrations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Business Profiles
          </CardTitle>
          <CardDescription>Connect your business profiles for visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Business */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Google Business Profile</p>
              <p className="text-sm text-slate-500 truncate">
                {companyForm.google_business_url || 'Not connected'}
              </p>
            </div>
            {companyForm.google_business_url ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={companyForm.google_business_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCompanyForm(prev => ({ ...prev, google_business_url: '' }))}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
          {!companyForm.google_business_url && (
            <div className="ml-14">
              <Input
                placeholder="https://business.google.com/..."
                value={companyForm.google_business_url}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, google_business_url: e.target.value }))}
              />
            </div>
          )}

          {/* Facebook Business */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1877F2] to-[#0a66c2] flex items-center justify-center shrink-0 shadow-md">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Facebook Business Page</p>
              <p className="text-sm text-slate-500 truncate">
                {companyForm.facebook_business_url || 'Not connected'}
              </p>
            </div>
            {companyForm.facebook_business_url ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={companyForm.facebook_business_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCompanyForm(prev => ({ ...prev, facebook_business_url: '' }))}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
          {!companyForm.facebook_business_url && (
            <div className="ml-14">
              <Input
                placeholder="https://facebook.com/yourbusiness"
                value={companyForm.facebook_business_url}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, facebook_business_url: e.target.value }))}
              />
            </div>
          )}

          {/* Yelp Business */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-[#FF1A1A] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.686 1.459zm-5.025 3.152l4.942 1.606a1.072 1.072 0 0 1 .636 1.48 9.194 9.194 0 0 1-2.56 3.12 1.073 1.073 0 0 1-1.588-.263l-2.78-4.357c-.55-.86.253-1.923 1.35-1.586zm-3.555.617c.96.097 1.453 1.318.737 2.02l-3.68 3.615a1.072 1.072 0 0 1-1.6-.003 9.194 9.194 0 0 1-1.97-3.58 1.073 1.073 0 0 1 .845-1.387l5.668-.665zm-.18-4.596c.198.95-.81 1.73-1.63 1.176L5.19 10.55a1.072 1.072 0 0 1-.206-1.596 9.194 9.194 0 0 1 3.252-2.364 1.073 1.073 0 0 1 1.459.686l1.699 4.491zm-2.39-6.14l5.162 2.16c.9.38.9 1.68 0 2.06l-5.163 2.16a1.073 1.073 0 0 1-1.48-.637 9.194 9.194 0 0 1 0-5.107 1.073 1.073 0 0 1 1.48-.637z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Yelp Business Page</p>
              <p className="text-sm text-slate-500 truncate">
                {companyForm.yelp_business_url || 'Not connected'}
              </p>
            </div>
            {companyForm.yelp_business_url ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={companyForm.yelp_business_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCompanyForm(prev => ({ ...prev, yelp_business_url: '' }))}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
          {!companyForm.yelp_business_url && (
            <div className="ml-14">
              <Input
                placeholder="https://yelp.com/biz/yourbusiness"
                value={companyForm.yelp_business_url}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, yelp_business_url: e.target.value }))}
              />
            </div>
          )}

          <div className="pt-4 flex justify-end">
           <Button onClick={saveCompanySettings} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
             <Save className="h-4 w-4 mr-2" />
             {saving ? 'Saving...' : 'Save Profiles'}
           </Button>
          </div>
          </CardContent>
          </Card>


          </div>
          );
          }