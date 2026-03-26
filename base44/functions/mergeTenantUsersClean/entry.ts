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

    // Get all TenantUser records for this user
    const allTenantUsers = await base44.asServiceRole.entities.TenantUser.filter({ user_id: user.id });

    let deletedCount = 0;
    let keptId = null;

    // Delete all EXCEPT the one for bocahomewatch
    for (const tu of allTenantUsers) {
      if (tu.tenant_id !== targetTenantId) {
        await base44.asServiceRole.entities.TenantUser.delete(tu.id);
        deletedCount++;
        console.log(`Deleted TenantUser ${tu.id} (tenant: ${tu.tenant_id})`);
      } else {
        keptId = tu.id;
      }
    }

    // Ensure the kept one (bocahomewatch) has correct permissions
    if (keptId) {
      await base44.asServiceRole.entities.TenantUser.update(keptId, {
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
      console.log(`Updated TenantUser ${keptId} with admin/owner permissions`);
    }

    // Verify user's primary_tenant_id is set
    if (user.primary_tenant_id !== targetTenantId) {
      await base44.auth.updateMe({ primary_tenant_id: targetTenantId });
      console.log(`Updated user primary_tenant_id to ${targetTenantId}`);
    }

    return Response.json({
      success: true,
      message: 'Merged to single clean TenantUser',
      deletedOtherTenantUsers: deletedCount,
      keptTenantUser: keptId,
      targetTenant: targetTenantId,
      userPrimaryTenantId: user.primary_tenant_id
    });

  } catch (error) {
    console.error('Error in mergeTenantUsersClean:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});