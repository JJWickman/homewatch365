import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // Get all products for this tenant
    const allProducts = await base44.asServiceRole.entities.ProductService.filter({ 
      tenant_id: tenantId 
    });

    if (allProducts.length === 0) {
      return Response.json({ success: true, message: 'No products to deduplicate', removed: 0 });
    }

    // Group by name and visit_type to find duplicates
    const seen = new Map();
    const toDelete = [];

    for (const product of allProducts) {
      const key = `${product.name}|${product.visit_type}`;
      
      if (seen.has(key)) {
        // Keep the first one, delete the rest
        toDelete.push(product.id);
      } else {
        seen.set(key, product.id);
      }
    }

    // Delete duplicates
    let deletedCount = 0;
    for (const id of toDelete) {
      try {
        await base44.asServiceRole.entities.ProductService.delete(id);
        deletedCount++;
      } catch (e) {
        console.warn(`Failed to delete product ${id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      message: `Deduplicated products`,
      total: allProducts.length,
      removed: deletedCount,
      remaining: allProducts.length - deletedCount
    });
  } catch (error) {
    console.error('Error deduplicating products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});