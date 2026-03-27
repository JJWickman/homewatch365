import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty or invalid JSON body is okay
    }
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, return_url } = body;

    // Get tenant from user's primary_tenant_id
    let tenant;
    
    if (tenant_id) {
      const tenants = await base44.entities.Tenant.filter({ id: tenant_id });
      if (tenants.length === 0) {
        return Response.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenant = tenants[0];
    } else if (user?.primary_tenant_id) {
      const tenants = await base44.entities.Tenant.filter({ id: user.primary_tenant_id });
      if (tenants.length === 0) {
        return Response.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenant = tenants[0];
    } else {
      return Response.json({ error: 'No tenant found for user' }, { status: 404 });
    }

    // Create Stripe customer if it doesn't exist
    let customerId = tenant.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: {
          tenant_id: tenant.id,
          user_email: user.email
        }
      });
      
      customerId = customer.id;
      
      await base44.asServiceRole.entities.Tenant.update(tenant.id, {
        stripe_customer_id: customerId
      });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${new URL(req.url).origin}/Settings?tab=billing&payment_updated=true`,
    });

    return Response.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});