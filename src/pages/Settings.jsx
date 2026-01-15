import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Settings as SettingsIcon, Building, Users, FileText, 
  Palette, Save, Upload, Plus, Trash2, User, Mail, Edit2, MoreVertical
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
  const [company, setCompany] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [staff, setStaff] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    logo_url: ''
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setCompanyMember(members[0]);
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
            logo_url: c.logo_url || ''
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

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

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
                <Button onClick={() => setShowInviteDialog(true)}>
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
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload Logo'}
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
                    <p className="text-xs text-slate-500 mt-2">Recommended: 200x200px PNG or SVG</p>
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