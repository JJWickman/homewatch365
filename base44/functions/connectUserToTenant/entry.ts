import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, tenantSlug } = await req.json();

    // Find tenant by slug
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ slug: tenantSlug });
    if (tenants.length === 0) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const tenant = tenants[0];

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    // Check if TenantUser already exists
    const existingLinks = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: tenant.id
    });

    if (existingLinks.length > 0) {
      return Response.json({ 
        message: 'User already linked to this tenant',
        tenantUser: existingLinks[0]
      });
    }

    // Create TenantUser link
    const tenantUser = await base44.asServiceRole.entities.TenantUser.create({
      user_id: user.id,
      tenant_id: tenant.id,
      role_in_tenant: 'admin',
      is_owner: true,
      is_active: true
    });

    // Set primary_tenant_id on user
    await base44.auth.updateMe({ primary_tenant_id: tenant.id });

    return Response.json({
      success: true,
      message: `Connected ${email} to ${tenant.name}`,
      tenantUser,
      tenant
    });
  } catch (error) {
    console.error('Error connecting user to tenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});