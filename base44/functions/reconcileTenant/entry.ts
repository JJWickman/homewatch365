import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetEmail = 'jasonwi@live.com';

    // Find the tenant with bocahomewatch slug (has all sample data)
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ slug: 'bocahomewatch' });
    if (tenants.length === 0) {
      return Response.json({ error: 'Tenant bocahomewatch not found' }, { status: 404 });
    }
    const correctTenant = tenants[0];

    // Verify it has sample data
    const clients = await base44.asServiceRole.entities.Client.filter({ tenant_id: correctTenant.id });
    if (clients.length === 0) {
      return Response.json({ error: 'bocahomewatch has no clients - wrong tenant' }, { status: 400 });
    }

    // Get or find the user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === targetEmail);
    
    if (!targetUser) {
      return Response.json({ error: `User ${targetEmail} not found` }, { status: 404 });
    }

    // Ensure TenantUser exists for this user in correct tenant
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: targetUser.id,
      tenant_id: correctTenant.id
    });

    if (tenantUsers.length === 0) {
      // Create TenantUser
      await base44.asServiceRole.entities.TenantUser.create({
        user_id: targetUser.id,
        tenant_id: correctTenant.id,
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
    }

    // Update user's primary_tenant_id
    await base44.auth.updateMe({
      primary_tenant_id: correctTenant.id
    });

    return Response.json({
      success: true,
      message: `Consolidated ${targetEmail} to tenant ${correctTenant.name}`,
      tenant: {
        id: correctTenant.id,
        name: correctTenant.name,
        slug: correctTenant.slug
      },
      stats: {
        clients: clients.length,
        user_primary_tenant: correctTenant.id
      }
    });

  } catch (error) {
    console.error('Error in reconcileTenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});