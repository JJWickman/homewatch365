import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function StripeSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSetupProducts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('createStripeProducts');
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Failed to create products');
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Stripe Setup"
        subtitle="Configure Stripe products and pricing"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create Stripe Products
          </CardTitle>
          <CardDescription>
            This will create products and prices in your Stripe account for all subscription tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">Before you start:</p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Make sure you've set your Stripe API keys in the environment variables</li>
              <li>This is a one-time setup - only run this once</li>
              <li>You can view the created products in your Stripe Dashboard</li>
              <li>Test mode keys will create test products only</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Success!</p>
              </div>
              <p className="text-sm text-green-800 mb-3">{result.message}</p>
              <div className="space-y-2">
                {result.products?.map((product) => (
                  <div key={product.tier} className="bg-white rounded p-3 border border-green-200">
                    <p className="font-medium text-sm capitalize">{product.tier}</p>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <p>Product ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{product.product_id}</code></p>
                      <p>Monthly Price ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{product.monthly_price_id}</code></p>
                      <p>Annual Price ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{product.annual_price_id}</code></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleSetupProducts}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Products...
                </>
              ) : (
                'Create Stripe Products'
              )}
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-sm mb-3">Next Steps:</h3>
            <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal">
              <li>After creating products, set up your webhook endpoint in Stripe Dashboard</li>
              <li>Add the webhook URL: <code className="bg-slate-100 px-2 py-1 rounded text-xs">https://yourdomain.com/api/stripeWebhook</code></li>
              <li>Select these events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed</li>
              <li>Copy the webhook secret and add it to your environment variables</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}