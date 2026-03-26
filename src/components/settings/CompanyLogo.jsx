import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Upload, Trash2, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyLogo({ company, companyForm, setCompanyForm, saving, saveSuccess, onSave }) {
  const [uploading, setUploading] = useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Logo & Branding
        </CardTitle>
        <CardDescription>Upload your company logo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : companyForm.logo_url ? 'Replace Logo' : 'Upload Logo'}
                    </span>
                  </Button>
                </Label>
                <input
                  id="logo-upload"
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

        <div className="pt-4 flex items-center justify-end gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <Check className="h-4 w-4" /> Saved!
            </div>
          )}
          <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}