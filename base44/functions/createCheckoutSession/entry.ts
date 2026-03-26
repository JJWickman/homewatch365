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

    const { price_id, company_id, subscription_plan, billing_cycle, return_url, promo_code } = await req.json();

    // Get tenant
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: company_id });
    if (!tenants.length) {
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

    // Only pass promo code to Stripe if it's valid AND won't make charge $0
    // (Promo codes that reduce to $0 trigger "Start trial" button which is misleading for paid plans)
    let stripePromotionCodeId = null;
    if (promo_code && subscription_plan !== 'trial') {
      try {
        const promos = await base44.asServiceRole.entities.Promotion.filter({ code: promo_code.toUpperCase() });
        if (promos.length > 0) {
          const promo = promos[0];
          // Only use promo if it doesn't result in $0 charge (discount, not free)
          if (promo.benefit_type === 'subscription_discount' && promo.discount_percent && promo.discount_percent < 100) {
            if (promo.stripe_promotion_code_id) {
              stripePromotionCodeId = promo.stripe_promotion_code_id;
            }
          }
        }
      } catch (e) {
        console.log('Could not validate promo code:', e.message);
      }
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
    };

    // Add promo code only if it won't reduce charge to $0
    if (stripePromotionCodeId) {
      sessionParams.discounts = [{ promotion_code: stripePromotionCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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