import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_PRODUCTS = [
  {
    name: 'Standard Home Watch Visit',
    description: 'Standard property inspection and monitoring visit',
    visit_type: 'check-in',
    type: 'addon',
    pricing_model: 'usage_based',
    base_price: 60,
    billing_frequency: 'one_time',
    usage_unit: 'per visit',
    add_on_charges: {
      extra_bedrooms: { unit_price: 10, description: 'Per additional bedroom beyond 2' },
      extra_bathrooms: { unit_price: 8, description: 'Per additional bathroom beyond 2' },
      water_features: { unit_price: 15, description: 'Pool, spa, or water feature monitoring' },
      gated_property: { unit_price: 12, description: 'Gated or secured access property' },
      commercial: { unit_price: 25, description: 'Commercial property surcharge' }
    },
    is_active: true
  },
  {
    name: 'Pre-Storm Visit',
    description: 'Property preparation visit before storm season',
    visit_type: 'pre_storm',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 85,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Post-Storm Visit',
    description: 'Post-storm damage assessment visit',
    visit_type: 'post_storm',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 100,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Follow-up Visit',
    description: 'Follow-up visit for issue resolution or contractor coordination',
    visit_type: 'followup',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 75,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Arrival Preparation Visit',
    description: 'Property preparation before owner arrival',
    visit_type: 'arrival_departure',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 100,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Departure Closing Visit',
    description: 'Property closing after owner departure',
    visit_type: 'arrival_departure',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 100,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Emergency Response Visit',
    description: 'Emergency property visit for urgent situations',
    visit_type: 'emergency_visit',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 150,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Contractor Access Visit',
    description: 'Coordination and monitoring of contractor/vendor access to property',
    visit_type: 'access_visit',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 85,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Vehicle Care Visit',
    description: 'Vehicle maintenance and care service visit',
    visit_type: 'auto_care',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 65,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Concierge Service Visit',
    description: 'Premium concierge service including package handling and guest coordination',
    visit_type: 'concierge',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 120,
    billing_frequency: 'one_time',
    is_active: true
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Entity automation payload: { event: {type, entity_name, entity_id}, data: {...} }
    const tenantId = body.event?.entity_id || body.data?.id;
    
    if (!tenantId) {
      console.error('Invalid payload:', JSON.stringify(body).slice(0, 200));
      return Response.json({ error: 'No tenant ID in event' }, { status: 400 });
    }

    // Check if products already exist
    const existing = await base44.asServiceRole.entities.ProductService.filter({ tenant_id: tenantId });
    if (existing.length > 0) {
      console.log(`Products already exist for tenant ${tenantId}, skipping`);
      return Response.json({
        success: true,
        message: 'Products already seeded',
        count: existing.length
      });
    }

    // Create all default products
    const created = [];
    for (const product of DEFAULT_PRODUCTS) {
      const result = await base44.asServiceRole.entities.ProductService.create({
        tenant_id: tenantId,
        ...product
      });
      created.push({ id: result.id, name: result.name });
    }

    console.log(`Seeded ${created.length} products for tenant ${tenantId}`);
    return Response.json({
      success: true,
      message: `Created ${created.length} default visit-based services`,
      count: created.length
    });
  } catch (error) {
    console.error('Error seeding products for new tenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});