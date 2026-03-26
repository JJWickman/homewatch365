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
    name: 'Arrival Preparation Service',
    description: 'Property preparation before owner arrival',
    visit_type: 'arrival_departure',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 100,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Departure Closing Service',
    description: 'Property closing after owner departure',
    visit_type: 'arrival_departure',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 100,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Contractor Access Coordination',
    description: 'Coordination and monitoring of contractor/vendor access to property',
    visit_type: 'access_visit',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 85,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Vehicle Care Service',
    description: 'Vehicle maintenance and care service',
    visit_type: 'auto_care',
    type: 'addon',
    pricing_model: 'flat_rate',
    base_price: 65,
    billing_frequency: 'one_time',
    is_active: true
  },
  {
    name: 'Concierge Service Package',
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