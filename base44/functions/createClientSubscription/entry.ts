import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { client_id, company_id, email, amount, billing_frequency, product_service_id } = await req.json();

    if (!client_id || !company_id || !email || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load company
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    const company = companies[0];
    if (!company) return Response.json({ error: 'Company not found' }, { status: 404 });

    // Load client
    const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
    const client = clients[0];
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    // Determine if company has a connected Stripe account — use it if available
    const connectedAccountId = company.stripe_connect_account_id;
    const stripeOptions = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

    // Get or create Stripe customer
    let customerId = client.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        name: `${client.first_name} ${client.last_name}`,
        metadata: { client_id: client.id, company_id: company.id }
      }, stripeOptions);
      
      customerId = customer.id;
      await base44.asServiceRole.entities.Client.update(client.id, {
        stripe_customer_id: customerId
      });
    }

    // Determine billing interval
    let interval = 'month';
    let intervalCount = 1;
    if (billing_frequency === 'quarterly') {
      intervalCount = 3;
    } else if (billing_frequency === 'annually') {
      interval = 'year';
    }

    let priceId;

    // Try to use existing stripe_price_id from the ProductService if provided
    if (product_service_id) {
      const productServices = await base44.asServiceRole.entities.ProductService.filter({ id: product_service_id });
      const productService = productServices[0];
      
      if (productService?.stripe_price_id) {
        // Validate the price is still active
        try {
          const existingPrice = await stripe.prices.retrieve(productService.stripe_price_id, {}, stripeOptions);
          if (existingPrice?.active) {
            priceId = productService.stripe_price_id;
          }
        } catch (e) {
          // Price not found, will create new
        }
      }
    }

    // If no valid price found, create a new product+price on the company's Stripe account
    if (!priceId) {
      const product = await stripe.products.create({
        name: `Home Watch Service - ${client.first_name} ${client.last_name}`,
        metadata: { client_id: client.id, company_id: company.id }
      }, stripeOptions);

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
        recurring: { interval, interval_count: intervalCount },
        metadata: { client_id: client.id, company_id: company.id }
      }, stripeOptions);

      priceId = price.id;
    }

    // Build checkout session params
    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin')}/ClientPortal?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/ClientPortal`,
      metadata: { client_id: client.id, company_id: company.id },
      subscription_data: {
        metadata: { client_id: client.id, company_id: company.id }
      },
      allow_promotion_codes: true,
    };

    // If using connected account, add payment_intent_data for platform fee (optional, 0% for now)
    // Uncomment and adjust if you want to take an application fee:
    // if (connectedAccountId) {
    //   sessionParams.payment_intent_data = { application_fee_amount: 0 };
    // }

    const session = await stripe.checkout.sessions.create(sessionParams, stripeOptions);

    return Response.json({ 
      url: session.url,
      session_id: session.id,
      connected_account: connectedAccountId || null
    });

  } catch (error) {
    console.error('Error creating client subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});