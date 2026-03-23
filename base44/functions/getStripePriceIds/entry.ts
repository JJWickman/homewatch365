import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all products
    const products = await stripe.products.list({ limit: 100 });
    
    const prices = {};

    for (const product of products.data) {
      const planId = product.metadata?.plan_id || product.metadata?.addon_id;
      
      if (planId) {
        const productPrices = await stripe.prices.list({
          product: product.id,
          limit: 10,
        });

        productPrices.data.forEach(price => {
          const billingCycle = price.metadata?.billing_cycle || 'monthly';
          const key = `${planId}_${billingCycle}`;
          prices[key] = price.id;
        });
      }
    }

    return Response.json({
      success: true,
      prices: prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});