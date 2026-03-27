import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
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

    const { tenant_id, price_id } = await req.json();

    if (!tenant_id || !price_id) {
      return Response.json({ error: 'Missing tenant_id or price_id' }, { status: 400 });
    }

    // Verify user belongs to this tenant
    const tenantUsers = await base44.entities.TenantUser.filter({ 
      user_id: user.id,
      tenant_id: tenant_id 
    });

    if (!tenantUsers || tenantUsers.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    if (tenantUsers[0].role_in_tenant !== 'admin' && !tenantUsers[0].is_owner) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get tenant details
    const tenants = await base44.entities.Tenant.filter({ id: tenant_id });
    if (!tenants || tenants.length === 0) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenants[0];

    if (!tenant.stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);

    if (!subscription || subscription.status === 'canceled') {
      return Response.json({ error: 'Subscription not found or already canceled' }, { status: 404 });
    }

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      tenant.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: price_id,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    console.log('Subscription updated successfully:', updatedSubscription.id);

    return Response.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_start: updatedSubscription.current_period_start,
        current_period_end: updatedSubscription.current_period_end,
        items: updatedSubscription.items.data.map(item => ({
          price: item.price.id,
          amount: item.price.unit_amount / 100,
          currency: item.price.currency,
        })),
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});