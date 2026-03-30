import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sr = base44.asServiceRole;
    const tenantId = user.primary_tenant_id;

    // Get all system templates from ChecklistTemplate (source with sections)
    const sourceTemplates = await sr.entities.ChecklistTemplate.filter({ tenant_id: null });
    
    // Get existing V2 templates for tenant
    const existingV2 = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: tenantId });

    let updatedCount = 0;
    const results = [];

    // For each source template, find matching V2 and update with full sections
    for (const source of sourceTemplates) {
      // Match by name
      const existing = existingV2.find(v2 => v2.template_name === source.name);
      
      if (existing && source.sections && source.sections.length > 0) {
        // Update with complete sections
        await sr.entities.ChecklistTemplateV2.update(existing.id, {
          sections: source.sections
        });
        updatedCount++;
        results.push({
          template_code: existing.template_code,
          template_name: existing.template_name,
          sectionsCount: source.sections.length,
          itemsCount: source.sections.reduce((sum, s) => sum + (s.items?.length || 0), 0)
        });
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${updatedCount} V2 templates with sections`,
      updatedCount,
      results
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});