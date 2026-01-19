import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // email, code, success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('sendPasswordResetCode', {
        email: email.trim()
      });

      if (response.data.success) {
        setStep('code');
      } else {
        setError(response.data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the reset code');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('resetPasswordWithCode', {
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword
      });

      if (response.data.success) {
        setStep('success');
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && 'Enter the code and set a new password'}
            {step === 'success' && 'Password reset successful'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>

              <div className="text-center">
                <Link to={createPageUrl('ClientLogin')}>
                  <Button variant="ghost" size="sm" className="text-slate-600">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  A 6-digit code has been sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="000000"
                  maxLength="6"
                  className="mt-1 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-slate-500 mt-1">Expires in 15 minutes</p>
              </div>

              <div>
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="w-full"
              >
                Back
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Password Reset Complete!</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>

              <Button
                onClick={() => navigate(createPageUrl('ClientLogin'))}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}