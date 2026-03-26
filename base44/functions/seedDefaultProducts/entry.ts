import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_PRODUCTS = [
  // Subscription Services
  {
    name: 'Weekly Home Watch Service',
    description: 'Weekly property inspection and monitoring with detailed reporting',
    visit_type: 'check-in',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: 199,
    billing_frequency: 'monthly',
    visit_frequency: 'weekly',
    included_visits: 4,
    is_active: true
  },
  {
    name: 'Bi-Weekly Home Watch Service',
    description: 'Bi-weekly property inspection and monitoring',
    visit_type: 'check-in',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: 149,
    billing_frequency: 'monthly',
    visit_frequency: 'bi_weekly',
    included_visits: 2,
    is_active: true
  },
  {
    name: 'Monthly Home Watch Service',
    description: 'Monthly property inspection and monitoring',
    visit_type: 'check-in',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: 99,
    billing_frequency: 'monthly',
    visit_frequency: 'monthly',
    included_visits: 1,
    is_active: true
  },
  {
    name: 'Pre-Storm Preparation Service',
    description: 'Property preparation service before storm season',
    visit_type: 'pre_storm',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: 299,
    billing_frequency: 'annually',
    included_pre_storm_visits: 1,
    is_active: true
  },
  {
    name: 'Post-Storm Assessment Service',
    description: 'Post-storm damage assessment and recovery coordination',
    visit_type: 'post_storm',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: 349,
    billing_frequency: 'annually',
    included_post_storm_visits: 1,
    is_active: true
  },
  // Add-on Services
  // Per-Visit Pricing (property-based)
  {
    name: 'Per-Visit Inspection Service',
    description: 'Property inspection charged per visit based on property size and features',
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
    name: 'Additional Visit',
    description: 'Single additional property visit for issue follow-up or special requests',
    visit_type: 'followup',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 75,
    billing_frequency: 'one_time',
    is_active: true
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Check if products already exist
    const existing = await base44.entities.ProductService.filter({ tenant_id: tenantId });
    if (existing.length > 0) {
      return Response.json({
        success: false,
        message: 'Default products already exist for this tenant',
        count: existing.length
      });
    }

    // Create all default products
    const created = [];
    for (const product of DEFAULT_PRODUCTS) {
      const result = await base44.entities.ProductService.create({
        tenant_id: tenantId,
        ...product
      });
      created.push({ id: result.id, name: result.name });
    }

    return Response.json({
      success: true,
      message: `Created ${created.length} default products and services`,
      count: created.length,
      products: created
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});