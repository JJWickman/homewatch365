import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Verify user is owner/admin of this tenant
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: tenant_id
    });

    if (!tenantUsers || tenantUsers.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Set primary_tenant_id now that checkout succeeded
    await base44.auth.updateMe({
      primary_tenant_id: tenant_id
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error finalizing onboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});