import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Unauthorized or no tenant' }, { status: 401 });
    }

    const tenantId = user.primary_tenant_id;

    // Create test clients with correct tenant_id
    const testClients = [
      {
        tenant_id: tenantId,
        first_name: 'Chevy',
        last_name: 'Chase',
        email: 'chevy.chase@example.com',
        phone: '239-555-0101',
        address: '1234 Gulf Shore Boulevard',
        city: 'Naples',
        state: 'FL',
        zip: '34102',
        portal_access: true,
        portal_user_email: 'chevy.chase@example.com',
        billing_status: 'active',
        monthly_rate: 500,
        is_active: true
      },
      {
        tenant_id: tenantId,
        first_name: 'Steve',
        last_name: 'Martin',
        email: 'steve.martin@example.com',
        phone: '239-555-0102',
        address: '567 Boca Grande Avenue',
        city: 'Boca Grande',
        state: 'FL',
        zip: '33921',
        portal_access: true,
        portal_user_email: 'steve.martin@example.com',
        billing_status: 'active',
        monthly_rate: 600,
        is_active: true
      }
    ];

    const created = await base44.entities.Client.bulkCreate(testClients);

    return Response.json({
      success: true,
      created: created.length,
      clients: created.map(c => `${c.first_name} ${c.last_name} (${c.id})`)
    });

  } catch (error) {
    console.error('Error seeding test clients:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});