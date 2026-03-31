import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TEMPLATE_DEFINITIONS = [
  { name: 'Single Family Home', template_slug: 'single_family_standard', property_type: 'single_family', category: 'home_watch_visit', description: 'Standard home watch visit checklist for single family homes' },
  { name: 'Condo/Villa', template_slug: 'condo_villa_standard', property_type: 'condo_villa', category: 'home_watch_visit', description: 'Standard home watch visit checklist for condos and villas' },
  { name: 'High-Rise', template_slug: 'high_rise_standard', property_type: 'high_rise', category: 'home_watch_visit', description: 'Standard home watch visit checklist for high-rise properties' },
  { name: 'Arrival / Departure Visit', template_slug: 'arrival_departure_standard', property_type: null, category: 'arrival_departure', description: 'Checklist for arrival and departure visits' },
  { name: 'Access Visit', template_slug: 'access_visit_standard', property_type: null, category: 'access_visit', description: 'Checklist for vendor/contractor access visits' },
  { name: 'Emergency Visit', template_slug: 'emergency_visit_standard', property_type: null, category: 'emergency_visit', description: 'Checklist for emergency property visits' },
  { name: 'Damage Recovery', template_slug: 'damage_recovery_standard', property_type: null, category: 'damage_recovery', description: 'Ongoing damage recovery tracking checklist' },
  { name: 'Auto Care Visit', template_slug: 'auto_care_standard', property_type: null, category: 'auto_care', description: 'Checklist for vehicle care visits' },
  { name: 'Post-Storm Visit', template_slug: 'post_storm_standard', property_type: null, category: 'post_storm', description: 'Checklist for post-storm property assessment' },
  { name: 'Client Service Visit', template_slug: 'client_service_standard', property_type: null, category: 'client_service', description: 'Checklist for client service visits' },
  { name: 'Concierge Service Visit', template_slug: 'concierge_service_standard', property_type: null, category: 'concierge', description: 'Checklist for concierge service visits' },
  { name: 'Follow-Up Visit', template_slug: 'followup_standard', property_type: null, category: 'followup', description: 'Follow-up visit for issue resolution or contractor coordination' }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Entity automation payload: { event: {type, entity_name, entity_id}, data: {...}, ... }
    const tenantId = body.event?.entity_id;
    
    if (!tenantId) {
      return Response.json({ error: 'No tenant ID in event' }, { status: 400 });
    }

    // Check if templates already exist
    const existing = await base44.asServiceRole.entities.ChecklistTemplate.filter({ tenant_id: tenantId });
    if (existing.length > 0) {
      console.log(`Templates already exist for tenant ${tenantId}, skipping`);
      return Response.json({
        success: true,
        message: 'Templates already seeded',
        count: existing.length
      });
    }

    // Create all default templates
    const templatesWithTenant = TEMPLATE_DEFINITIONS.map(t => ({
      ...t,
      tenant_id: tenantId,
      version: 1,
      active: true,
      is_system_template: false,
      sections: []
    }));
    
    const created = await base44.asServiceRole.entities.ChecklistTemplate.bulkCreate(templatesWithTenant);
    
    console.log(`Seeded ${created.length} templates for tenant ${tenantId}`);
    return Response.json({
      success: true,
      message: `Created ${created.length} default checklist templates`,
      count: created.length
    });
  } catch (error) {
    console.error('Error seeding templates for new tenant:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});