import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Building, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandingSettings({ company, companyForm, setCompanyForm, onSave, saving }) {
  const [uploading, setUploading] = useState(false);
  const [extractingBranding, setExtractingBranding] = useState(false);
  const [extractWebsiteUrl, setExtractWebsiteUrl] = useState('');

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCompanyForm(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleExtractBranding = async () => {
    if (!extractWebsiteUrl) return;
    setExtractingBranding(true);
    try {
      const response = await base44.functions.invoke('extractBrandingFromWebsite', {
        website_url: extractWebsiteUrl
      });
      if (response.data.success) {
        const updates = {};
        if (response.data.logo_url) updates.logo_url = response.data.logo_url;
        if (response.data.primary_color) updates.primary_color = response.data.primary_color;
        if (response.data.accent_color) updates.accent_color = response.data.accent_color;
        setCompanyForm(prev => ({ ...prev, ...updates }));
        toast.success('Branding extracted successfully');
      }
    } catch (error) {
      toast.error('Failed to extract branding');
    } finally {
      setExtractingBranding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Company Branding
        </CardTitle>
        <CardDescription>Customize your company's logo and colors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Auto-Extract from Website</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="https://yourwebsite.com"
              value={extractWebsiteUrl}
              onChange={(e) => setExtractWebsiteUrl(e.target.value)}
            />
            <Button
              onClick={handleExtractBranding}
              disabled={!extractWebsiteUrl || extractingBranding}
              variant="outline"
            >
              {extractingBranding ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Automatically extract logo (favicon) and colors from your website
          </p>
        </div>

        <div>
          <Label>Company Logo</Label>
          <div className="flex items-center gap-6 mt-2">
            <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {companyForm.logo_url ? (
                <img src={companyForm.logo_url} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="logo-upload-branding" className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : companyForm.logo_url ? 'Replace Logo' : 'Upload Logo'}
                    </span>
                  </Button>
                </Label>
                <input
                  id="logo-upload-branding"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {companyForm.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompanyForm(prev => ({ ...prev, logo_url: '' }))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">Recommended: 200x200px PNG or SVG</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={companyForm.primary_color}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                className="h-10 w-14 rounded border cursor-pointer flex-shrink-0"
              />
              <Input
                value={companyForm.primary_color}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                className="flex-1 max-w-[200px]"
              />
            </div>
          </div>
          <div>
            <Label>Accent Color</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={companyForm.accent_color}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, accent_color: e.target.value }))}
                className="h-10 w-14 rounded border cursor-pointer flex-shrink-0"
              />
              <Input
                value={companyForm.accent_color}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, accent_color: e.target.value }))}
                className="flex-1 max-w-[200px]"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Preview</Label>
          <div className="mt-2 p-6 rounded-lg border" style={{ backgroundColor: companyForm.primary_color }}>
            <div className="flex items-center gap-3">
              {companyForm.logo_url ? (
                <img src={companyForm.logo_url} alt="Logo" className="h-10 w-10 rounded object-contain" />
              ) : (
                <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="text-white font-semibold">{companyForm.name || 'Your Company'}</span>
            </div>
            <Button className="mt-4" style={{ backgroundColor: companyForm.accent_color, color: '#000' }}>
              Sample Button
            </Button>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}