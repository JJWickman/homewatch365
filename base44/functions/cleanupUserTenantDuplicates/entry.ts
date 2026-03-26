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
    const targetTenantId = tenants[0].id;

    // Get ALL TenantUser records for this user
    const userTenantUsers = await base44.asServiceRole.entities.TenantUser.filter({ user_id: user.id });
    
    console.log(`Found ${userTenantUsers.length} TenantUser records for user ${user.id}`);
    userTenantUsers.forEach(tu => {
      console.log(`  - TenantUser ID: ${tu.id}, Tenant: ${tu.tenant_id}, Role: ${tu.role_in_tenant}`);
    });

    // Keep only the bocahomewatch one, delete the rest
    const toDelete = userTenantUsers.filter(tu => tu.tenant_id !== targetTenantId);
    let deletedCount = 0;
    
    for (const tu of toDelete) {
      try {
        await base44.asServiceRole.entities.TenantUser.delete(tu.id);
        deletedCount++;
        console.log(`Deleted TenantUser ${tu.id} for tenant ${tu.tenant_id}`);
      } catch (e) {
        console.log(`Failed to delete TenantUser ${tu.id}:`, e.message);
      }
    }

    // Ensure the bocahomewatch one is admin and owner
    const bocahomewatch = userTenantUsers.find(tu => tu.tenant_id === targetTenantId);
    if (bocahomewatch) {
      await base44.asServiceRole.entities.TenantUser.update(bocahomewatch.id, {
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
      console.log(`Updated bocahomewatch TenantUser to admin/owner`);
    }

    return Response.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate TenantUser records`,
      user_id: user.id,
      email: user.email,
      deletedCount,
      bocanohomewatch_tenant_id: targetTenantId
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});