import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const unreferencedIds = body.unreferencedIds || [];

    if (unreferencedIds.length === 0) {
      return Response.json({ error: 'unreferencedIds array required' }, { status: 400 });
    }

    const deleted = [];
    const failed = [];

    for (const productId of unreferencedIds) {
      try {
        await base44.asServiceRole.entities.ProductService.delete(productId);
        deleted.push(productId);
      } catch (error) {
        console.error(`Failed to delete ${productId}:`, error.message);
        failed.push({ id: productId, error: error.message });
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