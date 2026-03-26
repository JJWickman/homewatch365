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
      return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    // Sample clients
    const clients = [
      {
        tenant_id,
        first_name: 'James',
        last_name: 'Patterson',
        email: 'james.patterson@email.com',
        phone: '561-555-0101',
        address: '123 Ocean Boulevard',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        portal_access: true,
        portal_user_email: 'james.patterson@email.com',
        billing_status: 'active',
        monthly_rate: 500
      },
      {
        tenant_id,
        first_name: 'Catherine',
        last_name: 'Reynolds',
        email: 'catherine.reynolds@email.com',
        phone: '561-555-0102',
        address: '456 Gulf View Lane',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        portal_access: true,
        portal_user_email: 'catherine.reynolds@email.com',
        billing_status: 'active',
        monthly_rate: 750
      },
      {
        tenant_id,
        first_name: 'Michael',
        last_name: 'Harrison',
        email: 'michael.harrison@email.com',
        phone: '561-555-0103',
        address: '789 Beachfront Drive',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        portal_access: true,
        portal_user_email: 'michael.harrison@email.com',
        billing_status: 'active',
        monthly_rate: 600
      }
    ];

    const createdClients = await base44.asServiceRole.entities.Client.bulkCreate(clients);

    // Sample properties
    const properties = [
      {
        tenant_id,
        client_id: createdClients[0].id,
        name: 'Beachfront Villa',
        address: '123 Ocean Boulevard',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        latitude: 26.7533,
        longitude: -82.2700,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 3500,
        year_built: 2015,
        access_instructions: 'Key in lockbox by front door',
        notes: 'Seasonal property - inspect weekly during season',
        visit_frequency: 'weekly'
      },
      {
        tenant_id,
        client_id: createdClients[1].id,
        name: 'Waterfront Condo Unit 405',
        address: '456 Gulf View Lane',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        latitude: 26.7548,
        longitude: -82.2715,
        property_type: 'condo',
        status: 'seasonal',
        unit_number: '405',
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 2200,
        year_built: 2010,
        access_instructions: 'Front desk check-in, mention unit 405',
        gate_procedure: 'Use key card at gate entrance',
        notes: 'HOA required - always leave property clean',
        visit_frequency: 'bi_weekly'
      },
      {
        tenant_id,
        client_id: createdClients[2].id,
        name: 'Luxury Ocean View Home',
        address: '789 Beachfront Drive',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        latitude: 26.7520,
        longitude: -82.2680,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 5,
        bathrooms: 4,
        square_feet: 5000,
        year_built: 2018,
        access_instructions: 'Keypad code: 1234 (call client for updates)',
        security_gate: true,
        gate_code: '5555',
        alarm_code: '1111',
        notes: 'Premium property - handle with extra care',
        visit_frequency: 'weekly'
      }
    ];

    await base44.asServiceRole.entities.Property.bulkCreate(properties);

    return Response.json({ 
      success: true, 
      message: 'Sample data created successfully',
      clients_created: createdClients.length,
      properties_created: properties.length
    });
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});