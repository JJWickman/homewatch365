import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, ExternalLink, Unlink, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';

export default function StripeConnectCard({ company, onRefresh }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for success/error params in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connected') === 'true') {
      setShowSuccess(true);
      onRefresh?.();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (params.get('stripe_error')) {
      setError(decodeURIComponent(params.get('stripe_error')));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    const clientId = 'ca_RW6HDHJZqCwqKS0kHJ6T1UMXYXJOcJb1'; // Replace with your actual Stripe client ID
    const redirectUri = `${window.location.origin}/api/stripeConnectOAuth`;
    const state = company.id;
    
    const stripeAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    window.location.href = stripeAuthUrl;
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Stripe account? This will prevent you from collecting payments from clients.')) {
      return;
    }

    setDisconnecting(true);
    try {
      await base44.entities.Company.update(company.id, {
        stripe_connect_account_id: null
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      setError('Failed to disconnect Stripe account');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = !!company?.stripe_connect_account_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to collect payments from clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Stripe account connected successfully! You can now collect payments from your clients.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-[#635BFF] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium">Stripe Payment Processing</p>
              <p className="text-sm text-slate-500">
                {isConnected ? 'Connected and ready to accept payments' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnect}
                className="bg-[#635BFF] hover:bg-[#5247E5] text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Connect Stripe
              </Button>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-slate-900">What you can do now:</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  <li>• Collect payments from clients for your property management services</li>
                  <li>• Set up subscription billing for recurring services</li>
                  <li>• Accept one-time payments for add-on services</li>
                  <li>• All payments go directly to your Stripe account</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Stripe Dashboard
                </a>
              </Button>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Why connect Stripe?</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>• Accept credit card and ACH payments from clients</li>
                  <li>• Automate billing and invoicing</li>
                  <li>• Secure payment processing with industry-leading security</li>
                  <li>• Funds deposited directly to your bank account</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}