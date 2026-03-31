import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@18.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify this is an admin operation (service role)
    const body = await req.json();
    const { event } = body;

    if (!event || event.type !== 'delete' || event.entity_name !== 'Tenant') {
      return Response.json({ success: false, message: 'Invalid event' }, { status: 400 });
    }

    const tenantId = event.entity_id;

    // Fetch the tenant record before deletion to get stripe_customer_id
    let stripeCustomerId = null;

    try {
      const tenant = await base44.asServiceRole.entities.Tenant.get(tenantId);
      stripeCustomerId = tenant?.stripe_customer_id;
    } catch (err) {
      // Tenant already deleted, stripe_customer_id may not be available
      console.log('Tenant not found, skipping Stripe cleanup');
      return Response.json({ success: true, message: 'Tenant not found, skipped cleanup' }, { status: 200 });
    }

    if (!stripeCustomerId) {
      return Response.json({ success: true, message: 'No Stripe customer ID found' }, { status: 200 });
    }

    // Delete the Stripe customer (this also cancels all subscriptions)
    try {
      await stripe.customers.del(stripeCustomerId);
      console.log(`Deleted Stripe customer: ${stripeCustomerId}`);
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing') {
        console.log(`Stripe customer already deleted: ${stripeCustomerId}`);
      } else {
        throw stripeError;
      }
    }

    return Response.json({ success: true, message: 'Stripe customer deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting company from Stripe:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});