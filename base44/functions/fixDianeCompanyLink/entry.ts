import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    
    // Find diane's TenantUser record
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const currentUser = users[0];
    const tenantId = currentUser.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'No tenant found for this user' }, { status: 404 });
    }
    
    // Verify tenant exists
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
    if (tenants.length === 0) {
      return Response.json({ error: 'Tenant record missing' }, { status: 404 });
    }

    // Ensure primary_tenant_id is set
    if (!currentUser.primary_tenant_id) {
      await base44.asServiceRole.entities.User.update(currentUser.id, {
        primary_tenant_id: tenantId,
        onboarding_completed: true
      });
    }

    return Response.json({
      success: true,
      message: `Fixed link for ${email}`,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        primary_tenant_id: tenantId
      },
      tenant: {
        id: tenants[0].id,
        name: tenants[0].name,
        subscription_plan: tenants[0].subscription_plan
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});