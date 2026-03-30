import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── Home Watch Templates ────────────────────────────────────────────────────

const HOME_WATCH_TEMPLATES = [
  {
    meta: {
      name: 'Single Family Home',
      code: 'single_family_standard',
      property_type: 'single_family',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for single family homes',
      version: 1, active: true
    },
    sections: [],
    items: []
  },
  {
    meta: {
      name: 'Condo/Villa',
      code: 'condo_villa_standard',
      property_type: 'condo_villa',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for condos and villas',
      version: 1, active: true
    },
    sections: [],
    items: []
  },
  {
    meta: {
      name: 'High-Rise',
      code: 'high_rise_standard',
      property_type: 'high_rise',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for high-rise properties',
      version: 1, active: true
    },
    sections: [],
    items: []
  }
];

// ─── Service Visit Templates ─────────────────────────────────────────────────

const SERVICE_VISIT_TEMPLATES = [
  { meta: { name: 'Arrival / Departure Visit', code: 'arrival_departure_standard', property_type: null, category: 'arrival_departure', description: 'Checklist for arrival and departure visits', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Access Visit', code: 'access_visit_standard', property_type: null, category: 'access_visit', description: 'Checklist for vendor/contractor access visits', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Emergency Visit', code: 'emergency_visit_standard', property_type: null, category: 'emergency_visit', description: 'Checklist for emergency property visits', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Damage Recovery', code: 'damage_recovery_standard', property_type: null, category: 'damage_recovery', description: 'Ongoing damage recovery tracking checklist', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Auto Care Visit', code: 'auto_care_standard', property_type: null, category: 'auto_care', description: 'Checklist for vehicle care visits', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Post-Storm Visit', code: 'post_storm_standard', property_type: null, category: 'post_storm', description: 'Checklist for post-storm property assessment', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Client Service Visit', code: 'client_service_standard', property_type: null, category: 'client_service', description: 'Checklist for client service visits', version: 1, active: true }, sections: [], items: [] },
  { meta: { name: 'Concierge Service Visit', code: 'concierge_service_standard', property_type: null, category: 'concierge', description: 'Checklist for concierge service visits', version: 1, active: true }, sections: [], items: [] }
];

const ALL_TEMPLATES = [...HOME_WATCH_TEMPLATES, ...SERVICE_VISIT_TEMPLATES];

// Seeds all 11 system templates to ChecklistTemplateV2
async function seedSystemTemplates(sr) {
  const results = [];

  for (const tmpl of ALL_TEMPLATES) {
    const slug = tmpl.meta.code;
    const existing = await sr.entities.ChecklistTemplateV2.filter({ template_code: slug });

    if (existing.length > 0) {
      // Already exists, skip
      results.push({ name: tmpl.meta.name, status: 'exists', id: existing[0].id });
    } else {
      const created = await sr.entities.ChecklistTemplateV2.create({
        template_name: tmpl.meta.name,
        template_code: slug,
        property_type: tmpl.meta.property_type || null,
        template_category: tmpl.meta.category,
        template_description: tmpl.meta.description,
        version: 1,
        template_active: true,
        tenant_id: null,
      });
      results.push({ name: tmpl.meta.name, status: 'created', id: created.id });
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