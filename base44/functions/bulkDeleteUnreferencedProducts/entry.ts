import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch unreferenced IDs using the reference checker
    const allProducts = await base44.asServiceRole.entities.ProductService.list();
    const allClients = await base44.asServiceRole.entities.Client.list();
    
    const unreferencedIds = [];
    for (const product of allProducts) {
      const mainRefs = allClients.filter(c => c.service_subscription_id === product.id);
      const addonRefs = allClients.filter(c => c.additional_products && c.additional_products.includes(product.id));
      
      if (mainRefs.length === 0 && addonRefs.length === 0) {
        unreferencedIds.push(product.id);
      }
    }

    if (unreferencedIds.length === 0) {
      return Response.json({ message: 'No unreferenced products to delete', deleted: 0 });
    }

    const deleted = [];
    const failed = [];

    for (let i = 0; i < unreferencedIds.length; i++) {
      const productId = unreferencedIds[i];
      let retries = 0;
      let success = false;

      while (retries < 3 && !success) {
        try {
          await base44.asServiceRole.entities.ProductService.delete(productId);
          deleted.push(productId);
          success = true;
        } catch (error) {
          retries++;
          if (retries < 3 && error.message.includes('Rate limit')) {
            // Exponential backoff: 500ms, 1000ms, 2000ms
            const delay = Math.pow(2, retries - 1) * 500;
            await new Promise(r => setTimeout(r, delay));
          } else {
            console.error(`Failed to delete ${productId}:`, error.message);
            failed.push({ id: productId, error: error.message });
            success = true; // Stop retrying on non-rate-limit errors
          }
        }
      }

      if (!success) {
        failed.push({ id: productId, error: 'Max retries exceeded' });
      }
    }

    return Response.json({
      totalRequested: unreferencedIds.length,
      deletedCount: deleted.length,
      failedCount: failed.length,
      failedDetails: failed.length > 0 ? failed : null
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});