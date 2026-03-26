import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Unauthorized or no tenant' }, { status: 401 });
    }

    const tenantId = user.primary_tenant_id;

    // Fetch the test clients we just created
    const clients = await base44.entities.Client.filter({ 
      tenant_id: tenantId 
    }, '-created_date', 10);

    if (clients.length < 2) {
      return Response.json({ error: 'Test clients not found. Run seedTestClients first.' }, { status: 400 });
    }

    const chevyId = clients.find(c => c.first_name === 'Chevy')?.id;
    const steveId = clients.find(c => c.first_name === 'Steve')?.id;

    if (!chevyId || !steveId) {
      return Response.json({ error: 'Could not find Chevy Chase or Steve Martin clients' }, { status: 400 });
    }

    const testProperties = [
      {
        tenant_id: tenantId,
        client_id: chevyId,
        name: 'Beachfront Estate',
        address: '1234 Gulf Shore Boulevard',
        city: 'Naples',
        state: 'FL',
        zip: '34102',
        latitude: 26.1403,
        longitude: -81.7945,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 4,
        bathrooms: 3.5,
        square_feet: 4500,
        year_built: 2012,
        access_instructions: 'Key in lockbox by front door',
        notes: 'Seasonal property - weekly inspections recommended',
        visit_frequency: 'weekly',
        is_active: true
      },
      {
        tenant_id: tenantId,
        client_id: steveId,
        name: 'Waterfront Villa',
        address: '567 Boca Grande Avenue',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        latitude: 26.7533,
        longitude: -82.2700,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 5,
        bathrooms: 4,
        square_feet: 5500,
        year_built: 2015,
        access_instructions: 'Keypad code on request',
        security_gate: true,
        gate_code: '5555',
        notes: 'Premium waterfront property',
        visit_frequency: 'weekly',
        is_active: true
      }
    ];

    const created = await base44.entities.Property.bulkCreate(testProperties);

    return Response.json({
      success: true,
      created: created.length,
      properties: created.map(p => `${p.name} - ${p.city}`)
    });

  } catch (error) {
    console.error('Error seeding test properties:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});