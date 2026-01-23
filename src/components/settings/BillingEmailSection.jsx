import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BillingEmailSection({ company, onUpdate }) {
  const [email, setEmail] = useState(company?.billing_email || '');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleRequestVerification = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('verifySenderEmail', {
        company_id: company.id,
        email,
        action: 'request_verification'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onUpdate();
      } else {
        toast.error(response.data.error || 'Failed to request verification');
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

        {!isVerified && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="billing_email">Billing Email Address</Label>
              <Input
                id="billing_email"
                type="email"
                placeholder="billing@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
                You must have access to this email to complete verification
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRequestVerification}
                disabled={loading || !email}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Request Verification'
                )}
              </Button>

              {hasPendingVerification && (
                <Button
                  variant="outline"
                  onClick={handleCheckVerification}
                  disabled={checking}
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
          </div>
        )}

        {isVerified && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEmail('');
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