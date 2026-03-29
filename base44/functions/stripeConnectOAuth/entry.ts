import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const companyId = url.searchParams.get('state');

    if (!code) {
      return Response.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Exchange authorization code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    // Store the connected account ID in the tenant record
    await base44.asServiceRole.entities.Tenant.update(companyId, {
      stripe_connect_account_id: response.stripe_user_id
    });

    // Redirect back to settings page
    const appUrl = new URL(req.url).origin;
    return Response.redirect(`${appUrl}/Settings?tab=admin&stripe_connected=true`, 302);
  } catch (error) {
    console.error('Stripe Connect OAuth error:', error);
    const appUrl = new URL(req.url).origin;
    return Response.redirect(`${appUrl}/Settings?tab=admin&stripe_error=${encodeURIComponent(error.message)}`, 302);
  }
});