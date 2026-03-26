import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const tenantId = user.primary_tenant_id;

    if (!tenantId) {
      return Response.json({ error: 'No primary tenant found' }, { status: 400 });
    }

    const sampleClients = [
      {
        tenant_id: tenantId,
        first_name: 'Chevy',
        last_name: 'Chase',
        email: 'chevy.chase@sample.com',
        phone: '239-555-0101',
        address: '1234 Gulf Shore Boulevard',
        city: 'Naples',
        state: 'FL',
        zip: '34102',
        portal_access: true,
        portal_user_email: 'chevy.chase@sample.com',
        billing_status: 'active',
        monthly_rate: 500
      },
      {
        tenant_id: tenantId,
        first_name: 'Steve',
        last_name: 'Martin',
        email: 'steve.martin@sample.com',
        phone: '239-555-0102',
        address: '567 Boca Grande Avenue',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        portal_access: true,
        portal_user_email: 'steve.martin@sample.com',
        billing_status: 'active',
        monthly_rate: 600
      }
    ];

    const createdClients = await base44.entities.Client.bulkCreate(sampleClients);

    const sampleProperties = [
      {
        tenant_id: tenantId,
        client_id: createdClients[0].id,
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
        visit_frequency: 'weekly'
      },
      {
        tenant_id: tenantId,
        client_id: createdClients[1].id,
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
        visit_frequency: 'weekly'
      }
    ];

    await base44.entities.Property.bulkCreate(sampleProperties);

    return Response.json({
      success: true,
      clients_created: createdClients.length,
      properties_created: sampleProperties.length
    });
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});