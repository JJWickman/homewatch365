import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = '69c4784908cbd3c8bce515f0';

    await base44.asServiceRole.entities.TenantUser.create({
      user_id: user.id,
      tenant_id: tenantId,
      role_in_tenant: 'admin',
      is_owner: true,
      is_active: true
    });

    return Response.json({ success: true, message: 'TenantUser recreated' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});