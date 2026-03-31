/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SYSTEM_PRODUCTS = [
  {
    name: 'Weekly Home Watch Visit',
    visit_type: 'check-in',
    description: 'Standard weekly property inspection and check-in',
    base_price: 150
  },
  {
    name: 'Monthly Inspection',
    visit_type: 'check-in',
    description: 'Comprehensive monthly property inspection',
    base_price: 500
  },
  {
    name: 'Storm Preparation Visit',
    visit_type: 'pre_storm',
    description: 'Pre-storm property preparation and securing',
    base_price: 250
  },
  {
    name: 'Post-Storm Damage Assessment',
    visit_type: 'post_storm',
    description: 'Post-storm property damage evaluation',
    base_price: 300
  },
  {
    name: 'Arrival/Departure Coordination',
    visit_type: 'arrival_departure',
    description: 'Property prep for owner arrival or departure',
    base_price: 200
  },
  {
    name: 'Emergency Response Visit',
    visit_type: 'emergency_visit',
    description: 'Emergency property response and triage',
    base_price: 400
  },
  {
    name: 'Follow-up Visit',
    visit_type: 'followup',
    description: 'Follow-up on previous issues or repairs',
    base_price: 100
  },
  {
    name: 'Concierge Service',
    visit_type: 'concierge',
    description: 'Concierge services including guest coordination',
    base_price: 175
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admins to seed system products
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if system products already exist
    const existing = await base44.asServiceRole.entities.ProductService.filter({
      tenant_id: null,
      is_system_product: true
    });

    if (existing.length > 0) {
      console.log(`System products already exist (${existing.length} found), skipping`);
      return Response.json({
        success: true,
        message: 'System products already seeded',
        count: existing.length
      });
    }

    // Create all system products with tenant_id = null
    const productsToCreate = SYSTEM_PRODUCTS.map(p => ({
      ...p,
      tenant_id: null,
      is_system_product: true,
      is_active: true
    }));

    const created = await base44.asServiceRole.entities.ProductService.bulkCreate(productsToCreate);

    console.log(`Seeded ${created.length} system products`);
    return Response.json({
      success: true,
      message: `Created ${created.length} system products`,
      count: created.length
    });
  } catch (error) {
    console.error('Error seeding system products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});