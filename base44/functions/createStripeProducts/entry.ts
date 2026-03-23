import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const NEW_PLANS = [
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    description: 'Perfect for solo operators — up to 50 properties',
    monthlyPrice: 49,
    maxUsers: 1,
    maxProperties: 50
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing teams — up to 100 properties',
    monthlyPrice: 89,
    maxUsers: 2,
    maxProperties: 100
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For larger teams — up to 500 properties',
    monthlyPrice: 149,
    maxUsers: 5,
    maxProperties: 500
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Step 1: Archive all existing active products in Stripe
    const existingProducts = await stripe.products.list({ active: true, limit: 100 });
    const archived = [];
    for (const product of existingProducts.data) {
      await stripe.products.update(product.id, { active: false });
      archived.push(product.id);
      console.log(`Archived old product: ${product.id} (${product.name})`);
    }

    // Step 2: Create the 3 new plans
    const results = [];

    for (const plan of NEW_PLANS) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          max_users: String(plan.maxUsers),
          max_properties: String(plan.maxProperties)
        }
      });
      console.log(`Created product ${product.id} for plan: ${plan.id}`);

      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice * 100,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { plan_id: plan.id, billing_cycle: 'monthly' }
      });

      // Annual price = monthly * 12 * 0.8 (20% discount), billed once per year
      const annualAmount = Math.round(plan.monthlyPrice * 12 * 0.8);
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: annualAmount * 100,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { plan_id: plan.id, billing_cycle: 'yearly' }
      });

      results.push({
        plan: plan.id,
        product_id: product.id,
        monthly_price_id: monthlyPrice.id,
        monthly_amount: plan.monthlyPrice,
        yearly_price_id: yearlyPrice.id,
        yearly_amount: annualAmount,
        yearly_per_month: Math.round(annualAmount / 12),
        max_users: plan.maxUsers,
        max_properties: plan.maxProperties
      });
    }

    return Response.json({
      success: true,
      archived_count: archived.length,
      created: results,
      message: 'Old products archived. New 3-tier plans created successfully.'
    });
  } catch (error) {
    console.error('Error creating Stripe products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});