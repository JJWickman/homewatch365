import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company from user's membership
    const members = await base44.entities.CompanyMember.filter({
      user_email: user.email,
    });

    if (!members.length) {
      return Response.json({ error: 'No company found for user' }, { status: 400 });
    }

    const companyId = members[0].company_id;

    // Create client
    const clientEmail = 'jason@biglynx.com';
    const client = await base44.entities.Client.create({
      company_id: companyId,
      first_name: 'Jason',
      last_name: 'Carlson',
      email: clientEmail,
      phone: '555-0101',
      portal_access: true,
      portal_user_email: clientEmail,
      portal_pin: '123456',
      billing_status: 'active',
      billing_frequency: 'monthly',
      receive_report_emails: true,
    });

    // Create properties
    const property1 = await base44.entities.Property.create({
      company_id: companyId,
      client_id: client.id,
      name: 'Beach House - Miami',
      address: '123 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
      property_type: 'single_family',
      status: 'seasonal',
      square_feet: 3500,
      bedrooms: 4,
      bathrooms: 3,
      visit_frequency: 'weekly',
    });

    const property2 = await base44.entities.Property.create({
      company_id: companyId,
      client_id: client.id,
      name: 'Condo - Naples',
      address: '456 Gulf Shore Blvd',
      city: 'Naples',
      state: 'FL',
      zip: '34103',
      property_type: 'condo',
      status: 'seasonal',
      square_feet: 2200,
      bedrooms: 3,
      bathrooms: 2,
      visit_frequency: 'bi_weekly',
    });

    // Create completed visits
    const today = new Date();
    const visits = [];

    // Visit 1 - 3 weeks ago
    const visit1Date = new Date(today);
    visit1Date.setDate(visit1Date.getDate() - 21);
    const visit1 = await base44.entities.Visit.create({
      company_id: companyId,
      property_id: property1.id,
      client_id: client.id,
      visit_type: 'check-in',
      scheduled_date: visit1Date.toISOString().split('T')[0],
      status: 'completed',
      overall_status: 'all_clear',
      summary_notes: 'All systems operational. No issues detected.',
      completed_at: visit1Date.toISOString(),
      billable: true,
      billable_amount: 125,
    });
    visits.push(visit1);

    // Visit 2 - 2 weeks ago
    const visit2Date = new Date(today);
    visit2Date.setDate(visit2Date.getDate() - 14);
    const visit2 = await base44.entities.Visit.create({
      company_id: companyId,
      property_id: property2.id,
      client_id: client.id,
      visit_type: 'check-in',
      scheduled_date: visit2Date.toISOString().split('T')[0],
      status: 'completed',
      overall_status: 'all_clear',
      summary_notes: 'Pool equipment functioning. HVAC set to 72°F.',
      completed_at: visit2Date.toISOString(),
      billable: true,
      billable_amount: 100,
    });
    visits.push(visit2);

    // Visit 3 - 1 week ago
    const visit3Date = new Date(today);
    visit3Date.setDate(visit3Date.getDate() - 7);
    const visit3 = await base44.entities.Visit.create({
      company_id: companyId,
      property_id: property1.id,
      client_id: client.id,
      visit_type: 'check-in',
      scheduled_date: visit3Date.toISOString().split('T')[0],
      status: 'completed',
      overall_status: 'issues_found',
      summary_notes: 'Minor water stain on guest bathroom ceiling. Recommend inspection.',
      completed_at: visit3Date.toISOString(),
      billable: true,
      billable_amount: 125,
    });
    visits.push(visit3);

    // Visit 4 - 3 days ago (follow-up)
    const visit4Date = new Date(today);
    visit4Date.setDate(visit4Date.getDate() - 3);
    const visit4 = await base44.entities.Visit.create({
      company_id: companyId,
      property_id: property1.id,
      client_id: client.id,
      visit_type: 'followup',
      scheduled_date: visit4Date.toISOString().split('T')[0],
      status: 'completed',
      title: 'Water Stain Follow-up',
      description: 'Roof inspection completed by contractor. No active leaks detected.',
      followup_type: 'contractor_appointment',
      priority: 'medium',
      completed_at: visit4Date.toISOString(),
      billable: true,
      billable_amount: 150,
    });
    visits.push(visit4);

    // Create monthly statement
    const currentMonth = today.toISOString().split('T')[0].substring(0, 7);
    const statement = await base44.entities.MonthlyStatement.create({
      company_id: companyId,
      client_id: client.id,
      billing_month: currentMonth,
      status: 'finalized',
      line_items: [
        {
          description: 'Weekly Property Check - Miami Beach House',
          amount: 125,
          type: 'visit',
        },
        {
          description: 'Bi-weekly Property Check - Naples Condo',
          amount: 100,
          type: 'visit',
        },
        {
          description: 'Follow-up Visit - Roof Inspection Coordination',
          amount: 150,
          type: 'service',
        },
      ],
      subtotal: 375,
      tax_amount: 0,
      total: 375,
      finalized_at: today.toISOString(),
      sent_at: today.toISOString(),
      status: 'sent',
    });

    // Update client with visit reports
    const visitReports = visits.map((v) => ({
      visit_id: v.id,
      property_id: v.property_id,
      property_name: v.property_id === property1.id ? property1.name : property2.name,
      visit_date: v.scheduled_date,
      created_at: v.completed_at,
      report_url: `https://example.com/reports/${v.id}.pdf`,
    }));

    await base44.entities.Client.update(client.id, {
      visit_reports: visitReports,
    });

    return Response.json({
      success: true,
      client: {
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        portal_email: client.portal_user_email,
        portal_pin: client.portal_pin,
      },
      properties: [property1, property2],
      visits: visits.length,
      statement: {
        month: currentMonth,
        total: statement.total,
      },
      message: `Sample portal data created for ${clientEmail}`,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});