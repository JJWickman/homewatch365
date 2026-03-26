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
    const tenantId = tenants[0].id;

    // First, set user's primary_tenant_id so RLS allows creates
    await base44.auth.updateMe({
      primary_tenant_id: tenantId
    });

    // Seed test clients
    const testClients = [
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
        monthly_rate: 500,
        is_active: true
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
        monthly_rate: 600,
        is_active: true
      }
    ];

    const createdClients = await base44.asServiceRole.entities.Client.bulkCreate(testClients);

    // Seed test properties
    const testProperties = [
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
        visit_frequency: 'weekly',
        is_active: true
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
        visit_frequency: 'weekly',
        is_active: true
      }
    ];

    const createdProperties = await base44.asServiceRole.entities.Property.bulkCreate(testProperties);

    // Primary tenant already set above

    return Response.json({
      success: true,
      tenant_id: tenantId,
      clients_created: createdClients.length,
      properties_created: createdProperties.length,
      user_primary_tenant_set: tenantId
    });

  } catch (error) {
    console.error('Error in reseedAndReconcile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});