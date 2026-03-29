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

    const { amount, currency = 'usd', source, customer_email, description } = await req.json();

    if (!amount || !source) {
      return Response.json({ error: 'Missing required fields: amount, source' }, { status: 400 });
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

    // Charge using tenant's connected Stripe account
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      source,
      description,
      receipt_email: customer_email,
      stripe_account: stripeAccountId
    });

    return Response.json({ 
      success: true, 
      charge_id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency
    });
  } catch (error) {
    console.error('Charge creation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});