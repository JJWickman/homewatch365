import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BillingEmailSection({ company, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: company?.billing_email || '',
    reply_to: '',
    address: company?.address || '',
    address2: '',
    city: company?.city || '',
    state: company?.state || '',
    zip: company?.zip || '',
    country: 'United States',
    nickname: ''
  });

  useEffect(() => {
    // Auto-populate from company settings
    setFormData(prev => ({
      ...prev,
      from_name: company?.name || '',
      from_email: company?.billing_email || '',
      reply_to: company?.billing_email || company?.email || '',
      address: company?.address || '',
      city: company?.city || '',
      state: company?.state || '',
      zip: company?.zip || '',
      nickname: company?.name ? `${company.name} Billing` : ''
    }));
  }, [company]);

  const handleRequestVerification = async () => {
    if (!formData.from_email || !formData.from_name) {
      toast.error('Please enter sender name and email address');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('verifySenderEmail', {
        company_id: company.id,
        action: 'request_verification',
        ...formData
      });

      console.log('SendGrid Response:', response.data);

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Show detailed SendGrid feedback
        if (response.data.sendgrid_response) {
          console.log('SendGrid Details:', response.data.sendgrid_response);
          toast.info(`SendGrid Status: ${response.data.sendgrid_response.status || 'Sent'}`);
        }
        
        setShowForm(false);
        onUpdate();
      } else {
        toast.error(response.data.error || 'Failed to request verification');
        
        // Show SendGrid error details if available
        if (response.data.sendgrid_error) {
          console.error('SendGrid Error:', response.data.sendgrid_error);
          toast.error(`SendGrid: ${response.data.sendgrid_error}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to request verification');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('verifySenderEmail', {
        company_id: company.id,
        action: 'check_verification'
      });

      if (response.data.verified) {
        toast.success(response.data.message);
        onUpdate();
      } else {
        toast.info(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to check verification status');
    } finally {
      setChecking(false);
    }
  };

  const isVerified = company?.billing_email_verified;
  const hasPendingVerification = company?.billing_email && !isVerified;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invoice Sender Email
        </CardTitle>
        <CardDescription>
          Set a custom sender email for your invoices (e.g., billing@yourcompany.com)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Verified:</strong> {company.billing_email}
              <p className="text-xs text-green-700 mt-1">
                All invoices will be sent from this email address.
              </p>
            </AlertDescription>
          </Alert>
        ) : hasPendingVerification ? (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Verification Pending:</strong> {company.billing_email}
              <p className="text-xs text-amber-700 mt-1">
                Check your inbox for the verification email and click the link to verify.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invoices are currently sent from: <strong>noreply@estatewatch365.app</strong>
              <p className="text-xs text-slate-600 mt-1">
                Set up your own sender email to use your company domain.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!isVerified && !showForm && (
          <div className="space-y-3">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Set Up Custom Sender Email
            </Button>

            {hasPendingVerification && (
              <Button
                variant="outline"
                onClick={handleCheckVerification}
                disabled={checking}
                className="ml-2"
              >
                {checking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Verification Status'
                )}
              </Button>
            )}
          </div>
        )}

        {!isVerified && showForm && (
          <div className="space-y-4 border-t pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-2">What happens when you request verification?</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>We'll send a verification email to the address you specify below</li>
                    <li>You'll need to click the verification link in that email</li>
                    <li><strong>The link will take you to a SendGrid/Twilio branded page</strong> - this is normal and expected</li>
                    <li><strong>You DO NOT need to login</strong> - simply visiting the page completes the verification</li>
                    <li>Once verified, all external email communications (invoices, reports, etc.) will be sent from your custom email using SendGrid</li>
                    <li>Clients will see your company name and domain instead of our default sender</li>
                  </ol>
                  <p className="mt-3 font-medium text-blue-900">
                    Important: You must have access to the email address to complete verification. SendGrid is our trusted email service provider for all external communications.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_name">From Name *</Label>
                <Input
                  id="from_name"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  placeholder="Your Company Name"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  What clients will see as the sender name
                </p>
              </div>

              <div>
                <Label htmlFor="from_email">From Email Address *</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value, reply_to: e.target.value })}
                  placeholder="billing@yourcompany.com"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  <strong>Verification required</strong> - You'll receive a verification email
                </p>
              </div>

              <div>
                <Label htmlFor="reply_to">Reply To Email</Label>
                <Input
                  id="reply_to"
                  type="email"
                  value={formData.reply_to}
                  onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                  placeholder="billing@yourcompany.com"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Where replies should go (usually same as from email)
                </p>
              </div>

              <div>
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Company Name Billing"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Internal identifier for this sender
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Company Address</h4>
              
              <div>
                <Label htmlFor="address">Address Line 1</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  placeholder="Suite 100 (optional)"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="mt-1"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="12345"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleRequestVerification}
                disabled={loading || !formData.from_email || !formData.from_name}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Request Verification
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setVerifiedEmail('');
                onUpdate();
              }}
              size="sm"
            >
              Change Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}