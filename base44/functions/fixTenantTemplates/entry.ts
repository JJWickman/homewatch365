import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ALL_TEMPLATE_CODES = [
  { code: 'single_family_standard', name: 'Single Family Home', property_type: 'single_family', category: 'home_watch_visit', description: 'Standard home watch visit checklist for single family homes' },
  { code: 'condo_villa_standard', name: 'Condo/Villa', property_type: 'condo_villa', category: 'home_watch_visit', description: 'Standard home watch visit checklist for condos and villas' },
  { code: 'high_rise_standard', name: 'High-Rise', property_type: 'high_rise', category: 'home_watch_visit', description: 'Standard home watch visit checklist for high-rise properties' },
  { code: 'arrival_departure_standard', name: 'Arrival / Departure Visit', property_type: null, category: 'arrival_departure', description: 'Checklist for arrival and departure visits' },
  { code: 'access_visit_standard', name: 'Access Visit', property_type: null, category: 'access_visit', description: 'Checklist for vendor/contractor access visits' },
  { code: 'emergency_visit_standard', name: 'Emergency Visit', property_type: null, category: 'emergency_visit', description: 'Checklist for emergency property visits' },
  { code: 'damage_recovery_standard', name: 'Damage Recovery', property_type: null, category: 'damage_recovery', description: 'Ongoing damage recovery tracking checklist' },
  { code: 'auto_care_standard', name: 'Auto Care Visit', property_type: null, category: 'auto_care', description: 'Checklist for vehicle care visits' },
  { code: 'post_storm_standard', name: 'Post-Storm Visit', property_type: null, category: 'post_storm', description: 'Checklist for post-storm property assessment' },
  { code: 'client_service_standard', name: 'Client Service Visit', property_type: null, category: 'client_service', description: 'Checklist for client service visits' },
  { code: 'concierge_service_standard', name: 'Concierge Service Visit', property_type: null, category: 'concierge', description: 'Checklist for concierge service visits' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tenant_id } = payload;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // 1. Delete all existing templates owned by this tenant
    const existing = await sr.entities.ChecklistTemplate.filter({ tenant_id });
    let deleted = 0;
    for (const t of existing) {
      await sr.entities.ChecklistTemplate.delete(t.id);
      deleted++;
    }

    // 2. Create fresh unique copies for this tenant
    const created = [];
    for (const tmpl of ALL_TEMPLATE_CODES) {
      const record = await sr.entities.ChecklistTemplate.create({
        ...tmpl,
        tenant_id,
        version: 1,
        active: true,
      });
      created.push({ id: record.id, code: tmpl.code, name: tmpl.name });
    }

    return Response.json({
      success: true,
      tenant_id,
      deleted_count: deleted,
      created_count: created.length,
      created
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});