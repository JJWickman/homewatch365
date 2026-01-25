import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId = session.metadata.company_id;
        const subscriptionPlan = session.metadata.subscription_plan;
        
        // Set to trial if subscription has trial period, otherwise active
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const status = subscription.status === 'trialing' ? 'trial' : 'active';
        
        await base44.asServiceRole.entities.Company.update(companyId, {
          subscription_plan: subscriptionPlan,
          subscription_status: status,
          stripe_subscription_id: session.subscription,
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get company_id from subscription metadata or customer metadata
        let companyId = subscription.metadata?.company_id;
        if (!companyId) {
          const customer = await stripe.customers.retrieve(subscription.customer);
          companyId = customer.metadata?.company_id;
        }
        
        let status = 'active';
        if (subscription.status === 'past_due') status = 'past_due';
        if (subscription.status === 'canceled') status = 'cancelled';
        if (subscription.status === 'unpaid') status = 'past_due';
        if (subscription.status === 'trialing') status = 'trial';
        
        // Get the current plan from the subscription items
        const currentItem = subscription.items.data[0];
        const priceId = currentItem?.price?.id;
        
        // Map price_id to subscription plan (live prices)
        let subscriptionPlan = 'solopreneur';
        const prices = {
          'solopreneur': ['price_1StZzpGwUVhIPcgxL7HiPZEJ', 'price_1StZzpGwUVhIPcgxkMp5kbKe'],
          'growth': ['price_1StZzpGwUVhIPcgxRSLH94NJ', 'price_1StZzpGwUVhIPcgxZzv8KbYN'],
          'professional': ['price_1StZzqGwUVhIPcgx5UJRLUfb', 'price_1StZzqGwUVhIPcgxaIaDPAO6'],
          'enterprise': ['price_1StZzqGwUVhIPcgxOWFkoHih', 'price_1StZzqGwUVhIPcgxpFrillOn']
        };
        
        for (const [plan, priceIds] of Object.entries(prices)) {
          if (priceIds.includes(priceId)) {
            subscriptionPlan = plan;
            break;
          }
        }
        
        if (companyId) {
          await base44.asServiceRole.entities.Company.update(companyId, {
            subscription_plan: subscriptionPlan,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const companyId = subscription.metadata.company_id;
        
        await base44.asServiceRole.entities.Company.update(companyId, {
          subscription_status: 'cancelled',
          subscription_plan: 'solopreneur'
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
        const companyId = invoice.subscription_details?.metadata?.company_id;
        
        if (companyId) {
          await base44.asServiceRole.entities.Company.update(companyId, {
            subscription_status: 'past_due'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});