import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // For webhooks, use service role directly (no user auth required)
    const base44 = createClientFromRequest(req);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata.tenant_id;
        
        // Set to trial if subscription has trial period, otherwise active
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const status = subscription.status === 'trialing' ? 'trial' : 'active';
        
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          subscription_plan: subscriptionPlan,
          subscription_status: status,
          stripe_subscription_id: session.subscription,
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get tenant_id from subscription metadata or customer metadata
        let tenantId = subscription.metadata?.tenant_id;
        if (!tenantId) {
          const customer = await stripe.customers.retrieve(subscription.customer);
          tenantId = customer.metadata?.tenant_id;
        }
        
        let status = 'active';
        if (subscription.status === 'past_due') status = 'past_due';
        if (subscription.status === 'canceled') status = 'cancelled';
        if (subscription.status === 'unpaid') status = 'past_due';
        if (subscription.status === 'trialing') status = 'trial';
        
        // Use plan from subscription metadata (set at checkout time) — no hardcoded price IDs
        let subscriptionPlan = subscription.metadata?.subscription_plan || 'solopreneur';
        
        if (tenantId) {
          const hasCrm = subscriptionPlan.includes('_crm') || subscriptionPlan === 'enterprise';
          await base44.asServiceRole.entities.Tenant.update(tenantId, {
            subscription_plan: subscriptionPlan,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            marketing_addon_active: hasCrm
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenant_id;
        
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          subscription_status: 'cancelled',
          subscription_plan: 'trial'
        });
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        
        if (tenantId) {
          await base44.asServiceRole.entities.Tenant.update(tenantId, {
            subscription_status: 'past_due'
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});