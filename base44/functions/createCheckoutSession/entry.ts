import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const appId = '696806e88e744d6cc803e3bb';
    const base44 = createClientFromRequest(req, { appId });
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_id, tenant_id, subscription_plan, billing_cycle } = await req.json();

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
    // CRITICAL: Use FRONTEND app URL, not Deno backend host
    // Stripe success_url must redirect to the frontend app page, not a function endpoint
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wise-sparrow-76-ggbq403gfxsv.base44.app';
    console.log('=== createCheckoutSession ===');
    console.log('Request origin (backend):', new URL(req.url).origin);
    console.log('Frontend URL (for Stripe redirect):', frontendUrl);
    console.log('Tenant ID:', tenant.id);
    const subscriptionData = {
      metadata: {
        tenant_id: tenant.id,
        subscription_plan,
        billing_cycle
      }
    };

    console.log('Stripe URLs:', {
      success_url: `${frontendUrl}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?tab=billing`
    });

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
      success_url: `${frontendUrl}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?tab=billing`,
      metadata: {
        tenant_id: tenant.id,
        subscription_plan,
        frontend_url: frontendUrl
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      allow_promotion_codes: true
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ 
      url: checkoutSession.url,
      session_id: checkoutSession.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});