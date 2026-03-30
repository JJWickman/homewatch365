import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentTenantId = user.primary_tenant_id;
    const sr = base44.asServiceRole;

    // Get current user's ChecklistTemplateV2 templates
    const v2Templates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: currentTenantId });

    // Map of template_code to get from old ChecklistTemplate entity
    const templateCodeToSlug = {
      'single_family_standard': 'single_family_standard',
      'condo_villa_standard': 'condo_villa_standard',
      'high_rise_standard': 'high_rise_standard',
      'arrival_departure_standard': 'arrival_departure_standard',
      'access_visit_standard': 'access_visit_standard',
      'emergency_visit_standard': 'emergency_visit_standard',
      'damage_recovery_standard': 'damage_recovery_standard',
      'auto_care_standard': 'auto_care_standard',
      'post_storm_standard': 'post_storm_standard',
      'client_service_standard': 'client_service_standard',
      'concierge_service_standard': 'concierge_service_standard'
    };

    // Get system templates from ChecklistTemplate (tenant_id: null)
    const oldTemplates = await sr.entities.ChecklistTemplate.filter({ tenant_id: null });

    let updatedCount = 0;

    for (const v2Template of v2Templates) {
      const slug = templateCodeToSlug[v2Template.template_code];
      const oldTemplate = oldTemplates.find(t => t.template_slug === slug);

      if (oldTemplate && oldTemplate.sections && oldTemplate.sections.length > 0) {
        await sr.entities.ChecklistTemplateV2.update(v2Template.id, {
          sections: oldTemplate.sections
        });
        updatedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Copied sections to ${updatedCount} templates from ChecklistTemplate`,
      updatedCount
    });
  } catch (error) {
    console.error('Copy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});