import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { User, Lock, Camera, Save, Check, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/shared/PageHeader';
import PasswordResetDialog from '@/components/auth/PasswordResetDialog';
import { Shield } from 'lucide-react';

export default function SettingsProfile() {
  const [user, setUser] = useState(null);
  const [tenantUser, setTenantUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [calendarUrlCopied, setCalendarUrlCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCertificationBadge, setShowCertificationBadge] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserEmail(currentUser.email || '');
      setUserPhone(currentUser.phone || '');
      setUserTimezone(currentUser.timezone || 'America/New_York');
      setUserFirstName(currentUser.first_name || '');
      setUserLastName(currentUser.last_name || '');
      setShowCertificationBadge(currentUser.show_certification_badge || false);

      // Load TenantUser for role display
      const tenantUsers = await base44.entities.TenantUser.filter({
        user_id: currentUser.id,
        tenant_id: currentUser.primary_tenant_id
      });
      if (tenantUsers.length > 0) {
        setTenantUser(tenantUsers[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
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
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
       first_name: userFirstName,
       last_name: userLastName,
       phone: userPhone,
       timezone: userTimezone,
       show_certification_badge: showCertificationBadge,
      });

      setUser({ ...user, first_name: userFirstName, last_name: userLastName, phone: userPhone, timezone: userTimezone });
      setSaveSuccess(true);
      toast.success('Profile saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const getCalendarUrl = () => {
    if (!user?.email) return '';
    const token = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    return `${window.location.origin}/api/calendarFeed?email=${encodeURIComponent(user.email)}&token=${token}`;
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

  const roleLabel = tenantUser?.role_in_tenant === 'field_inspector' ? 'Field Inspector' :
                    tenantUser?.role_in_tenant === 'dispatcher' ? 'Dispatcher / Manager' :
                    tenantUser?.role_in_tenant === 'admin' ? 'Administrator' : 'Member';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="My Profile" subtitle="Update your personal information" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your profile picture and personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Avatar */}
          <div>
            <Label>Profile Picture</Label>
            <div className="flex items-start gap-4 sm:gap-6 mt-2">
              <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
                <Label htmlFor="profile-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </Button>
                </Label>
                <input id="profile-upload" type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
                <p className="text-xs text-slate-500">JPG, PNG or GIF (Max 5MB)</p>
                <Button onClick={() => setShowPasswordReset(true)} variant="outline" size="sm" className="w-fit">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </div>

          {/* Role badge */}
          {tenantUser?.is_owner && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Company Owner</p>
                <p className="text-sm text-amber-700">You are the owner of this company and have billing access</p>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Email */}
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={userEmail} disabled className="mt-1 bg-slate-50" />
          </div>

          {/* Phone */}
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

          {/* Timezone */}
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

          {/* Role (display only) */}
          {tenantUser && (
           <div>
             <Label className="text-sm text-slate-500">Role</Label>
             <p className="font-medium mt-1">
               {roleLabel}
               {tenantUser.is_owner && <span className="ml-2 text-amber-600">(Owner)</span>}
             </p>
           </div>
          )}

          {/* Certification Badge */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-start gap-4">
              <img
                src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/9369557c5_image.png"
                alt="Certified Home Watch Reporter Badge"
                className="h-20 w-auto object-contain flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="show-badge"
                    checked={showCertificationBadge}
                    onCheckedChange={setShowCertificationBadge}
                  />
                  <Label htmlFor="show-badge" className="cursor-pointer font-medium">
                    Display Badge on Profile
                  </Label>
                </div>
                <p className="text-xs text-slate-600 ml-6">
                  Show the Certified Home Watch Reporter badge alongside your profile picture
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className={saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'}>
              {saveSuccess ? <><Check className="h-4 w-4 mr-2" />Saved</> : <><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Sync
          </CardTitle>
          <CardDescription>Connect your calendar to view your schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Universal Calendar Subscription</Label>
            <Badge variant="outline" className="text-xs">Active</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Subscribe to your schedule in Outlook, Apple Calendar, or any app that supports calendar subscriptions (iCal/webcal format).
          </p>
          <div>
            <Label>Subscription URL</Label>
            <div className="flex gap-2 mt-2">
              <Input value={getCalendarUrl()} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={copyCalendarUrl}>
                {calendarUrlCopied ? <Check className="h-4 w-4 text-green-600" /> : <span>📋</span>}
              </Button>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-900">How to subscribe:</p>
            <p><strong>Apple Calendar:</strong> File → New Calendar Subscription → paste URL</p>
            <p><strong>Outlook:</strong> Add Calendar → Subscribe from web → paste URL</p>
            <p><strong>Google Calendar:</strong> Other calendars (+) → From URL → paste URL</p>
          </div>
        </CardContent>
      </Card>

      <PasswordResetDialog open={showPasswordReset} onOpenChange={setShowPasswordReset} userEmail={user?.email} />
    </div>
  );
}