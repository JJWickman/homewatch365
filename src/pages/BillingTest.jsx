import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, CreditCard, PlayCircle, Database } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from "@/components/ui/badge";

export default function BillingTest() {
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      if (members.length > 0) {
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        setCompanyData(companies[0]);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const addResult = (step, status, message, data = null) => {
    setTestResults(prev => [...prev, { step, status, message, data, timestamp: new Date() }]);
  };

  const runFullTest = async () => {
    setLoading(true);
    setTestResults([]);
    setCurrentStep(null);

    try {
      // Step 1: Check if Stripe products exist
      setCurrentStep('Checking Stripe products...');
      addResult('products', 'running', 'Checking if Stripe products are configured');
      
      const productsResponse = await base44.functions.invoke('createStripeProducts');
      if (productsResponse.data.success || productsResponse.data.message?.includes('already exist')) {
        addResult('products', 'success', 'Stripe products are configured', productsResponse.data.products);
      } else {
        addResult('products', 'error', 'Stripe products not configured', productsResponse.data);
        return;
      }

      // Step 2: Test creating a checkout session
      setCurrentStep('Creating test checkout session...');
      addResult('checkout', 'running', 'Creating Stripe checkout session');

      // Get the first available price_id from the products
      const priceId = productsResponse.data.products?.[0]?.monthly_price_id;
      
      if (!priceId) {
        addResult('checkout', 'error', 'No price ID found in Stripe products');
        return;
      }

      const checkoutResponse = await base44.functions.invoke('createCheckoutSession', {
        price_id: priceId,
        company_id: companyData.id,
        subscription_plan: 'growth',
        billing_cycle: 'monthly'
      });

      if (checkoutResponse.data.url) {
        addResult('checkout', 'success', 'Checkout session created successfully', {
          session_id: checkoutResponse.data.session_id,
          url: checkoutResponse.data.url
        });
      } else {
        addResult('checkout', 'error', 'Failed to create checkout session', checkoutResponse.data);
        return;
      }

      // Step 3: Check current subscription status
      setCurrentStep('Checking subscription status...');
      addResult('subscription', 'running', 'Checking current subscription status');
      
      await loadCompanyData();
      const currentCompany = await base44.entities.Company.filter({ id: companyData.id });
      
      addResult('subscription', 'info', 'Current subscription status', {
        plan: currentCompany[0].subscription_plan,
        status: currentCompany[0].subscription_status,
        trial_ends: currentCompany[0].trial_ends_at,
        stripe_customer_id: currentCompany[0].stripe_customer_id,
        stripe_subscription_id: currentCompany[0].stripe_subscription_id
      });

      setCurrentStep('Test complete!');
      addResult('complete', 'success', '✅ All billing components are working correctly');

    } catch (error) {
      console.error('Test error:', error);
      addResult('error', 'error', error.message || 'An error occurred during testing');
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'running': return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'info': return <Database className="h-5 w-5 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Billing System Test"
        subtitle="Test Stripe integration and subscription creation flow"
      />

      {companyData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Current Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Company:</span>
                <span className="font-medium">{companyData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Plan:</span>
                <Badge variant="outline" className="capitalize">{companyData.subscription_plan}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <Badge variant="outline" className="capitalize">{companyData.subscription_status}</Badge>
              </div>
              {companyData.stripe_customer_id && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Stripe Customer:</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">{companyData.stripe_customer_id}</code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Flow Test
          </CardTitle>
          <CardDescription>
            This will test: Stripe product configuration, checkout session creation, and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium mb-2">⚠️ Test Mode Only</p>
            <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
              <li>This creates a real Stripe checkout session (test mode if using test keys)</li>
              <li>No actual charges will be made with test API keys</li>
              <li>You can complete the checkout using test card: 4242 4242 4242 4242</li>
              <li>Make sure STRIPE_SECRET_KEY is set in environment variables</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={runFullTest}
              disabled={loading || !companyData}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Run Full Billing Test
                </>
              )}
            </Button>
          </div>

          {currentStep && (
            <div className="text-sm text-blue-600 font-medium">
              {currentStep}
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3 border-t pt-6">
              <h3 className="font-medium text-sm mb-3">Test Results:</h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm capitalize">{result.step}</p>
                        <Badge variant="outline" className="text-xs">
                          {result.timestamp.toLocaleTimeString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-white/50 p-3 rounded border overflow-auto max-h-48">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-medium text-sm mb-3">Manual Testing Steps:</h3>
            <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal">
              <li>Click "Run Full Billing Test" to create a checkout session</li>
              <li>Copy the checkout URL from the test results</li>
              <li>Open it in a new tab and complete the checkout with test card: 4242 4242 4242 4242</li>
              <li>After successful checkout, verify the webhook is triggered (check your company status)</li>
              <li>Confirm the subscription status changes to "trial" and trial_ends_at is set</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}