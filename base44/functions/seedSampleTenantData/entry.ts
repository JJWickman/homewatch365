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
      },
      {
        tenant_id,
        first_name: 'David',
        last_name: 'Thompson',
        email: 'david.thompson@email.com',
        phone: '561-555-0104',
        address: '321 Coastal Drive',
        city: 'Naples',
        state: 'FL',
        zip: '34102',
        portal_access: true,
        portal_user_email: 'david.thompson@email.com',
        billing_status: 'active',
        monthly_rate: 525
      },
      {
        tenant_id,
        first_name: 'Sarah',
        last_name: 'Williams',
        email: 'sarah.williams@email.com',
        phone: '561-555-0105',
        address: '654 Island Paradise Lane',
        city: 'Sanibel',
        state: 'FL',
        zip: '33957',
        portal_access: true,
        portal_user_email: 'sarah.williams@email.com',
        billing_status: 'active',
        monthly_rate: 675
      },
      {
        tenant_id,
        first_name: 'Robert',
        last_name: 'Anderson',
        email: 'robert.anderson@email.com',
        phone: '561-555-0106',
        address: '987 Sunset Boulevard',
        city: 'Captiva',
        state: 'FL',
        zip: '33924',
        portal_access: true,
        portal_user_email: 'robert.anderson@email.com',
        billing_status: 'active',
        monthly_rate: 550
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
      },
      {
        tenant_id,
        client_id: createdClients[3].id,
        name: 'Coastal Residence',
        address: '321 Coastal Drive',
        city: 'Naples',
        state: 'FL',
        zip: '34102',
        latitude: 26.1403,
        longitude: -81.7945,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 4000,
        year_built: 2012,
        access_instructions: 'Lockbox on rear porch',
        notes: 'Primary residence - mostly occupied',
        visit_frequency: 'monthly'
      },
      {
        tenant_id,
        client_id: createdClients[4].id,
        name: 'Island Getaway',
        address: '654 Island Paradise Lane',
        city: 'Sanibel',
        state: 'FL',
        zip: '33957',
        latitude: 26.4372,
        longitude: -82.1815,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 3,
        bathrooms: 2.5,
        square_feet: 2800,
        year_built: 2010,
        access_instructions: 'Key in smart lock',
        notes: 'Vacation property - biweekly inspections',
        visit_frequency: 'bi_weekly'
      },
      {
        tenant_id,
        client_id: createdClients[5].id,
        name: 'Sunset Paradise Estate',
        address: '987 Sunset Boulevard',
        city: 'Captiva',
        state: 'FL',
        zip: '33924',
        latitude: 26.5633,
        longitude: -82.3124,
        property_type: 'single_family',
        status: 'seasonal',
        bedrooms: 5,
        bathrooms: 3.5,
        square_feet: 4800,
        year_built: 2016,
        access_instructions: 'Front gate code: 9876',
        security_gate: true,
        gate_code: '9876',
        notes: 'Upscale property - premium care required',
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