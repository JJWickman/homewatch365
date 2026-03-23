import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();

    await base44.asServiceRole.entities.Company.update(company_id, {
      stripe_customer_id: null
    });

    return Response.json({ success: true, message: 'Stripe customer ID cleared' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});