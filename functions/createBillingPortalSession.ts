import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, return_url } = await req.json();

    // Get company
    const companies = await base44.entities.Company.filter({ id: company_id });
    if (companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companies[0];

    // Create Stripe customer if it doesn't exist
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

    const { return_url } = await req.json();

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${new URL(req.url).origin}/Settings?tab=billing&payment_updated=true`,
    });

    return Response.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});