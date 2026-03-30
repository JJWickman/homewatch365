import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TEMPLATES_WITH_SECTIONS = [
  {
    template_name: 'Single Family Home',
    template_code: 'single_family_standard',
    property_type: 'single_family',
    template_category: 'home_watch_visit',
    template_description: 'Standard home watch visit checklist for single family homes',
    version: 1,
    template_active: true,
    tenant_id: null,
    sections: [
      { title: 'Upon Arrival / Exterior Check', items: [] },
      { title: 'Interior Check', items: [] },
      { title: 'Water Zone Home Watch Method', items: [] },
      { title: 'AC System', items: [] },
      { title: 'Observe and Report', items: [] },
      { title: 'Storm Protection', items: [] },
      { title: 'Garage', items: [] },
      { title: 'Departure', items: [] }
    ]
  },
  {
    template_name: 'Condo/Villa',
    template_code: 'condo_villa_standard',
    property_type: 'condo_villa',
    template_category: 'home_watch_visit',
    template_description: 'Standard home watch visit checklist for condos and villas',
    version: 1,
    template_active: true,
    tenant_id: null,
    sections: [
      { title: 'Upon Arrival', items: [] },
      { title: 'Pool and Spa', items: [] },
      { title: 'Interior Check', items: [] },
      { title: 'Water Zone Home Watch Method', items: [] },
      { title: 'AC System', items: [] },
      { title: 'Observe and Report', items: [] },
      { title: 'Storm Protection', items: [] },
      { title: 'Garage', items: [] },
      { title: 'Departure', items: [] }
    ]
  },
  {
    template_name: 'High-Rise',
    template_code: 'high_rise_standard',
    property_type: 'high_rise',
    template_category: 'home_watch_visit',
    template_description: 'Standard home watch visit checklist for high-rise properties',
    version: 1,
    template_active: true,
    tenant_id: null,
    sections: [
      { title: 'Upon Arrival', items: [] },
      { title: 'Interior Check', items: [] },
      { title: 'Water Zone Home Watch Method', items: [] },
      { title: 'AC System', items: [] },
      { title: 'Observe and Report', items: [] },
      { title: 'Storm Protection', items: [] },
      { title: 'Departure', items: [] }
    ]
  },
  { template_name: 'Arrival / Departure Visit', template_code: 'arrival_departure_standard', property_type: null, template_category: 'arrival_departure', template_description: 'Checklist for arrival and departure visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Services & Observations', items: [] }] },
  { template_name: 'Access Visit', template_code: 'access_visit_standard', property_type: null, template_category: 'access_visit', template_description: 'Checklist for vendor/contractor access visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Vendor Information', items: [] }] },
  { template_name: 'Emergency Visit', template_code: 'emergency_visit_standard', property_type: null, template_category: 'emergency_visit', template_description: 'Checklist for emergency property visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Emergency Trigger', items: [] }, { title: 'Initial Assessment', items: [] }] },
  { template_name: 'Damage Recovery', template_code: 'damage_recovery_standard', property_type: null, template_category: 'damage_recovery', template_description: 'Ongoing damage recovery tracking checklist', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Issue Documentation', items: [] }, { title: 'Recovery Timeline', items: [] }] },
  { template_name: 'Auto Care Visit', template_code: 'auto_care_standard', property_type: null, template_category: 'auto_care', template_description: 'Checklist for vehicle care visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Mileage & Duration', items: [] }] },
  { template_name: 'Post-Storm Visit', template_code: 'post_storm_standard', property_type: null, template_category: 'post_storm', template_description: 'Checklist for post-storm property assessment', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Weather & Conditions', items: [] }] },
  { template_name: 'Client Service Visit', template_code: 'client_service_standard', property_type: null, template_category: 'client_service', template_description: 'Checklist for client service visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Request & Services', items: [] }] },
  { template_name: 'Concierge Service Visit', template_code: 'concierge_service_standard', property_type: null, template_category: 'concierge', template_description: 'Checklist for concierge service visits', version: 1, template_active: true, tenant_id: null, sections: [{ title: 'Visit Details', items: [] }, { title: 'Service Type', items: [] }] }
];

async function seedSystemTemplates(sr) {
  const results = [];

  for (const tmpl of TEMPLATES_WITH_SECTIONS) {
    const slug = tmpl.template_code;
    const existing = await sr.entities.ChecklistTemplateV2.filter({ template_code: slug });

    if (existing.length > 0) {
      results.push({ name: tmpl.template_name, status: 'exists', id: existing[0].id });
    } else {
      const created = await sr.entities.ChecklistTemplateV2.create(tmpl);
      results.push({ name: tmpl.template_name, status: 'created', id: created.id });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = await seedSystemTemplates(base44.asServiceRole);

    return Response.json({
      success: true,
      message: 'System templates seeded to ChecklistTemplateV2',
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});