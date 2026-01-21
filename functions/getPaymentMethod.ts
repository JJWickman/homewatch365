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

    if (!company.stripe_customer_id) {
      return Response.json({ success: true, payment_method: null });
    }

    // Get default payment method from Stripe
    const customer = await stripe.customers.retrieve(company.stripe_customer_id);
    
    if (!customer.invoice_settings?.default_payment_method) {
      return Response.json({ success: true, payment_method: null });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(
      customer.invoice_settings.default_payment_method
    );

    return Response.json({
      success: true,
      payment_method: {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year
      }
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});