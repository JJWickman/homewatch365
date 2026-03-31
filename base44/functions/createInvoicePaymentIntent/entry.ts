import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { statement_id } = await req.json();

    // Get statement
    const statements = await base44.asServiceRole.entities.MonthlyStatement.filter({ id: statement_id });
    if (statements.length === 0) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }

    const statement = statements[0];

    if (statement.status === 'paid') {
      return Response.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Get tenant
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: statement.tenant_id });
    const company = tenants[0];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(statement.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        statement_id: statement.id,
        tenant_id: statement.tenant_id,
        client_id: statement.client_id
      },
      stripe_account: company.stripe_connect_account_id || undefined
    });

    return Response.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});