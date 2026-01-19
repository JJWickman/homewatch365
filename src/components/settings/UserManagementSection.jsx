import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Mail, Home, Lock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserManagementSection({ staff = [], company }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.user_name || '',
      phone: '',
      home_address: { address: '', city: '', state: '', zip: '' }
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      // Update user via service role
      await base44.asServiceRole.entities.User.update(selectedUser.id, {
        full_name: editData.full_name,
        phone: editData.phone,
        home_address: editData.home_address
      });

      setMessage('User updated successfully');
      setTimeout(() => {
        setShowEditDialog(false);
        setMessage('');
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage('Error updating user: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('adminResetUserPassword', {
        targetUserEmail: selectedUser.user_email
      });

      if (response.data.success) {
        setMessage('Password reset code sent to ' + selectedUser.user_email);
        setTimeout(() => {
          setShowResetDialog(false);
          setMessage('');
        }, 3000);
      } else {
        setMessage('Error: ' + (response.data.error || 'Failed to reset password'));
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>Manage user details and reset passwords</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {staff.filter(m => m.is_active).length === 0 ? (
            <p className="text-slate-500 text-center py-8">No active users</p>
          ) : (
            staff.filter(m => m.is_active).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar>
                    <AvatarFallback className="bg-slate-200">
                      {getInitials(user.user_name, user.user_email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{user.user_name || user.user_email}</p>
                    <p className="text-sm text-slate-500 truncate">{user.user_email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {user.role === 'field_inspector' ? 'Field Inspector' : 
                     user.role === 'dispatcher' ? 'Dispatcher' : 
                     'Administrator'}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedUser(user);
                      setShowResetDialog(true);
                    }}>
                      <Lock className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>

          {message && (
            <Alert variant={message.includes('Error') ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div>
              <Label>Email</Label>
              <Input
                value={selectedUser?.user_email || ''}
                disabled
                className="bg-slate-50 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Home Address</Label>
              <p className="text-xs text-slate-500 mb-3">For route optimization</p>
              <div className="space-y-3">
                <Input
                  placeholder="Street address"
                  value={editData.home_address?.address || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    home_address: { ...editData.home_address, address: e.target.value }
                  })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="City"
                    value={editData.home_address?.city || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      home_address: { ...editData.home_address, city: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="State"
                    value={editData.home_address?.state || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      home_address: { ...editData.home_address, state: e.target.value }
                    })}
                    maxLength="2"
                  />
                </div>
                <Input
                  placeholder="ZIP code"
                  value={editData.home_address?.zip || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    home_address: { ...editData.home_address, zip: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset code to {selectedUser?.user_name || selectedUser?.user_email}
            </DialogDescription>
          </DialogHeader>

          {message && (
            <Alert variant={message.includes('Error') ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="py-4 space-y-3 text-sm text-slate-600">
            <p>A password reset code will be sent to:</p>
            <p className="font-medium text-slate-900">{selectedUser?.user_email}</p>
            <p>The user can then use this code to reset their password.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send Reset Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}