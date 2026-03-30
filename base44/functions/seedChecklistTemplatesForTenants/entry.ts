import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TEMPLATE_DEFINITIONS = [
  {
    name: 'Single Family Home',
    template_slug: 'single_family_standard',
    property_type: 'single_family',
    category: 'home_watch_visit',
    description: 'Standard home watch visit checklist for single family homes',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Condo/Villa',
    template_slug: 'condo_villa_standard',
    property_type: 'condo_villa',
    category: 'home_watch_visit',
    description: 'Standard home watch visit checklist for condos and villas',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'High-Rise',
    template_slug: 'high_rise_standard',
    property_type: 'high_rise',
    category: 'home_watch_visit',
    description: 'Standard home watch visit checklist for high-rise properties',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Arrival / Departure Visit',
    template_slug: 'arrival_departure_standard',
    property_type: null,
    category: 'arrival_departure',
    description: 'Checklist for arrival and departure visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Access Visit',
    template_slug: 'access_visit_standard',
    property_type: null,
    category: 'access_visit',
    description: 'Checklist for vendor/contractor access visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Emergency Visit',
    template_slug: 'emergency_visit_standard',
    property_type: null,
    category: 'emergency_visit',
    description: 'Checklist for emergency property visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Damage Recovery',
    template_slug: 'damage_recovery_standard',
    property_type: null,
    category: 'damage_recovery',
    description: 'Ongoing damage recovery tracking checklist',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Auto Care Visit',
    template_slug: 'auto_care_standard',
    property_type: null,
    category: 'auto_care',
    description: 'Checklist for vehicle care visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Post-Storm Visit',
    template_slug: 'post_storm_standard',
    property_type: null,
    category: 'post_storm',
    description: 'Checklist for post-storm property assessment',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Client Service Visit',
    template_slug: 'client_service_standard',
    property_type: null,
    category: 'client_service',
    description: 'Checklist for client service visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  },
  {
    name: 'Concierge Service Visit',
    template_slug: 'concierge_service_standard',
    property_type: null,
    category: 'concierge',
    description: 'Checklist for concierge service visits',
    version: 1,
    active: true,
    is_system_template: true,
    sections: []
  }
];

const TENANT_IDS = [
  '69c4784908cbd3c8bce515f0',
  '69c9448de95a31c09a29881b'
];

Deno.serve(async (req) => {
  try {
    const sr = (await import('npm:@base44/sdk@0.8.23')).createClientFromRequest(req).asServiceRole;
    
    let createdCount = 0;
    const results = [];

    for (const tenantId of TENANT_IDS) {
      for (const template of TEMPLATE_DEFINITIONS) {
        const existing = await sr.entities.ChecklistTemplate.filter({ 
          tenant_id: tenantId,
          template_slug: template.template_slug 
        });

        if (existing.length === 0) {
          await sr.entities.ChecklistTemplate.create({
            ...template,
            tenant_id: tenantId
          });
          createdCount++;
          results.push({
            tenant_id: tenantId,
            template_slug: template.template_slug,
            name: template.name,
            status: 'created'
          });
        } else {
          results.push({
            tenant_id: tenantId,
            template_slug: template.template_slug,
            name: template.name,
            status: 'exists'
          });
        }
      }
    }

    return Response.json({
      success: true,
      createdCount,
      message: `Created ${createdCount} templates across 2 tenants`,
      results
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});