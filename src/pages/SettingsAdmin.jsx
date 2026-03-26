import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Shield, MapPin, Mail, AlertCircle as AlertIcon, Loader2, Edit2, Plus, Trash2, MoreVertical, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import BillingEmailSection from '@/components/settings/BillingEmailSection';
import StripeConnectCard from '@/components/settings/StripeConnectCard';
import GeofencingSettings from '@/components/settings/GeofencingSettings';
import { createPageUrl } from '@/utils';

export default function SettingsAdmin() {
  const [company, setCompany] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [user, setUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'field_inspector',
    access_level: 'user',
    crm_marketing_access: false
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
        setCompanyMember(members[0]);
        const companyId = members[0].company_id;

        const [companies, staffData] = await Promise.all([
          base44.entities.Company.filter({ id: companyId }),
          base44.entities.CompanyMember.filter({ company_id: companyId })
        ]);

        if (companies.length > 0) setCompany(companies[0]);
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async () => {
    if (!inviteForm.email) {
      setInviteError('Email is required');
      return;
    }

    setInviting(true);
    setInviteError('');
    try {
      const inviteToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await base44.entities.Invitation.create({
        tenant_id: company?.id,
        invitee_email: inviteForm.email,
        inviter_email: user.email,
        token: inviteToken,
        role: inviteForm.role,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

      const appUrl = window.location.origin;
      const roleLabel = inviteForm.role === 'field_inspector' ? 'Reporter' : 
                       inviteForm.role === 'dispatcher' ? 'Dispatcher/Manager' : 'Administrator';
      const invitationUrl = `${appUrl}${createPageUrl('InvitationAccept')}?token=${invitation.token}`;

      const emailBody = `
Hello ${inviteForm.name || ''},

You've been invited to join ${company.name} as a ${roleLabel}.

Click the link below to accept the invitation and create your account:
${invitationUrl}

This link will expire in 7 days.

Best regards,
${company.name}
      `.trim();

      await base44.integrations.Core.SendEmail({
        from_name: 'Estate Watch 365',
        to: inviteForm.email,
        subject: `You've been invited to join ${company.name}`,
        body: emailBody
      });

      setShowInviteDialog(false);
      setInviteForm({ email: '', name: '', role: 'field_inspector', access_level: 'user', crm_marketing_access: false });
      toast.success('Invitation sent!');
      loadData();
    } catch (error) {
      console.error('Error inviting staff:', error);
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    try {
      await base44.entities.CompanyMember.update(editingMember.id, {
        user_name: editingMember.user_name,
        role: editingMember.role,
        access_level: editingMember.access_level,
        crm_marketing_access: editingMember.crm_marketing_access
      });
      setShowEditDialog(false);
      setEditingMember(null);
      await loadData();
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update team member: ' + error.message);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      await base44.entities.CompanyMember.delete(deletingMember.id);
      setShowDeleteDialog(false);
      setDeletingMember(null);
      loadData();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleSuspendMember = async (member) => {
    try {
      await base44.entities.CompanyMember.update(member.id, { 
        is_active: member.is_active === false ? true : false 
      });
      loadData();
    } catch (error) {
      console.error('Error suspending member:', error);
    }
  };

  const handleGeocodeAll = async () => {
    if (!window.confirm('This will add GPS coordinates to all properties that are missing them. This may take a few minutes. Continue?')) {
      return;
    }

    setGeocoding(true);
    try {
      const response = await base44.functions.invoke('geocodeAllProperties');
      if (response.data.results) {
        const { success, failed } = response.data.results;
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

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const isAdmin = companyMember?.role === 'administrator' || companyMember?.role === 'owner';
  const canManageStaff = isAdmin;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Administration"
        subtitle="Manage team, billing, and advanced settings"
      />

      {/* Billing Email */}
      {company && (
        <BillingEmailSection company={company} onUpdate={loadData} />
      )}

      {/* Stripe Connect */}
      {company && (
        <StripeConnectCard company={company} onRefresh={loadData} />
      )}

      {/* Team Members */}
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
            {staff.map((member) => (
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
                  {member.access_level === 'admin' && !member.is_owner && (
                    <Shield className="h-5 w-5 text-blue-600" title="Admin Access" />
                  )}
                  <Badge variant="outline" className="capitalize">
                    {member.role === 'field_inspector' ? 'Reporter' : 
                     member.role === 'dispatcher' ? 'Dispatcher/Manager' : 
                     'Administrator'}
                  </Badge>
                  {member.is_active === false && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                  {canManageStaff && member.user_email !== companyMember?.user_email && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingMember({ ...member });
                          setShowEditDialog(true);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSuspendMember(member)}
                          className={member.is_active === false ? "text-green-600" : "text-amber-600"}
                        >
                          {member.is_active === false ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Reactivate
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Suspend
                            </>
                          )}
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

      {/* Geofencing */}
      {company && (
        <GeofencingSettings
          company={company}
          onUpdate={(updated) => setCompany(updated)}
        />
      )}

      {/* Geocoding Tool */}
      <Card className="mt-6">
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

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your company</DialogDescription>
          </DialogHeader>

          {inviteError && (
            <Alert variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}

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
              <Label>Job Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(prev => ({ 
                  ...prev, 
                  role: value,
                  crm_marketing_access: value === 'administrator' ? true : prev.crm_marketing_access
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_inspector">Reporter</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher/Manager</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteStaff}
              disabled={!inviteForm.email || inviting}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Email</Label>
                <Input value={editingMember.user_email} disabled className="bg-slate-50" />
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
                <Label>Job Role</Label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value) => setEditingMember(prev => ({ 
                    ...prev, 
                    role: value,
                    crm_marketing_access: value === 'administrator' ? true : prev.crm_marketing_access
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_inspector">Reporter</SelectItem>
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
            <Button onClick={handleSaveEdit} className="bg-slate-900 hover:bg-slate-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingMember?.user_name || deletingMember?.user_email}?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}