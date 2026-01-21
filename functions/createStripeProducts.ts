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

    // Create products and prices for each tier
    const tiers = [
      {
        id: 'solopreneur',
        name: 'Solopreneur',
        monthlyPrice: 99,
        annualPrice: 79
      },
      {
        id: 'growth',
        name: 'Growth',
        monthlyPrice: 199,
        annualPrice: 159
      },
      {
        id: 'professional',
        name: 'Professional',
        monthlyPrice: 249,
        annualPrice: 199
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 499,
        annualPrice: 399
      }
    ];

    const results = [];

    for (const tier of tiers) {
      // Create product
      const product = await stripe.products.create({
        name: tier.name,
        description: `${tier.name} Plan`,
        metadata: {
          plan_id: tier.id
        }
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.monthlyPrice * 100,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan_id: tier.id,
          billing_cycle: 'monthly'
        }
      });

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.annualPrice * 100,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan_id: tier.id,
          billing_cycle: 'annual'
        }
      });

      results.push({
        tier: tier.id,
        product_id: product.id,
        monthly_price_id: monthlyPrice.id,
        annual_price_id: annualPrice.id
      });
    }

    return Response.json({ 
      success: true,
      products: results,
      message: 'Stripe products and prices created successfully'
    });
  } catch (error) {
    console.error('Error creating Stripe products:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});