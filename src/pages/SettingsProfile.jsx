import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { User, Lock, Camera, Save, Check, Calendar, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from '@/components/shared/PageHeader';
import PasswordResetDialog from '@/components/auth/PasswordResetDialog';
import { Shield } from 'lucide-react';

export default function SettingsProfile() {
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/New_York');
  const [baseHqAddress, setBaseHqAddress] = useState({ address: '', city: '', state: '', zip: '' });
  const [homeAddress, setHomeAddress] = useState({ address: '', city: '', state: '', zip: '' });
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
      setUserTimezone(currentUser.timezone || 'America/New_York');
      setBaseHqAddress(currentUser.base_hq_address || { address: '', city: '', state: '', zip: '' });
      setHomeAddress(currentUser.home_address || { address: '', city: '', state: '', zip: '' });

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        setCompanyMember(members[0]);
        const fullName = members[0].user_name || '';
        const nameParts = fullName.split(' ');
        setUserFirstName(nameParts[0] || '');
        setUserLastName(nameParts.slice(1).join(' ') || '');
        setUserRole(members[0].role || 'field_inspector');
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
      const fullName = `${userFirstName} ${userLastName}`.trim();

      await base44.auth.updateMe({ 
        full_name: fullName,
        phone: userPhone,
        timezone: userTimezone,
        base_hq_address: baseHqAddress,
        home_address: homeAddress
      });

      if (companyMember) {
        await base44.entities.CompanyMember.update(companyMember.id, { 
          user_name: fullName,
          role: userRole 
        });

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
      
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        title="My Profile"
        subtitle="Update your personal information"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your profile picture and personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Profile Picture</Label>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => setShowPasswordReset(true)} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
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

              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="mt-1 bg-slate-50"
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

              <div>
                <Label className="text-sm text-slate-500">Role</Label>
                <p className="font-medium capitalize mt-1">
                  {companyMember?.role === 'field_inspector' ? 'Reporter' : 
                   companyMember?.role === 'dispatcher' ? 'Dispatcher/Manager' : 
                   'Administrator'}
                  {companyMember?.is_owner && <span className="ml-2 text-amber-600">(Owner)</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex items-center justify-end gap-3">
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route Optimization Addresses */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Optimization Addresses
          </CardTitle>
          <CardDescription>Set your starting locations for route planning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base HQ Address */}
          <div>
            <Label className="text-sm font-medium">Base HQ Address</Label>
            <p className="text-xs text-slate-500 mb-3">Your main office location for route optimization</p>
            <div className="space-y-3">
              <Input
                placeholder="Street address"
                value={baseHqAddress.address}
                onChange={(e) => setBaseHqAddress({ ...baseHqAddress, address: e.target.value })}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={baseHqAddress.city}
                  onChange={(e) => setBaseHqAddress({ ...baseHqAddress, city: e.target.value })}
                  className="sm:col-span-2"
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
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={homeAddress.city}
                  onChange={(e) => setHomeAddress({ ...homeAddress, city: e.target.value })}
                  className="sm:col-span-2"
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

          <div className="border-t pt-4 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Addresses'}
            </Button>
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
          <CardDescription>Connect your calendar to view your schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-base font-medium">Universal Calendar Subscription</Label>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Subscribe to your schedule in Outlook, Apple Calendar, or any app that supports calendar subscriptions (iCal/webcal format).
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
                    <i className="h-4 w-4">📋</i>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3 mt-4">
              <p className="text-sm font-medium">How to subscribe:</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p><strong>Apple Calendar:</strong> File → New Calendar Subscription → paste URL</p>
                <p><strong>Outlook:</strong> Add Calendar → Subscribe from web → paste URL</p>
                <p><strong>Google Calendar:</strong> Other calendars (+) → From URL → paste URL</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PasswordResetDialog 
        open={showPasswordReset} 
        onOpenChange={setShowPasswordReset}
        userEmail={user?.email}
      />
    </div>
  );
}