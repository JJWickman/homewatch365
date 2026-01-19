import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Mail, Lock, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email', 'pin', 'reset'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const clients = await base44.entities.Client.filter({ portal_user_email: email });
      
      if (clients.length === 0) {
        toast.error('No client account found with this email');
        setLoading(false);
        return;
      }

      const client = clients[0];
      if (!client.portal_access) {
        toast.error('Portal access is not enabled for your account');
        setLoading(false);
        return;
      }

      if (!client.portal_pin) {
        toast.error('Portal PIN not set. Please contact your property manager.');
        setLoading(false);
        return;
      }

      setClientData(client);
      setStep('pin');
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error('Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (pin !== clientData.portal_pin) {
        toast.error('Incorrect PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }

      // Login successful - store session and redirect to portal
      sessionStorage.setItem('portal_client_email', clientData.portal_user_email);
      toast.success('Login successful!');
      navigate(createPageUrl('ClientPortal'));
    } catch (error) {
      console.error('Error verifying PIN:', error);
      toast.error('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('sendPinResetCode', {
        client_id: clientData.id,
        email: clientData.portal_user_email,
        phone: clientData.phone
      });

      if (response.data.success) {
        toast.success('Reset code sent to your email and phone');
        setStep('reset');
      } else {
        toast.error('Failed to send reset code');
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      toast.error('Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await base44.functions.invoke('resetClientPin', {
        client_id: clientData.id,
        reset_code: resetCode,
        new_pin: newPin
      });

      if (response.data.success) {
        toast.success('PIN reset successfully! Please login with your new PIN.');
        setStep('pin');
        setPin('');
        setResetCode('');
        setNewPin('');
        // Reload client data
        const clients = await base44.entities.Client.filter({ id: clientData.id });
        if (clients.length > 0) {
          setClientData(clients[0]);
        }
      } else {
        toast.error(response.data.message || 'Invalid reset code');
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      toast.error('Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            {step === 'email' && 'Enter your email to access your portal'}
            {step === 'pin' && 'Enter your 6-digit PIN'}
            {step === 'reset' && 'Reset your PIN'}
          </p>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="text-center">
                <Link to={createPageUrl('ForgotPassword')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </form>
          )}

          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pin">PIN Code</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || pin.length !== 6}>
                {loading ? 'Verifying...' : 'Login'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendResetCode}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Forgot PIN?
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setStep('email');
                  setPin('');
                  setClientData(null);
                }}
              >
                Use different email
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPin} className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                A reset code has been sent to your email and phone number.
              </p>
              <div>
                <Label htmlFor="reset-code">Reset Code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="new-pin">New PIN</Label>
                <Input
                  id="new-pin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || newPin.length !== 6}>
                {loading ? 'Resetting...' : 'Reset PIN'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setStep('pin');
                  setResetCode('');
                  setNewPin('');
                }}
              >
                Back to login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}