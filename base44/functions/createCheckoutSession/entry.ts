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

    const { price_id, subscription_plan, billing_cycle, company_name, slug, email } = await req.json();

    // For paid signups, NO tenant exists yet — create Stripe customer by email
    const customer = await stripe.customers.create({
      email: email || user.email,
      metadata: { user_id: user.id }
    });
    const customerId = customer.id;

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wise-sparrow-76-ggbq403gfxsv.base44.app';
    console.log('=== createCheckoutSession (paid signup, no tenant yet) ===');
    console.log('User:', user.id, '| Plan:', subscription_plan, '| Company:', company_name);

    const subscriptionData = {
      metadata: {
        subscription_plan,
        billing_cycle,
        company_name,
        slug,
        email: email || user.email,
        user_id: user.id
      }
    };

    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      submit_type: 'subscribe',
      payment_method_types: ['card'],
      payment_method_collection: 'if_required',
      line_items: [{ price: price_id, quantity: 1 }],
      subscription_data: subscriptionData,
      success_url: `${frontendUrl}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/CompanyOnboarding`,
      metadata: {
        user_id: user.id,
        subscription_plan,
        company_name,
        slug,
        email: email || user.email
      },
      payment_method_options: { card: { request_three_d_secure: 'automatic' } },
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