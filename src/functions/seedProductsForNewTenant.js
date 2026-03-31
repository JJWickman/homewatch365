/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_PRODUCTS = [
  {
    service_name: 'Weekly Home Watch Visit',
    service_type: 'inspection',
    description: 'Standard weekly property inspection and check-in',
    base_price: 150,
    billing_frequency: 'weekly',
    is_recurring: true,
    is_active: true
  },
  {
    service_name: 'Monthly Inspection',
    service_type: 'inspection',
    description: 'Comprehensive monthly property inspection',
    base_price: 500,
    billing_frequency: 'monthly',
    is_recurring: true,
    is_active: true
  },
  {
    service_name: 'Storm Preparation Visit',
    service_type: 'maintenance',
    description: 'Pre-storm property preparation and securing',
    base_price: 250,
    billing_frequency: 'one_time',
    is_recurring: false,
    is_active: true
  },
  {
    service_name: 'Post-Storm Damage Assessment',
    service_type: 'maintenance',
    description: 'Post-storm property damage evaluation',
    base_price: 300,
    billing_frequency: 'one_time',
    is_recurring: false,
    is_active: true
  },
  {
    service_name: 'Arrival/Departure Coordination',
    service_type: 'concierge',
    description: 'Property prep for owner arrival or departure',
    base_price: 200,
    billing_frequency: 'one_time',
    is_recurring: false,
    is_active: true
  },
  {
    service_name: 'Emergency Response Visit',
    service_type: 'emergency',
    description: 'Emergency property response and triage',
    base_price: 400,
    billing_frequency: 'one_time',
    is_recurring: false,
    is_active: true
  }
];

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
        message: 'Products already seeded',
        count: existing.length
      });
    }

    // Create all default products with tenant_id
    const productsWithTenant = DEFAULT_PRODUCTS.map(p => ({
      ...p,
      tenant_id: tenantId
    }));
    
    const created = await base44.asServiceRole.entities.ProductService.bulkCreate(productsWithTenant);
    
    console.log(`Seeded ${created.length} products for tenant ${tenantId}`);
    return Response.json({
      success: true,
      message: `Created ${created.length} default products`,
      count: created.length
    });
  } catch (error) {
    console.error('Error seeding products for new tenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});