import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    // Fetch all active products first
    const products = await stripe.products.list({
      active: true,
      limit: 100
    });

    // Organize products with their prices
    const plans = {};
    
    for (const product of products.data) {
      // Fetch prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true
      });

      const planId = product.metadata?.plan_id || product.id;
      
      plans[planId] = {
        id: planId,
        name: product.name,
        description: product.description,
        prices: {}
      };
      
      // Organize prices by interval
      for (const price of prices.data) {
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
    }

    // Convert to array
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