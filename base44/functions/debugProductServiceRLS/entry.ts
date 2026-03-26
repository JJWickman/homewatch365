import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch raw data via service role (no RLS)
    const allProducts = await base44.asServiceRole.entities.ProductService.list();
    
    // Sample tenant_ids from actual records
    const tenantIds = [...new Set(allProducts.map(p => p.tenant_id))];
    const sampleRecords = allProducts.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      tenant_id: p.tenant_id
    }));

    return Response.json({
      userPrimaryTenantId: user.primary_tenant_id,
      totalProductsInDatabase: allProducts.length,
      uniqueTenantIds: tenantIds,
      sampleRecords: sampleRecords
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});