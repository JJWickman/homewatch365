import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenantId = '69c4784908cbd3c8bce515f0';

    // Try both user-scoped and service role
    const userScoped = await base44.entities.ProductService.filter({
      tenant_id: tenantId
    });
    
    const serviceRole = await base44.asServiceRole.entities.ProductService.filter({
      tenant_id: tenantId
    });

    // Also try fetching ALL with no filter
    const all = await base44.asServiceRole.entities.ProductService.list();

    return Response.json({
      userScoped: userScoped.length,
      serviceRole: serviceRole.length,
      all: all.length,
      allProducts: all.map(p => ({ id: p.id, name: p.name, tenant_id: p.tenant_id, visit_type: p.visit_type }))
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});