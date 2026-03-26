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

    // Get ALL TenantUser records
    const allTenantUsers = await base44.asServiceRole.entities.TenantUser.list();
    
    // Delete TenantUser records NOT for bocahomewatch
    const toDelete = allTenantUsers.filter(tu => tu.tenant_id !== targetTenantId);
    let deletedTenantUsers = 0;
    
    for (const tu of toDelete) {
      try {
        await base44.asServiceRole.entities.TenantUser.delete(tu.id);
        deletedTenantUsers++;
      } catch (e) {
        console.log(`Failed to delete TenantUser ${tu.id}:`, e.message);
      }
    }

    // Get ALL Tenant records
    const allTenants = await base44.asServiceRole.entities.Tenant.list();
    
    // Deactivate other Tenants (don't hard delete in case of dependencies)
    const otherTenants = allTenants.filter(t => t.id !== targetTenantId);
    let deactivatedTenants = 0;
    
    for (const tenant of otherTenants) {
      try {
        await base44.asServiceRole.entities.Tenant.update(tenant.id, { is_active: false });
        deactivatedTenants++;
      } catch (e) {
        console.log(`Failed to deactivate Tenant ${tenant.id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      message: 'App locked down to bocahomewatch tenant',
      actions: {
        tenantUserRecordsDeleted: deletedTenantUsers,
        otherTenantsDeactivated: deactivatedTenants,
        activeTargetTenant: targetTenantId
      }
    });

  } catch (error) {
    console.error('Error in lockdownToSingleTenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});