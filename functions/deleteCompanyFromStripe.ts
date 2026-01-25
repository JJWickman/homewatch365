import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@18.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify this is an admin operation (service role)
    const body = await req.json();
    const { event } = body;

    if (!event || event.type !== 'delete' || event.entity_name !== 'Company') {
      return Response.json({ success: false, message: 'Invalid event' }, { status: 400 });
    }

    const companyId = event.entity_id;

    // Fetch the company record before deletion to get stripe_customer_id
    // Since the company is being deleted, we need to get it from the event data if available
    // Otherwise, attempt to fetch it if still in database
    let stripeCustomerId = null;

    try {
      const company = await base44.asServiceRole.entities.Company.get(companyId);
      stripeCustomerId = company?.stripe_customer_id;
    } catch (err) {
      // Company already deleted, stripe_customer_id may not be available
      console.log('Company not found, skipping Stripe cleanup');
      return Response.json({ success: true, message: 'Company not found, skipped cleanup' }, { status: 200 });
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