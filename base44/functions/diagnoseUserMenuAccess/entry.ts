import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target tenant
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ slug: 'bocahomewatch' });
    const targetTenantId = tenants[0]?.id;

    console.log('=== USER DIAGNOSIS ===');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Full Name:', user.full_name);
    console.log('User primary_tenant_id:', user.primary_tenant_id);
    console.log('Target bocahomewatch ID:', targetTenantId);

    // Get all TenantUser records for this user
    const allTenantUsers = await base44.asServiceRole.entities.TenantUser.filter({ user_id: user.id });
    console.log('\n=== TENANT USER RECORDS ===');
    console.log('Total TenantUser records:', allTenantUsers.length);
    allTenantUsers.forEach((tu, i) => {
      console.log(`[${i}] ID: ${tu.id}`);
      console.log(`    Tenant: ${tu.tenant_id}`);
      console.log(`    Role: ${tu.role_in_tenant}`);
      console.log(`    Owner: ${tu.is_owner}`);
      console.log(`    Active: ${tu.is_active}`);
    });

    // Check what the layout sees
    const bocahomewatch = allTenantUsers.find(tu => tu.tenant_id === targetTenantId);
    console.log('\n=== WHAT LAYOUT SHOULD SEE ===');
    console.log('Bocahomewatch TenantUser found:', !!bocahomewatch);
    if (bocahomewatch) {
      console.log('Role in tenant:', bocahomewatch.role_in_tenant);
      console.log('Is admin/owner:', bocahomewatch.role_in_tenant === 'admin' || bocahomewatch.is_owner);
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        primary_tenant_id: user.primary_tenant_id,
        full_name: user.full_name
      },
      targetTenant: {
        id: targetTenantId,
        slug: 'bocahomewatch'
      },
      tenantUsers: allTenantUsers.map(tu => ({
        id: tu.id,
        tenant_id: tu.tenant_id,
        role: tu.role_in_tenant,
        is_owner: tu.is_owner,
        is_active: tu.is_active
      })),
      bocahomewatchTenantUser: bocahomewatch ? {
        id: bocahomewatch.id,
        role: bocahomewatch.role_in_tenant,
        is_owner: bocahomewatch.is_owner,
        is_active: bocahomewatch.is_active
      } : null,
      layoutWillShowFullMenu: bocahomewatch && (bocahomewatch.role_in_tenant === 'admin' || bocahomewatch.is_owner) && bocahomewatch.is_active
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});