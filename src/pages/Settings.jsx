import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Settings as SettingsIcon, Building, Users, FileText, 
  Palette, Save, Upload, Plus, Trash2, User, Mail, Edit2, MoreVertical, Camera,
  Calendar, Copy, Check, ExternalLink, Link2, Unlink, Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [staff, setStaff] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractingBranding, setExtractingBranding] = useState(false);
  const [extractWebsiteUrl, setExtractWebsiteUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('');

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

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'technician'
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [calendarUrlCopied, setCalendarUrlCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserEmail(currentUser.email || '');
      setUserPhone(currentUser.phone || '');
      
      // Load company member info
       const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
       if (members.length > 0) {
         setCompanyMember(members[0]);
         setUserFullName(members[0].user_name || '');
         setUserRole(members[0].role || 'technician');
         const companyId = members[0].company_id;
        
        const [companies, staffData, templatesData] = await Promise.all([
          base44.entities.Company.filter({ id: companyId }),
          base44.entities.CompanyMember.filter({ company_id: companyId }),
          base44.entities.InspectionTemplate.filter({ company_id: companyId })
        ]);
        
        if (companies.length > 0) {
          const c = companies[0];
          setCompany(c);
          setCompanyForm({
            name: c.name || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            zip: c.zip || '',
            website: c.website || '',
            primary_color: c.primary_color || '#1e3a5f',
            accent_color: c.accent_color || '#c9a962',
            logo_url: c.logo_url || '',
            google_business_url: c.google_business_url || '',
            facebook_business_url: c.facebook_business_url || '',
            yelp_business_url: c.yelp_business_url || ''
          });
        }
        
        setStaff(staffData);
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      setUser({ ...user, avatar_url: file_url });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    } finally {
      setUploading(false);
    }
  };

  const navigate = useNavigate();

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await base44.auth.updateMe({ 
        phone: userPhone
      });
      
      // Update full name and role in CompanyMember
      if (companyMember) {
        await base44.entities.CompanyMember.update(companyMember.id, { 
          user_name: userFullName,
          role: userRole 
        });
      }
      
      setUser({ 
        ...user, 
        full_name: userFullName,
        phone: userPhone
      });
      // Refresh page to show updated data in layout
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile changes');
    } finally {
      setSavingProfile(false);
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

  const saveCompanySettings = async () => {
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

  const handleInviteStaff = async () => {
    if (!company || !inviteForm.email) return;

    try {
      // Check if member already exists
      const existing = await base44.entities.CompanyMember.filter({ 
        company_id: company.id, 
        user_email: inviteForm.email 
      });
      
      if (existing.length === 0) {
        await base44.entities.CompanyMember.create({
          company_id: company.id,
          user_email: inviteForm.email,
          user_name: inviteForm.name,
          role: inviteForm.role,
          is_active: true
        });
        
        // Send invite email
        await base44.integrations.Core.SendEmail({
          to: inviteForm.email,
          subject: `You've been invited to join ${company.name}`,
          body: `
Hello ${inviteForm.name || ''},

You've been invited to join ${company.name} as a ${inviteForm.role}.

Please log in to access your account.

Best regards,
${company.name}
          `.trim()
        });
      }
      
      setShowInviteDialog(false);
      setInviteForm({ email: '', name: '', role: 'technician' });
      loadData();
    } catch (error) {
      console.error('Error inviting staff:', error);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember({
      id: member.id,
      user_name: member.user_name || '',
      user_email: member.user_email,
      role: member.role
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    
    try {
      await base44.entities.CompanyMember.update(editingMember.id, {
        user_name: editingMember.user_name,
        role: editingMember.role
      });
      setShowEditDialog(false);
      setEditingMember(null);
      loadData();
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    
    try {
      await base44.entities.CompanyMember.update(deletingMember.id, { is_active: false });
      setShowDeleteDialog(false);
      setDeletingMember(null);
      loadData();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const canManageStaff = companyMember?.role === 'owner' || companyMember?.can_manage_staff;

  // Generate calendar subscription URL
  const getCalendarUrl = () => {
    if (!user?.email) return '';
    const token = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/calendarFeed?email=${encodeURIComponent(user.email)}&token=${token}`;
  };

  const copyCalendarUrl = () => {
    navigator.clipboard.writeText(getCalendarUrl());
    setCalendarUrlCopied(true);
    setTimeout(() => setCalendarUrlCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your company settings and team"
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          {userRole === 'owner' && (
            <TabsTrigger value="admin">Admin Console</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Profile Picture</Label>
                <div className="flex items-start justify-between gap-6 mt-2">
                  <div className="flex items-start gap-6">
                    <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="profile-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" disabled={uploading} asChild>
                          <span>
                            <Camera className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF (Max 5MB)</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-slate-900 hover:bg-slate-800 flex-shrink-0">
                    <Save className="h-4 w-4 mr-2" />
                    {savingProfile ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
              <div className="border-t pt-4">
                {userRole === 'owner' && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">Administrator</p>
                      <p className="text-sm text-blue-700">You have full administrative access to this company</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                <div>
                  <Label htmlFor="user-full-name">Full Name</Label>
                  <Input
                    id="user-full-name"
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="user-phone">Mobile Phone</Label>
                  <Input
                    id="user-phone"
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Security Role</Label>
                  <select
                    id="user-role"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="technician">Technician (View only)</option>
                    <option value="manager">Manager (Can manage clients & staff)</option>
                    <option value="owner">Owner (Full administrative access)</option>
                  </select>
                </div>
                  {companyMember && (
                    <div>
                      <Label className="text-sm text-slate-500">Role</Label>
                      <p className="font-medium capitalize">{companyMember.role}</p>
                    </div>
                  )}
                </div>
                </div>
            </CardContent>
          </Card>

          {/* Calendar Sync */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Sync
              </CardTitle>
              <CardDescription>
                Subscribe to your schedule in your favorite calendar app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Add your inspections and tasks to Outlook, Apple Calendar, Google Calendar, or any app that supports calendar subscriptions.
              </p>
              
              <div>
                <Label>Subscription URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={getCalendarUrl()} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" onClick={copyCalendarUrl}>
                    {calendarUrlCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">How to subscribe:</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>Apple Calendar:</strong> File → New Calendar Subscription → paste URL</p>
                  <p><strong>Outlook:</strong> Add Calendar → Subscribe from web → paste URL</p>
                  <p><strong>Google Calendar:</strong> Other calendars (+) → From URL → paste URL</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2">
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

              <div className="pt-4 flex justify-end">
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
                Business Integrations
              </CardTitle>
              <CardDescription>Connect your business profiles for better visibility</CardDescription>
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
                <div className="h-10 w-10 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
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
                  {saving ? 'Saving...' : 'Save Integrations'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage staff access and roles</CardDescription>
              </div>
              {canManageStaff && (
                <Button onClick={() => setShowInviteDialog(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.filter(m => m.is_active).map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-slate-900 text-white">
                          {getInitials(member.user_name, member.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user_name || member.user_email}</p>
                        <p className="text-sm text-slate-500">{member.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {member.role === 'owner' && (
                         <Shield className="h-5 w-5 text-blue-600" title="Administrator" />
                       )}
                       <Badge variant="outline" className="capitalize">{member.role}</Badge>
                       {canManageStaff && member.user_email !== companyMember?.user_email && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setDeletingMember(member);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
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
                  Automatically extract logo and colors from your website
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
                        onChange={handleLogoUpload}
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
                          Remove
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
                <Button onClick={saveCompanySettings} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Console
              </CardTitle>
              <CardDescription>Advanced system administration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(createPageUrl('AdminConsole'))}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Open Admin Console
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your company
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={inviteForm.name}
                onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteStaff}
              disabled={!inviteForm.email}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingMember.user_email}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={editingMember.user_name}
                  onChange={(e) => setEditingMember(prev => ({ ...prev, user_name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value) => setEditingMember(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingMember?.user_name || deletingMember?.user_email} from your team?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteMember}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}