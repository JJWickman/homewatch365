import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_id, tenant_id, subscription_plan, billing_cycle, return_url, promo_code } = await req.json();

    // Get tenant
    let tenants;
    try {
      tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
    } catch (error) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (!tenants || !tenants.length) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const tenant = tenants[0];

    // Get or create Stripe customer
    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { tenant_id: tenant.id }
      });
      customerId = customer.id;
      await base44.asServiceRole.entities.Tenant.update(tenant.id, {
        stripe_customer_id: customerId
      });
    }

    // Create checkout session
    const subscriptionData = {
      metadata: {
        tenant_id: tenant.id,
        subscription_plan,
        billing_cycle
      }
    };

    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      submit_type: 'subscribe',
      payment_method_types: ['card'],
      payment_method_collection: 'if_required',
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: `${new URL(req.url).origin}/?checkout=success`,
      cancel_url: `${new URL(req.url).origin}/?tab=billing`,
      metadata: {
        tenant_id: tenant.id,
        subscription_plan,
        billing_cycle
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      allow_promotion_codes: true
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return Response.json({ error: stripeError.message }, { status: 400 });
    }

    return Response.json({ 
      url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});