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
      console.log(`Creating product for tier: ${tier.id}`);
      // Create product
      const product = await stripe.products.create({
        name: tier.name,
        description: `${tier.name} Plan`,
        metadata: {
          plan_id: tier.id
        }
      });
      console.log(`✓ Created product ${product.id} for ${tier.id}`);

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
        unit_amount: tier.annualPrice * 100 * 12,
        currency: 'usd',
        recurring: {
          interval: 'year'
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

    // Create bundled CRM & Marketing plans
    const bundledTiers = [
      {
        id: 'solopreneur_crm',
        name: 'Solopreneur + CRM & Marketing',
        monthlyPrice: 149,
        annualPrice: 119 // 20% discount
      },
      {
        id: 'growth_crm',
        name: 'Growth + CRM & Marketing',
        monthlyPrice: 248,
        annualPrice: 198.40 // 20% discount
      },
      {
        id: 'professional_crm',
        name: 'Professional + CRM & Marketing',
        monthlyPrice: 299,
        annualPrice: 239.20 // 20% discount
      }
    ];

    for (const tier of bundledTiers) {
      console.log(`Creating bundled product for: ${tier.id}`);
      
      const product = await stripe.products.create({
        name: tier.name,
        description: `${tier.name} Plan`,
        metadata: {
          plan_id: tier.id,
          includes_crm: 'true'
        }
      });
      console.log(`✓ Created product ${product.id} for ${tier.id}`);

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
        unit_amount: tier.annualPrice * 100 * 12,
        currency: 'usd',
        recurring: {
          interval: 'year'
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

    // Store prices in a Settings entity for easy reference
    try {
      const settings = await base44.asServiceRole.entities.Settings.list();
      if (settings.length > 0) {
        await base44.asServiceRole.entities.Settings.update(settings[0].id, {
          stripe_prices: results
        });
      }
    } catch (e) {
      console.log('Settings entity not available, skipping storage');
    }

    return Response.json({ 
      success: true,
      products: results,
      message: 'Stripe products, prices, and add-ons created successfully'
    });
  } catch (error) {
    console.error('Error creating Stripe products:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});