import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch ALL ProductService records with no filter
    const all = await base44.asServiceRole.entities.ProductService.list();

    return Response.json({
      total: all.length,
      records: all.map(p => ({ 
        id: p.id, 
        name: p.name, 
        tenant_id: p.tenant_id, 
        visit_type: p.visit_type,
        created_date: p.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});