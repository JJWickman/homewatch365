import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tenant ID from query params or use primary_tenant_id
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id') || user.primary_tenant_id;

    if (!tenantId) {
      return Response.json({ error: 'No tenant ID found' }, { status: 400 });
    }

    // Verify tenant ID ends in 515f0
    if (!tenantId.endsWith('515f0')) {
      return Response.json({ 
        error: `Tenant ID does not end in 515f0. Got: ${tenantId}` 
      }, { status: 400 });
    }

    // Query ProductServices for this tenant
    const products = await base44.asServiceRole.entities.ProductService.filter({
      tenant_id: tenantId
    });

    return Response.json({
      tenant_id: tenantId,
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        visit_type: p.visit_type,
        base_price: p.base_price,
        type: p.type,
        is_active: p.is_active,
        created_date: p.created_date
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});