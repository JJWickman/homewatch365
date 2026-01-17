import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit, AlertCircle, Loader2, Palette, Upload, Building, Save, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle as AlertIcon } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const DEFAULT_CONTRACTOR_TYPES = [
  'electrician',
  'hvac',
  'roofer',
  'plumber',
  'pool_service',
  'landscaping',
  'painter',
  'carpenter',
  'general_contractor',
  'pest_control',
  'cleaning',
  'security',
  'other'
];

export default function AdminConsole() {
  const [companyId, setCompanyId] = useState(null);
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [company, setCompany] = useState(null);
  const [customTypes, setCustomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ name: '', slug: '', description: '', is_active: true });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractingBranding, setExtractingBranding] = useState(false);
  const [extractWebsiteUrl, setExtractWebsiteUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    primary_color: '#1e3a5f',
    accent_color: '#c9a962',
    logo_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        const member = members[0];
        setCompanyMember(member);
        
        // Check if user is owner (admin)
        if (member.role !== 'owner') {
          setLoading(false);
          return;
        }

        const cId = member.company_id;
        setCompanyId(cId);

        const [customTypesData, companies] = await Promise.all([
          base44.entities.CustomContractorType.filter({ company_id: cId }),
          base44.entities.Company.filter({ id: cId })
        ]);
        
        setCustomTypes(customTypesData);
        
        if (companies.length > 0) {
          const c = companies[0];
          setCompany(c);
          setCompanyForm({
            name: c.name || '',
            primary_color: c.primary_color || '#1e3a5f',
            accent_color: c.accent_color || '#c9a962',
            logo_url: c.logo_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    setEditingTypeId(null);
    setTypeFormData({ name: '', slug: '', description: '', is_active: true });
    setShowNewTypeDialog(true);
  };

  const handleEditType = (type) => {
    setEditingTypeId(type.id);
    setTypeFormData(type);
    setShowNewTypeDialog(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  };

  const handleSaveType = async () => {
    if (!typeFormData.name.trim()) {
      return;
    }

    const slug = typeFormData.slug || generateSlug(typeFormData.name);

    try {
      if (editingTypeId) {
        await base44.entities.CustomContractorType.update(editingTypeId, {
          ...typeFormData,
          slug
        });
      } else {
        // Check for duplicates
        const exists = customTypes.some(t => t.slug === slug);
        if (exists) {
          alert('A contractor type with this name already exists');
          return;
        }

        await base44.entities.CustomContractorType.create({
          ...typeFormData,
          slug,
          company_id: companyId
        });
      }
      setShowNewTypeDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error saving contractor type:', error);
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm('Are you sure you want to delete this contractor type?')) {
      try {
        await base44.entities.CustomContractorType.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting contractor type:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTypes.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTypes.length} contractor type(s)?`)) {
      try {
        await Promise.all(selectedTypes.map(id => base44.entities.CustomContractorType.delete(id)));
        setSelectedTypes([]);
        await loadData();
      } catch (error) {
        console.error('Error deleting contractor types:', error);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedTypes.length === customTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(customTypes.map(t => t.id));
    }
  };

  const toggleSelectType = (id) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCompanyForm(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
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
      }
    } catch (error) {
      console.error('Error extracting branding:', error);
    } finally {
      setExtractingBranding(false);
    }
  };

  const saveCompanyBranding = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, companyForm);
      setCompany({ ...company, ...companyForm });
    } catch (error) {
      console.error('Error saving:', error);
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

  // Only allow owners (admins)
  if (!companyMember || companyMember.role !== 'owner') {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Admin Console"
          subtitle="Administrative tools and settings"
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Access Denied</p>
                <p className="text-sm text-amber-800 mt-1">Only administrators (owners) can access this console.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Console"
        subtitle="Manage system-wide settings and customizations"
      />

      <Tabs defaultValue="contractor-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contractor-types">Contractor Types</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        {/* Contractor Types Tab */}
        <TabsContent value="contractor-types" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contractor Types</CardTitle>
                  <CardDescription>Manage custom contractor types for your company</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTypes.length > 0 && (
                    <Button 
                      onClick={handleBulkDelete}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete ({selectedTypes.length})
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddType}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Type
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default Types Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Default Types Available</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CONTRACTOR_TYPES.map(type => (
                      <span key={type} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Types */}
                {customTypes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">Custom Types ({customTypes.length})</p>
                      {customTypes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTypes.length === customTypes.length}
                            onCheckedChange={toggleSelectAll}
                          />
                          <span className="text-xs text-slate-500">Select All</span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      {customTypes.map(type => (
                        <div key={type.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                          <Checkbox
                            checked={selectedTypes.includes(type.id)}
                            onCheckedChange={() => toggleSelectType(type.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{type.name}</p>
                            {type.description && (
                              <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">Slug: <code className="bg-slate-100 px-1 py-0.5 rounded">{type.slug}</code></p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs px-2 py-1 rounded ${type.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditType(type)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteType(type.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-6 text-sm">No custom contractor types added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Company Branding
              </CardTitle>
              <CardDescription>Customize your company's appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extract from Website */}
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

              {/* Logo */}
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
                        onChange={(e) => handleLogoUpload(e)}
                        className="hidden"
                      />
                      {companyForm.logo_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCompanyForm(prev => ({ 
                            ...prev, 
                            logo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/7e2dc0976_EstateIQFavIcon.png' 
                          }))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset to Default
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Recommended: 200x200px PNG or SVG</p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="color"
                      value={companyForm.primary_color}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={companyForm.primary_color}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-32"
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
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={companyForm.accent_color}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div className="mt-2 p-6 rounded-lg border" style={{ backgroundColor: companyForm.primary_color }}>
                  <div className="flex items-center gap-3">
                    {companyForm.logo_url ? (
                      <img src={companyForm.logo_url} alt="Logo" className="h-10 w-10 rounded" />
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
                <Button onClick={saveCompanyBranding} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New/Edit Contractor Type Dialog */}
      <Dialog open={showNewTypeDialog} onOpenChange={setShowNewTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTypeId ? 'Edit Contractor Type' : 'Add Contractor Type'}</DialogTitle>
            <DialogDescription>
              {editingTypeId ? 'Update the contractor type information' : 'Create a new custom contractor type'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type Name *</Label>
              <Input
                value={typeFormData.name}
                onChange={(e) => {
                  setTypeFormData({ 
                    ...typeFormData, 
                    name: e.target.value,
                    slug: !editingTypeId ? generateSlug(e.target.value) : typeFormData.slug
                  });
                }}
                placeholder="e.g., Roofing Specialist"
              />
            </div>

            <div>
              <Label>Slug (URL-friendly) *</Label>
              <Input
                value={typeFormData.slug}
                onChange={(e) => setTypeFormData({ ...typeFormData, slug: e.target.value })}
                placeholder="e.g., roofing_specialist"
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Used internally to identify the type</p>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={typeFormData.description}
                onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                placeholder="What does this contractor type do?"
                className="min-h-20"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={typeFormData.is_active}
                onChange={(e) => setTypeFormData({ ...typeFormData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="mb-0 text-sm">Active (available for selection)</Label>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowNewTypeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveType}
                disabled={!typeFormData.name.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {editingTypeId ? 'Update' : 'Add'} Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}