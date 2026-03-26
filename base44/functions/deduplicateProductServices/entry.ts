import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const tenantId = '69c4784908cbd3c8bce515f0';

    // Fetch all products for this tenant
    const allProducts = await base44.entities.ProductService.filter({
      tenant_id: tenantId
    });

    // Group by visit_type and find newest in each group
    const groupedByVisitType = {};
    const toDelete = [];

    for (const product of allProducts) {
      const vt = product.visit_type;
      if (!groupedByVisitType[vt]) {
        groupedByVisitType[vt] = [];
      }
      groupedByVisitType[vt].push(product);
    }

    // For each visit_type, keep newest and mark others for deletion
    for (const visitType in groupedByVisitType) {
      const products = groupedByVisitType[visitType].sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
      
      // Skip first (newest), delete rest
      for (let i = 1; i < products.length; i++) {
        toDelete.push(products[i].id);
      }
    }

    // Delete duplicates
    for (const productId of toDelete) {
      await base44.entities.ProductService.delete(productId);
    }

    return Response.json({
      message: 'Deduplication complete',
      kept: Object.keys(groupedByVisitType).length,
      deleted: toDelete.length,
      deletedIds: toDelete
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});