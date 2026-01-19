import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Building, Mail, Lock } from 'lucide-react';

export default function InvitationAccept() {
  const [token, setToken] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    
    if (!inviteToken) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    setToken(inviteToken);
    loadInvitation(inviteToken);
  }, []);

  const loadInvitation = async (inviteToken) => {
    try {
      const invitations = await base44.entities.Invitation.filter({
        token: inviteToken
      });

      if (invitations.length === 0) {
        setError('Invalid or expired invitation link');
        setLoading(false);
        return;
      }

      const inv = invitations[0];

      // Check if expired
      if (new Date(inv.expires_at) < new Date()) {
        setError('This invitation has expired. Please ask for a new one.');
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (inv.status === 'accepted') {
        setError('This invitation has already been used');
        setLoading(false);
        return;
      }

      setInvitation(inv);
      setFormData(prev => ({ ...prev, email: inv.invitee_email }));

      // Load company details
      const companies = await base44.entities.Company.filter({ id: inv.company_id });
      if (companies.length > 0) {
        setCompany(companies[0]);
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.password) {
      setError('Please enter a password');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setAccepting(true);
    try {
      const response = await base44.functions.invoke('acceptInvitation', {
        token: token,
        password: formData.password,
        full_name: formData.fullName
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          base44.auth.redirectToLogin(createPageUrl('Dashboard'));
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Invitation Error</h2>
                <p className="text-sm text-slate-600 mt-2">{error}</p>
              </div>
              <Button 
                onClick={() => navigate(createPageUrl('Home'))}
                className="mt-4"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Welcome to the Team!</h2>
                <p className="text-sm text-slate-600 mt-2">Your account has been created successfully.</p>
                <p className="text-sm text-slate-600 mt-1">You will be redirected to login shortly...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-12 w-12 rounded" />
            ) : (
              <Building className="h-12 w-12 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-center">Accept Invitation</CardTitle>
          <CardDescription className="text-center">
            Join <span className="font-semibold">{company?.name || 'your company'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="mt-1 bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              disabled={accepting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {accepting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}