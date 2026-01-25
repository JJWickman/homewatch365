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

    const { price_id, company_id, subscription_plan, billing_cycle } = await req.json();

    // Get or create company
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

    // Create checkout session with 14-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          company_id: company.id,
          subscription_plan,
          billing_cycle
        }
      },
      success_url: 'https://app.example.com/Settings?tab=billing&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://app.example.com/Settings?tab=billing',
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
    });

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