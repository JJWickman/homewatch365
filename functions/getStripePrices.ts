import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product']
    });

    // Organize products with their prices
    const plans = {};
    
    for (const price of prices.data) {
      const product = price.product;
      const planId = product.metadata?.plan_id || product.id;
      
      if (!plans[planId]) {
        plans[planId] = {
          id: planId,
          name: product.name,
          description: product.description,
          prices: {}
        };
      }
      
      // Store the monthly price (look for monthly billing)
      if (price.recurring?.interval === 'month') {
        plans[planId].prices.monthly = {
          priceId: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency
        };
      } else if (price.recurring?.interval === 'year') {
        plans[planId].prices.yearly = {
          priceId: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency
        };
      }
    }

    // Convert plans object to array and sort by a logical order
    const planArray = Object.values(plans);
    
    return Response.json({ 
      success: true,
      plans: planArray
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return Response.json({ 
      success: false,
      plans: [],
      error: error.message 
    }, { status: 200 });
  }
});