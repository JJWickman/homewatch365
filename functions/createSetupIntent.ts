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

    console.log('createSetupIntent called for company_id:', company_id);

    // Get company
    const company = await base44.entities.Company.get(company_id);
    if (!company) {
      console.error('Company not found:', company_id);
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    console.log('Found company:', company.name);

    // Create or get Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: company.email || user.email,
        name: company.name,
        metadata: {
          company_id: company.id
        }
      });

      customerId = customer.id;
      console.log('Created Stripe customer:', customerId);

      // Update company with Stripe customer ID
      await base44.asServiceRole.entities.Company.update(company.id, {
        stripe_customer_id: customerId
      });
    } else {
      console.log('Using existing Stripe customer:', customerId);
    }

    // Create SetupIntent
    console.log('Creating SetupIntent...');
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    console.log('SetupIntent created:', setupIntent.id);
    console.log('Client secret:', setupIntent.client_secret ? 'present' : 'missing');

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