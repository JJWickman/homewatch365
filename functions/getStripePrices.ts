import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100
    });

    // Group prices by plan and billing cycle
    const pricesByPlan = {};
    
    for (const price of prices.data) {
      const planId = price.metadata?.plan_id;
      const billingCycle = price.metadata?.billing_cycle;
      
      // Skip if metadata is missing
      if (!planId || !billingCycle) {
        continue;
      }
      
      if (!pricesByPlan[planId]) {
        pricesByPlan[planId] = {};
      }
      
      pricesByPlan[planId][billingCycle] = price.id;
    }

    return Response.json({ 
      success: true,
      prices: pricesByPlan
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return Response.json({ 
      success: false,
      prices: {},
      error: error.message 
    }, { status: 200 });
  }
});