import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      apiKeyValid: false,
      products: [],
      prices: [],
      webhookConfigured: false,
      billingPortalActive: false,
      errors: []
    };

    // Test 1: Verify API key works
    try {
      const account = await stripe.accounts.retrieve();
      results.apiKeyValid = true;
      results.accountInfo = {
        id: account.id,
        email: account.email,
        country: account.country
      };
    } catch (error) {
      results.errors.push(`API Key Error: ${error.message}`);
    }

    // Test 2: Check for products
    try {
      const products = await stripe.products.list({ active: true, limit: 100 });
      results.products = products.data.map(p => ({
        id: p.id,
        name: p.name,
        active: p.active
      }));
    } catch (error) {
      results.errors.push(`Products Error: ${error.message}`);
    }

    // Test 3: Check for prices
    try {
      const prices = await stripe.prices.list({ active: true, limit: 100 });
      results.prices = prices.data.map(p => ({
        id: p.id,
        product: p.product,
        unit_amount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring
      }));
    } catch (error) {
      results.errors.push(`Prices Error: ${error.message}`);
    }

    // Test 4: Check webhook endpoints
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
      results.webhookConfigured = webhooks.data.length > 0;
      results.webhooks = webhooks.data.map(w => ({
        id: w.id,
        url: w.url,
        enabled_events: w.enabled_events,
        status: w.status
      }));
    } catch (error) {
      results.errors.push(`Webhooks Error: ${error.message}`);
    }

    // Test 5: Check billing portal configuration
    try {
      const configurations = await stripe.billingPortal.configurations.list({ limit: 1 });
      results.billingPortalActive = configurations.data.length > 0;
      if (configurations.data.length > 0) {
        results.billingPortalConfig = {
          id: configurations.data[0].id,
          features: configurations.data[0].features
        };
      }
    } catch (error) {
      results.errors.push(`Billing Portal Error: ${error.message}`);
    }

    // Recommendations
    results.recommendations = [];
    if (results.products.length === 0) {
      results.recommendations.push('Run "Create Stripe Products" from Settings → Admin to create subscription products');
    }
    if (!results.webhookConfigured) {
      results.recommendations.push('Configure webhook in Stripe Dashboard pointing to your webhook endpoint');
    }
    if (!results.billingPortalActive) {
      results.recommendations.push('Enable Customer Portal in Stripe Dashboard → Settings → Billing');
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});