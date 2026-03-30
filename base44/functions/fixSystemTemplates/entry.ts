import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SYSTEM_TEMPLATES = [
  { name: 'Single Family Home', template_slug: 'single_family_standard', code: 'single_family_standard', property_type: 'single_family', category: 'home_watch_visit', description: 'Standard home watch visit checklist for single family homes' },
  { name: 'Condo/Villa', template_slug: 'condo_villa_standard', code: 'condo_villa_standard', property_type: 'condo_villa', category: 'home_watch_visit', description: 'Standard home watch visit checklist for condos and villas' },
  { name: 'High-Rise', template_slug: 'high_rise_standard', code: 'high_rise_standard', property_type: 'high_rise', category: 'home_watch_visit', description: 'Standard home watch visit checklist for high-rise properties' },
  { name: 'Arrival / Departure Visit', template_slug: 'arrival_departure_standard', code: 'arrival_departure_standard', property_type: null, category: 'arrival_departure', description: 'Checklist for arrival and departure visits' },
  { name: 'Access Visit', template_slug: 'access_visit_standard', code: 'access_visit_standard', property_type: null, category: 'access_visit', description: 'Checklist for vendor/contractor access visits' },
  { name: 'Emergency Visit', template_slug: 'emergency_visit_standard', code: 'emergency_visit_standard', property_type: null, category: 'emergency_visit', description: 'Checklist for emergency property visits' },
  { name: 'Damage Recovery', template_slug: 'damage_recovery_standard', code: 'damage_recovery_standard', property_type: null, category: 'damage_recovery', description: 'Ongoing damage recovery tracking checklist' },
  { name: 'Auto Care Visit', template_slug: 'auto_care_standard', code: 'auto_care_standard', property_type: null, category: 'auto_care', description: 'Checklist for vehicle care visits' },
  { name: 'Post-Storm Visit', template_slug: 'post_storm_standard', code: 'post_storm_standard', property_type: null, category: 'post_storm', description: 'Checklist for post-storm property assessment' },
  { name: 'Client Service Visit', template_slug: 'client_service_standard', code: 'client_service_standard', property_type: null, category: 'client_service', description: 'Checklist for client service visits' },
  { name: 'Concierge Service Visit', template_slug: 'concierge_service_standard', code: 'concierge_service_standard', property_type: null, category: 'concierge', description: 'Checklist for concierge service visits' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Fetch all null-tenant templates
    const existing = await sr.entities.ChecklistTemplate.list('-created_date', 200);
    const nullTenantTemplates = existing.filter(t => t.tenant_id === null || t.tenant_id === undefined);

    const updated = [];
    const deleted = [];

    // Update first 11 with correct data
    for (let i = 0; i < Math.min(11, nullTenantTemplates.length); i++) {
      const tmpl = SYSTEM_TEMPLATES[i];
      await sr.entities.ChecklistTemplate.update(nullTenantTemplates[i].id, {
        name: tmpl.name,
        template_slug: tmpl.template_slug,
        code: tmpl.code,
        property_type: tmpl.property_type,
        category: tmpl.category,
        description: tmpl.description,
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
      });
      updated.push({ id: nullTenantTemplates[i].id, name: tmpl.name });
      await sleep(200);
    }

    // Delete extras beyond 11
    for (let i = 11; i < nullTenantTemplates.length; i++) {
      await sr.entities.ChecklistTemplate.delete(nullTenantTemplates[i].id);
      deleted.push(nullTenantTemplates[i].id);
      await sleep(200);
    }

    // If fewer than 11 existed, create the missing ones
    const created = [];
    if (nullTenantTemplates.length < 11) {
      for (let i = nullTenantTemplates.length; i < 11; i++) {
        const tmpl = SYSTEM_TEMPLATES[i];
        const record = await sr.entities.ChecklistTemplate.create({
          ...tmpl,
          tenant_id: null,
          version: 1,
          active: true,
          is_system_template: true,
        });
        created.push({ id: record.id, name: tmpl.name });
        await sleep(200);
      }
    }

    return Response.json({
      success: true,
      null_tenant_found: nullTenantTemplates.length,
      updated_count: updated.length,
      deleted_count: deleted.length,
      created_count: created.length,
      updated,
      deleted,
      created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});