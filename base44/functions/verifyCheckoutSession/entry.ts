import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { sessionId } = await req.json();
    
    // Create client with appId from environment
    const appId = Deno.env.get('BASE44_APP_ID');
    const base44 = createClientFromRequest(req, { appId });

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.metadata?.tenant_id) {
      return Response.json({ success: false, error: 'No tenant in session' }, { status: 400 });
    }

    // Check if tenant subscription was updated by webhook using service role
    const tenants = await base44.asServiceRole.entities.Tenant.filter({
      id: session.metadata.tenant_id
    });

    if (tenants.length > 0) {
      const tenant = tenants[0];
      if (tenant.subscription_status === 'active' || tenant.subscription_status === 'trial') {
        return Response.json({ success: true });
      }
    }

    return Response.json({ success: false });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});