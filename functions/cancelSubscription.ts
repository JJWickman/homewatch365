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

    const { company_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'Missing company_id' }, { status: 400 });
    }

    // Get company details
    const companies = await base44.entities.Company.filter({ id: company_id });
    if (!companies || companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companies[0];

    if (!company.stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel subscription
    const canceledSubscription = await stripe.subscriptions.del(company.stripe_subscription_id);

    // Update company record
    await base44.asServiceRole.entities.Company.update(company_id, {
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
    });

    console.log('Subscription canceled successfully:', canceledSubscription.id);

    return Response.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: canceledSubscription.canceled_at,
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});