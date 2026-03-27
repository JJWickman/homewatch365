import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
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

    // For webhooks from Stripe (no auth headers), init with appId
    const appId = Deno.env.get('BASE44_APP_ID');
    const base44 = createClientFromRequest(req, { appId });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata?.tenant_id;
        const userId = session.metadata?.user_id;
        
        if (!tenantId) {
          console.log('checkout.session.completed: No tenant_id in metadata');
          break;
        }
        
        // Set subscription status to active immediately (subscription.updated will refine it later)
        const subscriptionPlan = session.metadata?.subscription_plan || 'solopreneur';
        const hasCrm = subscriptionPlan.includes('_crm') || subscriptionPlan === 'enterprise';
        
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          subscription_plan: subscriptionPlan,
          subscription_status: 'active',
          stripe_subscription_id: session.subscription,
          marketing_addon_active: hasCrm
        });
        
        // Set user's primary_tenant_id if user_id is in metadata
        if (userId) {
          try {
            // Query for the user and update their primary_tenant_id
            const userRecord = await base44.asServiceRole.entities.User.filter({ id: userId });
            if (userRecord.length > 0) {
              await base44.auth.updateMe({ primary_tenant_id: tenantId });
            }
          } catch (e) {
            console.log('Could not set primary_tenant_id from webhook:', e.message);
          }
        }
        
        console.log(`Checkout session ${session.id} completed and tenant ${tenantId} marked active`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        let tenantId = subscription.metadata?.tenant_id;
        if (!tenantId) {
          const customer = await stripe.customers.retrieve(subscription.customer);
          tenantId = customer.metadata?.tenant_id;
        }
        
        if (!tenantId) {
          console.error('Could not find tenant_id for subscription update');
          break;
        }
        
        let status = 'active';
        if (subscription.status === 'past_due') status = 'past_due';
        if (subscription.status === 'canceled') status = 'cancelled';
        if (subscription.status === 'unpaid') status = 'past_due';
        if (subscription.status === 'trialing') status = 'trial';
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          console.log(`Subscription ${subscription.id} is in ${subscription.status} status, not updating tenant yet`);
          break;
        }
        
        const subscriptionPlan = subscription.metadata?.subscription_plan || 'solopreneur';
        const hasCrm = subscriptionPlan.includes('_crm') || subscriptionPlan === 'enterprise';
        
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          subscription_plan: subscriptionPlan,
          subscription_status: status,
          stripe_subscription_id: subscription.id,
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          marketing_addon_active: hasCrm
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        
        if (!tenantId) {
          console.error('Could not find tenant_id for subscription deletion');
          break;
        }
        
        await base44.asServiceRole.entities.Tenant.update(tenantId, {
          subscription_status: 'cancelled',
          subscription_plan: 'trial'
        });
        break;
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
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});