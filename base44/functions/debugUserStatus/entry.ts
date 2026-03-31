import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const tenants = user.primary_tenant_id ? await base44.asServiceRole.entities.Tenant.filter({ id: user.primary_tenant_id }) : [];

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        onboarding_completed: user.onboarding_completed,
        primary_tenant_id: user.primary_tenant_id
      },
      tenant: tenants.length > 0 ? {
        id: tenants[0].id,
        name: tenants[0].name,
        subscription_plan: tenants[0].subscription_plan,
        subscription_status: tenants[0].subscription_status
      } : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});