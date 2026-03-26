import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productServiceId } = await req.json();
    if (!productServiceId) {
      return Response.json({ error: 'productServiceId required' }, { status: 400 });
    }

    // Check references across entities
    const references = {};

    // Check Client.service_subscription_id
    try {
      const clients = await base44.asServiceRole.entities.Client.filter({
        service_subscription_id: productServiceId
      });
      if (clients.length > 0) {
        references.Client_service_subscription = clients.map(c => ({ id: c.id, name: c.first_name + ' ' + c.last_name }));
      }
    } catch (e) {
      console.log('Client.service_subscription_id check skipped');
    }

    // Check Client.additional_products (array field)
    try {
      const allClients = await base44.asServiceRole.entities.Client.list();
      const clientsWithAddons = allClients.filter(c => 
        c.additional_products && c.additional_products.includes(productServiceId)
      );
      if (clientsWithAddons.length > 0) {
        references.Client_additional_products = clientsWithAddons.map(c => ({ id: c.id, name: c.first_name + ' ' + c.last_name }));
      }
    } catch (e) {
      console.log('Client.additional_products check skipped');
    }

    return Response.json({
      productServiceId,
      referencedIn: references,
      hasReferences: Object.keys(references).length > 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});