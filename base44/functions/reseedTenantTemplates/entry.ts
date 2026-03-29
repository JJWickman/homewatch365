import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.primary_tenant_id) {
      return Response.json({ error: 'User has no tenant' }, { status: 400 });
    }

    // Get current templates
    const templates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
      tenant_id: user.primary_tenant_id
    });

    // If fewer than 11, call seeding (this invokes backend directly, not service role invoke)
    let seeded = [];
    if (templates.length < 11) {
      try {
        // Call the seeding function via direct backend invocation
        const seedResponse = await fetch('http://localhost/functions/seedCompanyTemplates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: user.primary_tenant_id })
        });
        const seedData = await seedResponse.json();
        seeded = seedData.results || [];
        // Reload templates after seeding
        const reloadedTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
          tenant_id: user.primary_tenant_id
        });
        templates = reloadedTemplates;
      } catch (seedErr) {
        console.log('Seeding note:', seedErr.message);
      }
    }

    // Count properties and clients
    const properties = await base44.asServiceRole.entities.Property.filter({
      tenant_id: user.primary_tenant_id
    });

    const clients = await base44.asServiceRole.entities.Client.filter({
      tenant_id: user.primary_tenant_id
    });

    return Response.json({
      success: true,
      tenant_id: user.primary_tenant_id,
      user_email: user.email,
      templates_count: templates.length,
      templates_seeded: seeded,
      properties_count: properties.length,
      clients_count: clients.length,
      properties: properties.map(p => ({ id: p.id, name: p.name, address: p.address })),
      clients: clients.map(c => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});