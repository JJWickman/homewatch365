import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

    // If promo_code provided, look up the Stripe promotion code ID from the DB
    let stripePromotionCodeId = null;
    if (promo_code) {
      try {
        const promos = await base44.asServiceRole.entities.Promotion.filter({ code: promo_code.toUpperCase() });
        if (promos.length > 0 && promos[0].stripe_promotion_code_id) {
          stripePromotionCodeId = promos[0].stripe_promotion_code_id;
        }
      } catch (e) {
        console.log('Could not look up promo code:', e.message);
      }
    }

    // Validate required fields
    if (!price_id || !company_id || !subscription_plan) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate user is part of tenant (or it's their primary tenant from onboarding)
    const isUsersTenant = user.primary_tenant_id === company_id;
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: company_id
    });
    
    // Allow if primary tenant from onboarding OR if they have a TenantUser record
    if (!isUsersTenant && (!tenantUsers || tenantUsers.length === 0)) {
      return Response.json({ error: 'Access denied: You do not belong to this tenant' }, { status: 403 });
    }

    // Validate user is admin (if TenantUser exists, they must be admin)
    if (tenantUsers.length > 0 && tenantUsers[0].role_in_tenant !== 'admin' && !tenantUsers[0].is_owner) {
      return Response.json({ error: 'Admin access required to change subscription' }, { status: 403 });
    }

    // Get tenant
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: company_id });
    const tenant = tenants[0];

    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = tenant.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: {
          tenant_id: tenant.id,
          user_email: user.email
        }
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
    
    // Only include trial for trial plans, never for paid plans
    if (subscription_plan === 'trial') {
      subscriptionData.trial_period_days = 14;
    }

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
      success_url: `${new URL(req.url).origin}/?checkout=success&tenant_id=${company_id}`,
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

    // Add promo code if found in DB, otherwise allow manual entry
    if (stripePromotionCodeId) {
      sessionParams.discounts = [{ promotion_code: stripePromotionCodeId }];
    } else {
      sessionParams.allow_promotion_codes = true;
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