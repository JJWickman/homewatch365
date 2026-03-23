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

    // Validate required fields
    if (!price_id || !company_id || !subscription_plan) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate user has access to this company
    const members = await base44.entities.CompanyMember.filter({ 
      user_email: user.email,
      company_id: company_id 
    });

    if (!members || members.length === 0) {
      return Response.json({ error: 'Access denied: You do not belong to this company' }, { status: 403 });
    }

    // Validate user is admin for subscription changes
    if (members[0].access_level !== 'admin' && !members[0].is_owner) {
      return Response.json({ error: 'Admin access required to change subscription' }, { status: 403 });
    }

    // Get company
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    const company = companies[0];

    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = company.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: {
          company_id: company.id,
          user_email: user.email
        }
      });
      
      customerId = customer.id;
      
      await base44.asServiceRole.entities.Company.update(company.id, {
        stripe_customer_id: customerId
      });
    }

    // Create checkout session - only add trial for new customers (not upgrading from trial)
    const subscriptionData = {
      metadata: {
        company_id: company.id,
        subscription_plan,
        billing_cycle
      }
    };
    
    // Only include trial if they don't already have an active trial or subscription
    if (company.subscription_status !== 'trial' && !company.stripe_subscription_id) {
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
      success_url: `${new URL(req.url).origin}/Dashboard?checkout=success`,
      cancel_url: `${new URL(req.url).origin}/Settings?tab=billing`,
      metadata: {
        company_id: company.id,
        subscription_plan,
        billing_cycle
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      allow_promotion_codes: true,
    };

    // Add promo code if provided
    if (promo_code) {
      sessionParams.discounts = [{ promotion_code: promo_code }];
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