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

    const { company_id } = await req.json();

    // Get company
    const companies = await base44.entities.Company.filter({ id: company_id });
    if (companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companies[0];

    // Create or get Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email || user.email,
        name: company.name,
        metadata: {
          company_id: company.id
        }
      });

      customerId = customer.id;

      // Update company with Stripe customer ID
      await base44.asServiceRole.entities.Company.update(company.id, {
        stripe_customer_id: customerId
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return Response.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});