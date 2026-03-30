import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TEMPLATES_WITH_SECTIONS = [
  { template_name: 'Single Family Home', template_code: 'single_family_standard', property_type: 'single_family', template_category: 'home_watch_visit', template_description: 'Standard home watch visit checklist for single family homes', version: 1, template_active: true, sections: [] },
  { template_name: 'Condo/Villa', template_code: 'condo_villa_standard', property_type: 'condo_villa', template_category: 'home_watch_visit', template_description: 'Standard home watch visit checklist for condos and villas', version: 1, template_active: true, sections: [] },
  { template_name: 'High-Rise', template_code: 'high_rise_standard', property_type: 'high_rise', template_category: 'home_watch_visit', template_description: 'Standard home watch visit checklist for high-rise properties', version: 1, template_active: true, sections: [] },
  { template_name: 'Arrival / Departure Visit', template_code: 'arrival_departure_standard', property_type: null, template_category: 'arrival_departure', template_description: 'Checklist for arrival and departure visits', version: 1, template_active: true, sections: [] },
  { template_name: 'Access Visit', template_code: 'access_visit_standard', property_type: null, template_category: 'access_visit', template_description: 'Checklist for vendor/contractor access visits', version: 1, template_active: true, sections: [] },
  { template_name: 'Emergency Visit', template_code: 'emergency_visit_standard', property_type: null, template_category: 'emergency_visit', template_description: 'Checklist for emergency property visits', version: 1, template_active: true, sections: [] },
  { template_name: 'Damage Recovery', template_code: 'damage_recovery_standard', property_type: null, template_category: 'damage_recovery', template_description: 'Ongoing damage recovery tracking checklist', version: 1, template_active: true, sections: [] },
  { template_name: 'Auto Care Visit', template_code: 'auto_care_standard', property_type: null, template_category: 'auto_care', template_description: 'Checklist for vehicle care visits', version: 1, template_active: true, sections: [] },
  { template_name: 'Post-Storm Visit', template_code: 'post_storm_standard', property_type: null, template_category: 'post_storm', template_description: 'Checklist for post-storm property assessment', version: 1, template_active: true, sections: [] },
  { template_name: 'Client Service Visit', template_code: 'client_service_standard', property_type: null, template_category: 'client_service', template_description: 'Checklist for client service visits', version: 1, template_active: true, sections: [] },
  { template_name: 'Concierge Service Visit', template_code: 'concierge_service_standard', property_type: null, template_category: 'concierge', template_description: 'Checklist for concierge service visits', version: 1, template_active: true, sections: [] }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentTenantId = user.primary_tenant_id;
    const sr = base44.asServiceRole;

    // Find source user
    const sourceUsers = await sr.entities.User.filter({ email: 'jason@agilidy.com' });
    if (sourceUsers.length === 0) {
      return Response.json({ error: 'Source user not found' }, { status: 404 });
    }
    
    const sourceTenantId = sourceUsers[0].primary_tenant_id;
    const sourceTemplates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: sourceTenantId });

    // Seed templates to current tenant
    let seededCount = 0;
    const createdTemplates = [];

    for (const tmpl of TEMPLATES_WITH_SECTIONS) {
      const sourceTemplate = sourceTemplates.find(t => t.template_code === tmpl.template_code);
      const sections = sourceTemplate?.sections || [];
      
      const created = await sr.entities.ChecklistTemplateV2.create({
        ...tmpl,
        tenant_id: currentTenantId,
        sections
      });
      
      createdTemplates.push({ id: created.id, template_code: tmpl.template_code });
      seededCount++;
    }

    return Response.json({
      success: true,
      message: `Seeded ${seededCount} templates and copied ${createdTemplates.filter(t => sourceTemplates.find(s => s.template_code === t.template_code)?.sections?.length > 0).length} with sections`,
      seededCount
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});