import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email = 'jasonwi@live.com' } = await req.json();

    // Get user by email (service role)
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found', email }, { status: 404 });
    }

    const user = users[0];
    console.log('User found:', user.email, 'Role:', user.role);

    // Check if user is superadmin
    const isSuperadmin = user.role === 'superadmin';
    console.log('Is superadmin:', isSuperadmin);

    // Get all tenants to find BocaHomeWatch
    const tenants = await base44.asServiceRole.entities.Tenant.filter({});
    const bocaTenant = tenants.find(t => t.name.toLowerCase().includes('boca'));
    console.log('Found tenant:', bocaTenant?.name, 'ID:', bocaTenant?.id);

    if (!bocaTenant) {
      return Response.json({
        status: 'error',
        message: 'BocaHomeWatch tenant not found',
        user,
        isSuperadmin
      });
    }

    // Check TenantUser record
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: bocaTenant.id
    });

    console.log('Existing TenantUser records:', tenantUsers.length);

    let tenantUserRecord = tenantUsers[0];

    // If missing, create it
    if (!tenantUserRecord) {
      console.log('Creating TenantUser record...');
      tenantUserRecord = await base44.asServiceRole.entities.TenantUser.create({
        user_id: user.id,
        tenant_id: bocaTenant.id,
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
      console.log('TenantUser created');
    } else if (tenantUserRecord.role_in_tenant !== 'admin') {
      console.log('Updating TenantUser role to admin...');
      await base44.asServiceRole.entities.TenantUser.update(tenantUserRecord.id, {
        role_in_tenant: 'admin',
        is_owner: true
      });
    }

    // Check clients and properties
    const clients = await base44.asServiceRole.entities.Client.filter({
      tenant_id: bocaTenant.id
    });
    const properties = await base44.asServiceRole.entities.Property.filter({
      tenant_id: bocaTenant.id
    });

    console.log(`Clients in BocaHomeWatch: ${clients.length}, Properties: ${properties.length}`);

    return Response.json({
      status: 'ok',
      user: { id: user.id, email: user.email, role: user.role },
      isSuperadmin,
      tenant: { id: bocaTenant.id, name: bocaTenant.name },
      tenantUser: {
        id: tenantUserRecord.id,
        role_in_tenant: tenantUserRecord.role_in_tenant,
        is_owner: tenantUserRecord.is_owner,
        is_active: tenantUserRecord.is_active
      },
      data: {
        clients_count: clients.length,
        properties_count: properties.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});