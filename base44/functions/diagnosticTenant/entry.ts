import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    // Fetch tenant details
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
    const tenant = tenants[0];

    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch counts for this tenant
    const [clients, properties, visits, tenantUsers] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ tenant_id }),
      base44.asServiceRole.entities.Property.filter({ tenant_id }),
      base44.asServiceRole.entities.Visit.filter({ tenant_id }),
      base44.asServiceRole.entities.TenantUser.filter({ tenant_id })
    ]);

    return Response.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription_plan: tenant.subscription_plan,
        is_active: tenant.is_active
      },
      stats: {
        clients: clients.length,
        properties: properties.length,
        visits: visits.length,
        tenant_users: tenantUsers.length
      },
      users: tenantUsers.map(tu => ({ user_id: tu.user_id, role: tu.role_in_tenant, is_owner: tu.is_owner })),
      sample_clients: clients.slice(0, 3).map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })),
      sample_properties: properties.slice(0, 3).map(p => ({ id: p.id, name: p.name, city: p.city }))
    });

  } catch (error) {
    console.error('Error in diagnosticTenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});