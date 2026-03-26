import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch as the user (respects their RLS rules)
    const products = await base44.entities.ProductService.list();

    return Response.json({
      total: products.length,
      userPrimaryTenant: user.primary_tenant_id,
      records: products.map(p => ({ 
        id: p.id, 
        name: p.name, 
        tenant_id: p.tenant_id, 
        visit_type: p.visit_type,
        created_date: p.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});