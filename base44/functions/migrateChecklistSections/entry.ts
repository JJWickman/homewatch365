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

    // Get restored ChecklistTemplate records (system templates, tenant_id: null)
    const oldTemplates = await sr.entities.ChecklistTemplate.filter({ tenant_id: null });
    
    // Get current tenant's ChecklistTemplateV2 records
    const v2Templates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: tenantId });

    if (oldTemplates.length === 0) {
      return Response.json({ error: 'No ChecklistTemplate records found' }, { status: 404 });
    }

    // Match by name and copy sections
    let updatedCount = 0;
    const updates = [];

    for (const v2Template of v2Templates) {
      // Match by template name
      const oldTemplate = oldTemplates.find(ot => ot.name === v2Template.template_name);
      
      if (oldTemplate && oldTemplate.sections && oldTemplate.sections.length > 0) {
        await sr.entities.ChecklistTemplateV2.update(v2Template.id, {
          sections: oldTemplate.sections
        });
        updatedCount++;
        updates.push({ 
          template_code: v2Template.template_code,
          template_name: v2Template.template_name,
          sectionsCount: oldTemplate.sections.length
        });
      }
    }

    return Response.json({
      success: true,
      updatedCount,
      details: updates
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});