import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const failedIds = body.failedIds || [];

    if (failedIds.length === 0) {
      return Response.json({ error: 'failedIds array required' }, { status: 400 });
    }

    // Fetch all clients once
    const allClients = await base44.asServiceRole.entities.Client.list();
    const references = {};

    // Check references for each failed ProductService ID
    const referencedByClient = {};

    for (const psId of failedIds) {
      const clientsUsingAsMain = allClients.filter(c => c.service_subscription_id === psId);
      const clientsUsingAsAddon = allClients.filter(c => 
        c.additional_products && c.additional_products.includes(psId)
      );

      if (clientsUsingAsMain.length > 0 || clientsUsingAsAddon.length > 0) {
        referencedByClient[psId] = {
          mainService: clientsUsingAsMain.map(c => c.id),
          addOnService: clientsUsingAsAddon.map(c => c.id)
        };
      }
    }

    const summary = {
      failedToDeleteCount: failedIds.length,
      referencedByClientCount: Object.keys(referencedByClient).length,
      unreferencedCount: failedIds.length - Object.keys(referencedByClient).length,
      referencedByClient
    };

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});