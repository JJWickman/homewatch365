import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tenants for this user
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({ user_id: user.id });
    
    const results = [];
    for (const tu of tenantUsers) {
      const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tu.tenant_id });
      const tenant = tenants[0];
      
      if (tenant) {
        const clients = await base44.asServiceRole.entities.Client.filter({ tenant_id: tenant.id });
        const properties = await base44.asServiceRole.entities.Property.filter({ tenant_id: tenant.id });
        
        results.push({
          tenant_id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role_in_tenant: tu.role_in_tenant,
          clients_count: clients.length,
          properties_count: properties.length,
          sample_clients: clients.slice(0, 2).map(c => `${c.first_name} ${c.last_name}`)
        });
      }
    }

    return Response.json({
      user_email: user.email,
      user_primary_tenant_id: user.primary_tenant_id,
      tenants: results
    });

  } catch (error) {
    console.error('Error in findDataTenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});