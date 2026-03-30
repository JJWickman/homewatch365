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

    // Get all system templates from ChecklistTemplate (with full sections)
    const oldTemplates = await sr.entities.ChecklistTemplate.filter({ tenant_id: null });
    
    // Get all tenant's ChecklistTemplateV2 records
    const v2Templates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: tenantId });

    let updatedCount = 0;
    const updates = [];

    // Match by name and copy ENTIRE sections with full item structure
    for (const v2Template of v2Templates) {
      const oldTemplate = oldTemplates.find(ot => ot.name === v2Template.template_name);
      
      if (oldTemplate && oldTemplate.sections && oldTemplate.sections.length > 0) {
        // Copy the complete sections array with all nested items
        await sr.entities.ChecklistTemplateV2.update(v2Template.id, {
          sections: oldTemplate.sections
        });
        updatedCount++;
        updates.push({ 
          template_code: v2Template.template_code,
          template_name: v2Template.template_name,
          sectionsCount: oldTemplate.sections.length,
          totalItems: oldTemplate.sections.reduce((sum, s) => sum + (s.items?.length || 0), 0)
        });
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updatedCount} templates with full sections and items`,
      updatedCount,
      details: updates
    });
  } catch (error) {
    console.error('Copy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});