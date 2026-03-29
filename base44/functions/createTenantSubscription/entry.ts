import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      price_id, 
      customer_email, 
      customer_name,
      billing_cycle_anchor 
    } = await req.json();

    if (!price_id) {
      return Response.json({ error: 'Missing price_id' }, { status: 400 });
    }

    // Get tenant to access their Stripe Connect account
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ 
      id: user.primary_tenant_id 
    });
    
    if (!tenants.length || !tenants[0].stripe_connect_account_id) {
      return Response.json({ 
        error: 'Stripe account not connected for this tenant' 
      }, { status: 400 });
    }

    const stripeAccountId = tenants[0].stripe_connect_account_id;

    // Create or get customer
    const customers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
      stripe_account: stripeAccountId
    }, { stripeAccount: stripeAccountId });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name,
        stripe_account: stripeAccountId
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price_id }],
      billing_cycle_anchor: billing_cycle_anchor,
      stripe_account: stripeAccountId
    });

    return Response.json({ 
      success: true, 
      subscription_id: subscription.id,
      customer_id: customerId
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});