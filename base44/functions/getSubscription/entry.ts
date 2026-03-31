import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.2.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    // Get tenant details
    const tenants = await base44.entities.Tenant.filter({ id: tenant_id });
    if (!tenants || tenants.length === 0) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const company = tenants[0];

    if (!company.stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        customer: subscription.customer,
        items: subscription.items.data.map(item => ({
          price: item.price.id,
          amount: item.price.unit_amount / 100,
          currency: item.price.currency,
          product: item.price.product,
        })),
        next_pending_invoice_item_invoice: subscription.next_pending_invoice_item_invoice,
      },
    });
  } catch (error) {
    console.error('Error retrieving subscription:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});