import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, ExternalLink, Unlink, AlertCircle, Edit2, Save } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';

export default function StripeConnectCard({ company, onRefresh }) {
  const [editingMethod, setEditingMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({
    square_account_id: '',
    zelle_account: '',
    venmo_username: '',
    paypal_email: ''
  });
  const [disconnecting, setDisconnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (company) {
      setPaymentMethods({
        square_account_id: company.square_account_id || '',
        zelle_account: company.zelle_account || '',
        venmo_username: company.venmo_username || '',
        paypal_email: company.paypal_email || ''
      });
    }
  }, [company]);

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
      await base44.entities.Tenant.update(company.id, {
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

  const handleSavePaymentMethod = async (method) => {
    setSaving(true);
    try {
      await base44.entities.Tenant.update(company.id, {
        [method]: paymentMethods[method]
      });
      setEditingMethod(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error saving payment method:', error);
      setError('Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const isConnected = !!company?.stripe_connect_account_id;

  const paymentMethodsConfig = [
    {
      id: 'square',
      field: 'square_account_id',
      name: 'Square',
      placeholder: 'Square merchant ID or email',
      icon: (
        <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
            <path d="M4.01 4.01v15.98h15.98V4.01H4.01zM5.31 5.31h13.38v13.38H5.31V5.31zm3.76 2.82v3.76h3.76V8.13H9.07zm4.87 0v3.76h3.76V8.13h-3.76zM9.07 12.94v3.76h3.76v-3.76H9.07zm4.87 0v3.76h3.76v-3.76h-3.76z"/>
          </svg>
        </div>
      ),
      color: 'black'
    },
    {
      id: 'zelle',
      field: 'zelle_account',
      name: 'Zelle',
      placeholder: 'Email or phone number',
      icon: (
        <div className="h-10 w-10 rounded-lg bg-[#6D1ED4] flex items-center justify-center">
          <span className="text-white font-bold text-lg">Z</span>
        </div>
      ),
      color: '#6D1ED4'
    },
    {
      id: 'venmo',
      field: 'venmo_username',
      name: 'Venmo',
      placeholder: 'Username (without @)',
      icon: (
        <div className="h-10 w-10 rounded-lg bg-[#008CFF] flex items-center justify-center">
          <span className="text-white font-bold text-lg">V</span>
        </div>
      ),
      color: '#008CFF'
    },
    {
      id: 'paypal',
      field: 'paypal_email',
      name: 'PayPal',
      placeholder: 'PayPal email address',
      icon: (
        <div className="h-10 w-10 rounded-lg bg-[#003087] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.927.927 0 0 1 .918-.79h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.802-4.457z"/>
          </svg>
        </div>
      ),
      color: '#003087'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Configure how you want to receive payments from clients
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

        {/* Other Payment Methods */}
        <div className="pt-4 border-t">
          <h3 className="font-medium text-slate-900 mb-4">Additional Payment Methods</h3>
          <div className="space-y-3">
            {paymentMethodsConfig.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {method.icon}
                  <div className="flex-1">
                    <p className="font-medium">{method.name}</p>
                    {editingMethod === method.field ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={paymentMethods[method.field]}
                          onChange={(e) => setPaymentMethods({ ...paymentMethods, [method.field]: e.target.value })}
                          placeholder={method.placeholder}
                          className="flex-1"
                        />
                        <Button 
                          size="sm"
                          onClick={() => handleSavePaymentMethod(method.field)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMethod(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {company?.[method.field] || 'Not configured'}
                      </p>
                    )}
                  </div>
                </div>
                {editingMethod !== method.field && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingMethod(method.field)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">How these work</p>
                <p className="text-blue-700 mt-1">
                  These payment methods will be displayed to your clients on their invoices and billing pages. 
                  Clients can use these details to send payments directly to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}