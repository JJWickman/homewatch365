import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_PRODUCTS = [
  { name: 'Standard Home Watch Visit', description: 'Standard property inspection and monitoring visit', visit_type: 'check-in', base_price: 60, is_active: true },
  { name: 'Pre-Storm Visit', description: 'Property preparation visit before storm season', visit_type: 'pre_storm', base_price: 85, is_active: true },
  { name: 'Post-Storm Visit', description: 'Post-storm damage assessment visit', visit_type: 'post_storm', base_price: 100, is_active: true },
  { name: 'Follow-up Visit', description: 'Follow-up visit for issue resolution or contractor coordination', visit_type: 'followup', base_price: 75, is_active: true },
  { name: 'Departure Closing Visit', description: 'Property closing after owner departure', visit_type: 'arrival_departure', base_price: 100, is_active: true },
  { name: 'Emergency Response Visit', description: 'Emergency property visit for urgent situations', visit_type: 'emergency_visit', base_price: 150, is_active: true },
  { name: 'Contractor Access Visit', description: 'Coordination and monitoring of contractor/vendor access to property', visit_type: 'access_visit', base_price: 85, is_active: true },
  { name: 'Vehicle Care Visit', description: 'Vehicle maintenance and care service visit', visit_type: 'auto_care', base_price: 65, is_active: true },
  { name: 'Concierge Service Visit', description: 'Premium concierge service including package handling and guest coordination', visit_type: 'concierge', base_price: 120, is_active: true }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const tenantId = body.tenant_id;

    if (!tenantId) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    // Check if products already exist
    const existing = await base44.asServiceRole.entities.ProductService.filter({ tenant_id: tenantId });
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Products already seeded', count: existing.length });
    }

    // Create all default products using bulkCreate with service role
    const productsWithTenant = DEFAULT_PRODUCTS.map(p => ({ tenant_id: tenantId, ...p }));
    const created = await base44.asServiceRole.entities.ProductService.bulkCreate(productsWithTenant);

    console.log(`Seeded ${created.length} products for tenant ${tenantId}`);
    return Response.json({ success: true, count: created.length, products: created });
  } catch (error) {
    console.error('Error seeding products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});