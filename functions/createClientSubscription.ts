import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { client_id, company_id, email, amount, billing_frequency } = await req.json();

    if (!client_id || !company_id || !email || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get company to ensure it exists
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    const company = companies[0];

    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get or create client
    const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create or get Stripe customer for client
    let customerId = client.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        name: `${client.first_name} ${client.last_name}`,
        metadata: {
          client_id: client.id,
          company_id: company.id
        }
      });
      
      customerId = customer.id;
      
      await base44.asServiceRole.entities.Client.update(client.id, {
        stripe_customer_id: customerId
      });
    }

    // Determine interval based on billing frequency
    let interval = 'month';
    let intervalCount = 1;
    
    if (billing_frequency === 'quarterly') {
      intervalCount = 3;
    } else if (billing_frequency === 'annually') {
      interval = 'year';
    }

    // Create a product for this client's service
    const product = await stripe.products.create({
      name: `Property Management - ${client.first_name} ${client.last_name}`,
      metadata: {
        client_id: client.id,
        company_id: company.id
      }
    });

    // Create a price for this service
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: 'usd',
      recurring: {
        interval: interval,
        interval_count: intervalCount
      },
      metadata: {
        client_id: client.id,
        company_id: company.id
      }
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/ClientPortal?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/ClientPortal`,
      metadata: {
        client_id: client.id,
        company_id: company.id
      },
      subscription_data: {
        metadata: {
          client_id: client.id,
          company_id: company.id
        }
      },
      allow_promotion_codes: true,
    });

    return Response.json({ 
      url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Error creating client subscription:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});