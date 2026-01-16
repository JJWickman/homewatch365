import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    // List all products with their prices
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    // Group prices by product and billing cycle
    const pricesByPlan = {};
    
    for (const price of prices.data) {
      const planId = price.metadata.plan_id;
      const billingCycle = price.metadata.billing_cycle;
      
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
      error: error.message 
    }, { status: 500 });
  }
});