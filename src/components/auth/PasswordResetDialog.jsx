import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PasswordResetDialog({ open, onOpenChange, userEmail }) {
  const [step, setStep] = useState('email'); // email, code, success
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  const handleSendCode = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await base44.functions.invoke('sendPasswordResetCode', { email });
      if (response.data.success) {
        setStep('code');
      } else {
        setError(response.data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Failed to send reset code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('resetPasswordWithCode', {
        email,
        code,
        newPassword
      });

      if (response.data.success) {
        setStep('success');
        setTimeout(() => {
          onOpenChange(false);
          setStep('email');
          setCode('');
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && 'Enter the code and your new password'}
            {step === 'success' && 'Password reset successfully'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'email' && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reset-code">Reset Code</Label>
              <Input
                id="reset-code"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="123456"
                maxLength="6"
                disabled={loading}
                className="mt-1 font-mono text-center text-lg tracking-widest"
              />
              <p className="text-xs text-slate-500 mt-1">Check your email for the code</p>
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-slate-600">Your password has been reset successfully.</p>
            <p className="text-xs text-slate-500 mt-2">Redirecting...</p>
          </div>
        )}

        {step !== 'success' && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setStep('email');
                setError('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={step === 'email' ? handleSendCode : handleResetPassword}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {step === 'email' ? 'Sending...' : 'Resetting...'}
                </>
              ) : (
                step === 'email' ? 'Send Code' : 'Reset Password'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}