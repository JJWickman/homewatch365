import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Sample properties in 33921 (Fort Myers, FL)
    const sampleProperties = [
      { name: '123 Palm Beach Blvd', address: '123 Palm Beach Blvd, Fort Myers, FL 33921', latitude: 26.6406, longitude: -81.8723 },
      { name: '456 Colonial Blvd', address: '456 Colonial Blvd, Fort Myers, FL 33921', latitude: 26.6356, longitude: -81.8643 },
      { name: '789 McGregor Blvd', address: '789 McGregor Blvd, Fort Myers, FL 33921', latitude: 26.6256, longitude: -81.8843 },
      { name: '321 Edison Ave', address: '321 Edison Ave, Fort Myers, FL 33921', latitude: 26.6506, longitude: -81.8523 },
      { name: '654 First Street', address: '654 First Street, Fort Myers, FL 33921', latitude: 26.6456, longitude: -81.8623 },
      { name: '987 Bay Street', address: '987 Bay Street, Fort Myers, FL 33921', latitude: 26.6306, longitude: -81.8923 },
      { name: '147 Monroe Street', address: '147 Monroe Street, Fort Myers, FL 33921', latitude: 26.6556, longitude: -81.8423 },
      { name: '258 Jackson Street', address: '258 Jackson Street, Fort Myers, FL 33921', latitude: 26.6206, longitude: -81.9023 },
      { name: '369 Lee Blvd', address: '369 Lee Blvd, Fort Myers, FL 33921', latitude: 26.6606, longitude: -81.8323 },
      { name: '741 Cypress Lake Dr', address: '741 Cypress Lake Dr, Fort Myers, FL 33921', latitude: 26.6156, longitude: -81.9123 },
      { name: '852 Winkler Ave', address: '852 Winkler Ave, Fort Myers, FL 33921', latitude: 26.6656, longitude: -81.8223 },
      { name: '963 Summerlin Rd', address: '963 Summerlin Rd, Fort Myers, FL 33921', latitude: 26.6106, longitude: -81.9223 },
      { name: '159 Cleveland Ave', address: '159 Cleveland Ave, Fort Myers, FL 33921', latitude: 26.6706, longitude: -81.8123 },
      { name: '357 Fowler Street', address: '357 Fowler Street, Fort Myers, FL 33921', latitude: 26.6056, longitude: -81.9323 },
      { name: '753 Hanson Street', address: '753 Hanson Street, Fort Myers, FL 33921', latitude: 26.6756, longitude: -81.8023 },
      { name: '951 Martin Street', address: '951 Martin Street, Fort Myers, FL 33921', latitude: 26.6006, longitude: -81.9423 },
      { name: '246 Lemon Street', address: '246 Lemon Street, Fort Myers, FL 33921', latitude: 26.6806, longitude: -81.7923 },
      { name: '468 Orange Street', address: '468 Orange Street, Fort Myers, FL 33921', latitude: 26.5956, longitude: -81.9523 }
    ];

    // Create sample clients
    const clientsData = sampleProperties.map((prop, i) => ({
      tenant_id: tenantId,
      first_name: ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Jennifer', 'William', 'Lisa', 'James', 'Mary', 'Richard', 'Patricia', 'Thomas', 'Linda', 'Charles', 'Barbara'][i],
      last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'][i],
      email: `client${i + 1}@example.com`,
      phone: `239-555-0${String(i + 100).slice(-3)}`,
      address: prop.address,
      is_active: true
    }));

    const clients = await base44.asServiceRole.entities.Client.bulkCreate(clientsData);

    // Create properties
    const propertiesData = sampleProperties.map((prop, i) => ({
      tenant_id: tenantId,
      client_id: clients[i].id,
      name: prop.name,
      address: prop.address,
      city: 'Fort Myers',
      state: 'FL',
      zip: '33921',
      type: ['single_family', 'condo', 'townhouse', 'vacation_home'][i % 4],
      latitude: prop.latitude,
      longitude: prop.longitude,
      is_active: true
    }));

    const properties = await base44.asServiceRole.entities.Property.bulkCreate(propertiesData);

    // Get team members (Alex, Maria, James)
    const team = await base44.entities.TenantUser.filter({ 
      tenant_id: tenantId,
      role: 'field_inspector'
    });

    const teamMembers = [
      team.find(t => t.user_name?.toLowerCase().includes('alex')),
      team.find(t => t.user_name?.toLowerCase().includes('maria')),
      team.find(t => t.user_name?.toLowerCase().includes('james'))
    ].filter(Boolean);

    if (teamMembers.length === 0) {
      return Response.json({ 
        error: 'No team members found. Please create Alex, Maria, and James as field inspectors first.' 
      }, { status: 400 });
    }

    // Create 6 visits for each team member
    const today = new Date().toISOString().split('T')[0];
    const visits = [];
    const times = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];

    teamMembers.forEach((member, memberIdx) => {
      for (let i = 0; i < 6; i++) {
        const propertyIdx = (memberIdx * 6) + i;
        if (propertyIdx >= properties.length) break;

        visits.push({
          tenant_id: tenantId,
          property_id: properties[propertyIdx].id,
          client_id: clients[propertyIdx].id,
          visit_type: 'inspection',
          inspection_type: 'routine',
          assigned_to: member.user_email,
          assigned_to_name: member.user_name,
          scheduled_date: today,
          scheduled_time: times[i],
          status: i < 2 ? 'completed' : (i === 2 ? 'in_progress' : 'scheduled')
        });
      }
    });

    await base44.asServiceRole.entities.Visit.bulkCreate(visits);

    return Response.json({
      success: true,
      created: {
        clients: clients.length,
        properties: properties.length,
        visits: visits.length,
        team_members: teamMembers.map(t => t.user_name)
      }
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});