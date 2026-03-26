import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bocahomewatch tenant
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ slug: 'bocahomewatch' });
    if (tenants.length === 0) {
      return Response.json({ error: 'Tenant bocahomewatch not found' }, { status: 404 });
    }
    const tenantId = tenants[0].id;

    // Set user's primary_tenant_id
    await base44.auth.updateMe({
      primary_tenant_id: tenantId
    });

    return Response.json({
      success: true,
      message: `User's primary_tenant_id set to bocahomewatch (${tenantId})`,
      tenant_id: tenantId,
      tenant_slug: 'bocahomewatch'
    });

  } catch (error) {
    console.error('Error in fixUserTenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});