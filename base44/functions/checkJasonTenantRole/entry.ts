import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.email !== 'jason@agilidy.com') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: user.primary_tenant_id
    });

    if (tenantUsers.length === 0) {
      // Missing TenantUser — create it
      const newTenantUser = await base44.asServiceRole.entities.TenantUser.create({
        user_id: user.id,
        tenant_id: user.primary_tenant_id,
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
      return Response.json({ 
        message: 'TenantUser created as admin',
        tenantUser: newTenantUser 
      });
    }

    const tenantUser = tenantUsers[0];
    if (tenantUser.role_in_tenant !== 'admin' || !tenantUser.is_owner) {
      // Fix incorrect role
      const updated = await base44.asServiceRole.entities.TenantUser.update(tenantUser.id, {
        role_in_tenant: 'admin',
        is_owner: true
      });
      return Response.json({ 
        message: 'TenantUser role fixed to admin',
        tenantUser: updated 
      });
    }

    return Response.json({ 
      message: 'TenantUser is correct',
      tenantUser 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});