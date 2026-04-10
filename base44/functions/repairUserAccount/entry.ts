import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// One-time repair function to fix users whose checkout completed but tenant setup failed
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { user_email } = body;

    if (!user_email) {
      return Response.json({ error: 'user_email required' }, { status: 400 });
    }

    // Find the user
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: `No user found with email: ${user_email}` }, { status: 404 });
    }
    const targetUser = users[0];

    // Check if they already have a primary_tenant_id
    if (targetUser.primary_tenant_id || targetUser.data?.primary_tenant_id) {
      return Response.json({ 
        message: 'User already has a tenant', 
        primary_tenant_id: targetUser.primary_tenant_id || targetUser.data?.primary_tenant_id 
      });
    }

    // Try to find a tenant by the user's email (created_by_email)
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ created_by_email: user_email });
    
    if (tenants.length === 0) {
      return Response.json({ 
        error: 'No tenant found for this user. Manual intervention needed.',
        user_id: targetUser.id,
        user_email: user_email
      }, { status: 404 });
    }

    const tenant = tenants[0];
    const tenantId = tenant.id;

    // Ensure TenantUser record exists
    const existingTU = await base44.asServiceRole.entities.TenantUser.filter({ user_id: targetUser.id, tenant_id: tenantId });
    if (existingTU.length === 0) {
      await base44.asServiceRole.entities.TenantUser.create({
        user_id: targetUser.id,
        tenant_id: tenantId,
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
      console.log(`Created TenantUser for ${user_email}`);
    }

    // Set primary_tenant_id on user
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      primary_tenant_id: tenantId,
      role: 'admin'
    });

    // Seed products if not already done
    try {
      await base44.asServiceRole.functions.invoke('seedDefaultProducts', { tenant_id: tenantId });
    } catch(e) { console.log('product seeding skipped:', e.message); }

    return Response.json({
      success: true,
      message: `Repaired account for ${user_email}`,
      user_id: targetUser.id,
      tenant_id: tenantId,
      tenant_name: tenant.name
    });
  } catch (error) {
    console.error('Error repairing user account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});