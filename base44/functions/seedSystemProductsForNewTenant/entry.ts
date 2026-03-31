/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const tenantId = body.event?.entity_id;

    if (!tenantId) {
      return Response.json({ error: 'No tenant ID in event' }, { status: 400 });
    }

    // Check if products already exist for this tenant
    const existing = await base44.asServiceRole.entities.ProductService.filter({
      tenant_id: tenantId
    });

    if (existing.length > 0) {
      console.log(`Products already exist for tenant ${tenantId}, skipping`);
      return Response.json({
        success: true,
        message: 'Products already seeded for this tenant',
        count: existing.length
      });
    }

    // Fetch all system products
    const systemProducts = await base44.asServiceRole.entities.ProductService.filter({
      tenant_id: null,
      is_system_product: true
    });

    if (systemProducts.length === 0) {
      console.warn('No system products found to copy');
      return Response.json({
        success: true,
        message: 'No system products to copy',
        count: 0
      });
    }

    // Create tenant-specific copies of system products
    const tenantProducts = systemProducts.map(p => ({
      name: p.name,
      description: p.description,
      visit_type: p.visit_type,
      base_price: p.base_price,
      tenant_id: tenantId,
      is_system_product: false,
      is_active: true
    }));

    const created = await base44.asServiceRole.entities.ProductService.bulkCreate(tenantProducts);

    console.log(`Seeded ${created.length} products for tenant ${tenantId}`);
    return Response.json({
      success: true,
      message: `Created ${created.length} products for new tenant`,
      count: created.length
    });
  } catch (error) {
    console.error('Error seeding products for new tenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});