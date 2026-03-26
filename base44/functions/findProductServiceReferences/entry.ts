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

    // If no failed IDs provided, find all products and check which aren't referenced
    let idsToCheck = failedIds;
    if (idsToCheck.length === 0) {
      const allProducts = await base44.asServiceRole.entities.ProductService.list();
      idsToCheck = allProducts.map(p => p.id);
    }

    // Fetch all clients once
    const allClients = await base44.asServiceRole.entities.Client.list();
    const referencedByClient = {};
    const unreferenced = [];

    for (const psId of idsToCheck) {
      const clientsUsingAsMain = allClients.filter(c => c.service_subscription_id === psId);
      const clientsUsingAsAddon = allClients.filter(c => 
        c.additional_products && c.additional_products.includes(psId)
      );

      if (clientsUsingAsMain.length > 0 || clientsUsingAsAddon.length > 0) {
        referencedByClient[psId] = {
          mainService: clientsUsingAsMain.map(c => c.id),
          addOnService: clientsUsingAsAddon.map(c => c.id)
        };
      } else {
        unreferenced.push(psId);
      }
    }

    const summary = {
      checkedCount: idsToCheck.length,
      referencedByClientCount: Object.keys(referencedByClient).length,
      unreferencedCount: unreferenced.length,
      referencedByClient,
      unreferencedIds: unreferenced.length > 0 ? unreferenced : 'none'
    };

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});