import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Settings as SettingsIcon, Building, Users, FileText, 
  Palette, Save, Upload, Plus, Trash2, User, Mail, Edit2, MoreVertical, Camera,
  Calendar, Copy, Check, ExternalLink, Link2, Unlink, Shield, Edit, AlertCircle as AlertIcon, Loader2,
  CreditCard, TrendingUp, Briefcase, Zap, X, Star, MessageCircle, MapPin, Lock
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
import PaymentMethodCard from '@/components/billing/PaymentMethodCard';
import FinancialManagement from '@/components/settings/FinancialManagement';
import PasswordResetDialog from '@/components/auth/PasswordResetDialog';
import UserManagementSection from '@/components/settings/UserManagementSection';

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
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [baseHqAddress, setBaseHqAddress] = useState({ address: '', city: '', state: '', zip: '' });
  const [homeAddress, setHomeAddress] = useState({ address: '', city: '', state: '', zip: '' });

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
    role: 'field_inspector'
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [calendarUrlCopied, setCalendarUrlCopied] = useState(false);
  const [customTypes, setCustomTypes] = useState([]);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ name: '', slug: '', description: '', is_active: true });
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [stripePrices, setStripePrices] = useState({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Helper function to check if user is admin (backward compatible)
  const isAdmin = companyMember?.role === 'administrator' || companyMember?.role === 'owner';
  const isDispatcherOrAdmin = isAdmin || companyMember?.role === 'dispatcher' || companyMember?.role === 'manager';

  useEffect(() => {
    loadData();
    loadStripePrices();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserEmail(currentUser.email || '');
      setUserPhone(currentUser.phone || '');
      setUserTimezone(currentUser.timezone || 'America/New_York');
      setBaseHqAddress(currentUser.base_hq_address || { address: '', city: '', state: '', zip: '' });
      setHomeAddress(currentUser.home_address || { address: '', city: '', state: '', zip: '' });
      
      // Load company member info
       const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
       if (members.length > 0) {
         setCompanyMember(members[0]);
         const fullName = members[0].user_name || '';
         const nameParts = fullName.split(' ');
         setUserFirstName(nameParts[0] || '');
         setUserLastName(nameParts.slice(1).join(' ') || '');
         setUserRole(members[0].role || 'field_inspector');
         const companyId = members[0].company_id;
        
        const [companies, staffData, templatesData, customTypesData] = await Promise.all([
          base44.entities.Company.filter({ id: companyId }),
          base44.entities.CompanyMember.filter({ company_id: companyId }),
          base44.entities.InspectionTemplate.filter({ company_id: companyId }),
          base44.entities.CustomContractorType.filter({ company_id: companyId })
        ]);
        
        setCustomTypes(customTypesData);
        
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
      const fullName = `${userFirstName} ${userLastName}`.trim();

      await base44.auth.updateMe({ 
        full_name: fullName,
        phone: userPhone,
        timezone: userTimezone,
        base_hq_address: baseHqAddress,
        home_address: homeAddress
      });

      // Update full name and role in CompanyMember
      if (companyMember) {
        await base44.entities.CompanyMember.update(companyMember.id, { 
          user_name: fullName,
          role: userRole 
        });

        // Trigger retroactive name update in all historical records
        try {
          await base44.functions.invoke('updateNameReferences', {
            user_email: userEmail,
            new_name: fullName,
            company_id: companyMember.company_id
          });
        } catch (error) {
          console.error('Warning: Could not update historical records:', error);
        }
      }

      setUser({ 
        ...user, 
        full_name: fullName,
        phone: userPhone,
        timezone: userTimezone,
        base_hq_address: baseHqAddress,
        home_address: homeAddress
      });
      // Refresh page to show updated data in layout
      window.location.reload();
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
        const appUrl = window.location.origin;
        await base44.integrations.Core.SendEmail({
          from_name: 'Estate Watch 365',
          to: inviteForm.email,
          subject: `You've been invited to join ${company.name}`,
          body: `
Hello ${inviteForm.name || ''},

You've been invited to join ${company.name} as a ${inviteForm.role === 'field_inspector' ? 'Field Inspector' : inviteForm.role === 'dispatcher' ? 'Dispatcher/Manager' : 'Administrator'}.

Click the link below to sign in:
${appUrl}

Best regards,
${company.name}
          `.trim()
        });
      }
      
      setShowInviteDialog(false);
      setInviteForm({ email: '', name: '', role: 'field_inspector' });
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

  const handleResendInvite = async (member) => {
    if (!company) return;

    try {
      const appUrl = window.location.origin;
      const roleLabel = member.role === 'field_inspector' ? 'Field Inspector' : 
                       member.role === 'dispatcher' ? 'Dispatcher/Manager' : 'Administrator';
      
      await base44.integrations.Core.SendEmail({
        from_name: 'Estate Watch 365',
        to: member.user_email,
        subject: `You've been invited to join ${company.name}`,
        body: `
Hello ${member.user_name || ''},

You've been invited to join ${company.name} as a ${roleLabel}.

Click the link below to sign in:
${appUrl}

Best regards,
${company.name}
        `.trim()
      });

      alert('Invitation sent to ' + member.user_email);
    } catch (error) {
      console.error('Error resending invite:', error);
      alert('Failed to resend invitation');
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const canManageStaff = isDispatcherOrAdmin;

  const PRICING_TIERS = [
    {
      id: 'solopreneur',
      name: 'Solopreneur',
      icon: Users,
      monthlyPrice: 99,
      annualPrice: 79,
      features: ['Unlimited Clients', 'Unlimited Properties', 'Inspections & Scheduling', 'Follow-ups & Tasks'],
      limits: { users: 1, admins: 1 }
    },
    {
      id: 'growth',
      name: 'Growth',
      icon: TrendingUp,
      monthlyPrice: 199,
      annualPrice: 159,
      popular: true,
      features: ['Everything in Solopreneur', 'Up to 5 Field Inspectors', '1 Admin User', 'Team Collaboration', 'Route Optimization'],
      limits: { users: 5, admins: 1 }
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Briefcase,
      monthlyPrice: 249,
      annualPrice: 199,
      features: ['Everything in Growth', 'Up to 10 Team Members', '2 Admin Users', 'Priority Support', 'Route Optimization'],
      limits: { users: 10, admins: 2 }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Shield,
      monthlyPrice: 499,
      annualPrice: 399,
      features: ['Everything in Professional', 'Up to 50 Team Members', '5 Admin Users', 'Contractor Management', 'Marketing Tools'],
      limits: { users: 50, admins: 5 }
    }
  ];

  const loadStripePrices = async () => {
    try {
      const response = await base44.functions.invoke('getStripePrices');
      if (response.data.success) {
        setStripePrices(response.data.prices);
      }
    } catch (error) {
      console.error('Error loading Stripe prices:', error);
    }
  };

  const handleSelectPlan = async (tierId) => {
    if (!company) return;
    
    setLoadingCheckout(true);
    try {
      const priceId = stripePrices[tierId]?.[billingCycle];
      
      if (!priceId) {
        alert('Payment system not configured. Please contact support.');
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        company_id: company.id,
        subscription_plan: tierId,
        billing_cycle: billingCycle
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };
  
  const DEFAULT_CONTRACTOR_TYPES = [
    'electrician', 'hvac', 'roofer', 'plumber', 'pool_service', 'landscaping', 
    'painter', 'carpenter', 'general_contractor', 'pest_control', 'cleaning', 'security', 'other'
  ];
  
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
    if (!typeFormData.name.trim()) return;

    const slug = typeFormData.slug || generateSlug(typeFormData.name);

    try {
      if (editingTypeId) {
        await base44.entities.CustomContractorType.update(editingTypeId, {
          ...typeFormData,
          slug
        });
      } else {
        const exists = customTypes.some(t => t.slug === slug);
        if (exists) {
          alert('A contractor type with this name already exists');
          return;
        }

        await base44.entities.CustomContractorType.create({
          ...typeFormData,
          slug,
          company_id: companyMember.company_id
        });
      }
      setShowNewTypeDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving contractor type:', error);
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm('Are you sure you want to delete this contractor type?')) {
      try {
        await base44.entities.CustomContractorType.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting contractor type:', error);
      }
    }
  };

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

  const handleGeocodeAll = async () => {
    if (!window.confirm('This will add GPS coordinates to all properties that are missing them. This may take a few minutes. Continue?')) {
      return;
    }

    setGeocoding(true);
    try {
      const response = await base44.functions.invoke('geocodeAllProperties');
      if (response.data.results) {
        const { success, failed, total } = response.data.results;
        if (failed > 0) {
          alert(`Geocoding complete!\n${success} properties updated successfully\n${failed} properties failed (check console for details)`);
        } else {
          alert(`Successfully geocoded ${success} properties!`);
        }
      }
    } catch (error) {
      console.error('Error geocoding properties:', error);
      alert('Failed to geocode properties. Please try again.');
    } finally {
      setGeocoding(false);
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
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your company settings and team"
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          {isDispatcherOrAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
          {(companyMember?.is_owner || companyMember?.role === 'owner') && <TabsTrigger value="billing">Billing</TabsTrigger>}
          {isAdmin && <TabsTrigger value="financial">Products & Services</TabsTrigger>}
          {isAdmin && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
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
                  <div className="flex gap-2 flex-shrink-0">
                    <Button 
                      onClick={() => setShowPasswordReset(true)} 
                      variant="outline"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-slate-900 hover:bg-slate-800">
                      <Save className="h-4 w-4 mr-2" />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  </div>
              </div>
              <div className="border-t pt-4">
                {companyMember?.is_owner && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <Shield className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900">Company Owner</p>
                      <p className="text-sm text-amber-700">You are the owner of this company and have billing access</p>
                    </div>
                  </div>
                )}
                {companyMember?.role === 'administrator' && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">Administrator</p>
                      <p className="text-sm text-blue-700">You have full administrative access to manage team and settings</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-first-name">First Name</Label>
                    <Input
                      id="user-first-name"
                      value={userFirstName}
                      onChange={(e) => setUserFirstName(e.target.value)}
                      placeholder="First name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-last-name">Last Name</Label>
                    <Input
                      id="user-last-name"
                      value={userLastName}
                      onChange={(e) => setUserLastName(e.target.value)}
                      placeholder="Last name"
                      className="mt-1"
                    />
                  </div>
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
                   <Label htmlFor="user-timezone">Timezone</Label>
                   <Select value={userTimezone} onValueChange={setUserTimezone}>
                     <SelectTrigger id="user-timezone" className="mt-1">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                       <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                       <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                       <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                       <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                       <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                       <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                       <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                       <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                       <SelectItem value="Asia/Singapore">Singapore Time (SGT)</SelectItem>
                       <SelectItem value="Australia/Sydney">Australian Eastern Time (AEDT)</SelectItem>
                       <SelectItem value="UTC">UTC</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 </div>
                 <div className="border-t pt-4">
                   <h3 className="text-lg font-semibold mb-4">Addresses for Route Optimization</h3>
                   
                   {/* Base HQ Address */}
                   <div className="mb-6">
                     <Label className="text-sm font-medium">Base HQ Address</Label>
                     <p className="text-xs text-slate-500 mb-3">Your main office location for route optimization</p>
                     <div className="space-y-3">
                       <Input
                         placeholder="Street address"
                         value={baseHqAddress.address}
                         onChange={(e) => setBaseHqAddress({ ...baseHqAddress, address: e.target.value })}
                         className="mt-1"
                       />
                       <div className="grid grid-cols-2 gap-3">
                         <Input
                           placeholder="City"
                           value={baseHqAddress.city}
                           onChange={(e) => setBaseHqAddress({ ...baseHqAddress, city: e.target.value })}
                         />
                         <Input
                           placeholder="State"
                           value={baseHqAddress.state}
                           onChange={(e) => setBaseHqAddress({ ...baseHqAddress, state: e.target.value })}
                           maxLength="2"
                         />
                       </div>
                       <Input
                         placeholder="ZIP code"
                         value={baseHqAddress.zip}
                         onChange={(e) => setBaseHqAddress({ ...baseHqAddress, zip: e.target.value })}
                       />
                     </div>
                   </div>

                   {/* Home Address */}
                   <div>
                     <Label className="text-sm font-medium">Home Address</Label>
                     <p className="text-xs text-slate-500 mb-3">Your home address for starting routes from home</p>
                     <div className="space-y-3">
                       <Input
                         placeholder="Street address"
                         value={homeAddress.address}
                         onChange={(e) => setHomeAddress({ ...homeAddress, address: e.target.value })}
                         className="mt-1"
                       />
                       <div className="grid grid-cols-2 gap-3">
                         <Input
                           placeholder="City"
                           value={homeAddress.city}
                           onChange={(e) => setHomeAddress({ ...homeAddress, city: e.target.value })}
                         />
                         <Input
                           placeholder="State"
                           value={homeAddress.state}
                           onChange={(e) => setHomeAddress({ ...homeAddress, state: e.target.value })}
                           maxLength="2"
                         />
                       </div>
                       <Input
                         placeholder="ZIP code"
                         value={homeAddress.zip}
                         onChange={(e) => setHomeAddress({ ...homeAddress, zip: e.target.value })}
                       />
                     </div>
                   </div>
                   {companyMember && (
                     <div>
                       <Label className="text-sm text-slate-500">Role</Label>
                       <p className="font-medium capitalize">
                         {companyMember.role === 'field_inspector' ? 'Field Inspector' : 
                          companyMember.role === 'dispatcher' ? 'Dispatcher/Manager' : 
                          'Administrator'}
                         {companyMember.is_owner && <span className="ml-2 text-amber-600">(Owner)</span>}
                       </p>
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
                       {member.is_owner && (
                         <Shield className="h-5 w-5 text-amber-600" title="Company Owner" />
                       )}
                       {member.role === 'administrator' && (
                         <Shield className="h-5 w-5 text-blue-600" title="Administrator" />
                       )}
                       <Badge variant="outline" className="capitalize">
                         {member.role === 'field_inspector' ? 'Field Inspector' : 
                          member.role === 'dispatcher' ? 'Dispatcher/Manager' : 
                          'Administrator'}
                       </Badge>
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
                            <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
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

        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan & Trial Status */}
          {company?.subscription_status === 'trial' && company.trial_ends_at && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Free Trial Active</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.ceil((new Date(company.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                      Trial ends {new Date(company.trial_ends_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-600 text-white">Free Trial</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {company?.subscription_status === 'active' && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Current Plan</p>
                    <p className="text-2xl font-bold capitalize text-slate-900">
                      {PRICING_TIERS.find(t => t.id === company.subscription_plan)?.name || company.subscription_plan}
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white">Active</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Cycle Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <div className="inline-flex items-center rounded-lg border p-1">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'annual'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Annual
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <PaymentMethodCard company={company} />

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    
                    <div className="mt-4">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-slate-500 ml-2">/mo</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-sm text-green-600 mt-2">
                          Save ${(tier.monthlyPrice * 12) - (tier.annualPrice * 12)}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-5 w-5 text-green-600 shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handleSelectPlan(tier.id)}
                      disabled={isCurrentPlan || loadingCheckout}
                      className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                      {loadingCheckout ? 'Loading...' : (isCurrentPlan ? 'Current Plan' : company?.subscription_status === 'trial' ? 'Start Subscription' : 'Subscribe Now')}
                    </Button>
                    {company?.subscription_status === 'trial' && !isCurrentPlan && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        14-day free trial included
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="financial">
           <FinancialManagement companyId={company?.id} />
         </TabsContent>

         <TabsContent value="users">
           <UserManagementSection staff={staff} company={company} />
         </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {/* Reviews Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Customer Reviews
              </CardTitle>
              <CardDescription>Monitor and manage reviews across platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Reviews */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-6 w-6">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Google Reviews</h3>
                      <p className="text-sm text-slate-500">From your Google Business Profile</p>
                    </div>
                  </div>
                  {companyForm.google_business_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={companyForm.google_business_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Not configured</span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center text-sm text-slate-600">
                  <p className="mb-2">Connect your Google Business Profile in Company settings to display reviews here.</p>
                  {!companyForm.google_business_url && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl('Settings')} onClick={() => document.querySelector('[value="company"]')?.click()}>
                        Configure Google Profile
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Yelp Reviews */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#FF1A1A] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white fill-current">
                        <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.686 1.459zm-5.025 3.152l4.942 1.606a1.072 1.072 0 0 1 .636 1.48 9.194 9.194 0 0 1-2.56 3.12 1.073 1.073 0 0 1-1.588-.263l-2.78-4.357c-.55-.86.253-1.923 1.35-1.586zm-3.555.617c.96.097 1.453 1.318.737 2.02l-3.68 3.615a1.072 1.072 0 0 1-1.6-.003 9.194 9.194 0 0 1-1.97-3.58 1.073 1.073 0 0 1 .845-1.387l5.668-.665zm-.18-4.596c.198.95-.81 1.73-1.63 1.176L5.19 10.55a1.072 1.072 0 0 1-.206-1.596 9.194 9.194 0 0 1 3.252-2.364 1.073 1.073 0 0 1 1.459.686l1.699 4.491zm-2.39-6.14l5.162 2.16c.9.38.9 1.68 0 2.06l-5.163 2.16a1.073 1.073 0 0 1-1.48-.637 9.194 9.194 0 0 1 0-5.107 1.073 1.073 0 0 1 1.48-.637z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Yelp Reviews</h3>
                      <p className="text-sm text-slate-500">From your Yelp Business Page</p>
                    </div>
                  </div>
                  {companyForm.yelp_business_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={companyForm.yelp_business_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Not configured</span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center text-sm text-slate-600">
                  <p className="mb-2">Connect your Yelp Business Page in Company settings to display reviews here.</p>
                  {!companyForm.yelp_business_url && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl('Settings')} onClick={() => document.querySelector('[value="company"]')?.click()}>
                        Configure Yelp Page
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Facebook Reviews */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white fill-current">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Facebook Reviews</h3>
                      <p className="text-sm text-slate-500">From your Facebook Business Page</p>
                    </div>
                  </div>
                  {companyForm.facebook_business_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={companyForm.facebook_business_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Not configured</span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center text-sm text-slate-600">
                  <p className="mb-2">Connect your Facebook Business Page in Company settings to display reviews here.</p>
                  {!companyForm.facebook_business_url && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={createPageUrl('Settings')} onClick={() => document.querySelector('[value="company"]')?.click()}>
                        Configure Facebook Page
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Review Integration Coming Soon</p>
                    <p className="text-blue-700 mt-1">To display live reviews from these platforms, configure your business profiles in the Company settings tab and set up the necessary API integrations.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          {/* Geocoding Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Geocoding
              </CardTitle>
              <CardDescription>Add GPS coordinates to properties for maps and route optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">What is geocoding?</p>
                    <p className="text-blue-700 mt-1">Geocoding converts property addresses into GPS coordinates (latitude/longitude). This enables:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                      <li>Property location maps</li>
                      <li>Route optimization for field inspectors</li>
                      <li>Distance calculations and proximity features</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Geocode All Properties</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Automatically add GPS coordinates to all properties that don't have them
                  </p>
                </div>
                <Button
                  onClick={handleGeocodeAll}
                  disabled={geocoding}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  {geocoding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Geocoding...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Geocode All
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Note: New properties are automatically geocoded when created. This tool is for existing properties that may be missing coordinates.
              </p>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Company Branding
              </CardTitle>
              <CardDescription>Customize your company's appearance</CardDescription>
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
                      <Label htmlFor="logo-upload-admin" className="cursor-pointer">
                        <Button variant="outline" size="sm" disabled={uploading} asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : companyForm.logo_url ? 'Replace Logo' : 'Upload Logo'}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="logo-upload-admin"
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
                          Reset to Default
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Recommended: 200x200px PNG or SVG</p>
                  </div>
                </div>
              </div>

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
                  {saving ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
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
                  <SelectItem value="field_inspector">Field Inspector</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher/Manager</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
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
                    <SelectItem value="field_inspector">Field Inspector</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher/Manager</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
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

      {/* Contractor Type Dialog */}
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

      {/* Password Reset Dialog */}
       <PasswordResetDialog 
         open={showPasswordReset} 
         onOpenChange={setShowPasswordReset}
         userEmail={user?.email}
       />

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