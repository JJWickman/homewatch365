import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Find source user
    const sourceUsers = await sr.entities.User.filter({ email: 'jason@agilidy.com' });
    if (sourceUsers.length === 0) {
      return Response.json({ error: 'Source user not found' }, { status: 404 });
    }
    
    const sourceTenantId = sourceUsers[0].primary_tenant_id;
    const sourceTemplates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: sourceTenantId });

    // Get detailed view of first template
    const firstTemplate = sourceTemplates[0];
    
    return Response.json({
      templateCount: sourceTemplates.length,
      firstTemplate: firstTemplate ? {
        id: firstTemplate.id,
        template_name: firstTemplate.template_name,
        template_code: firstTemplate.template_code,
        sections: firstTemplate.sections,
        allKeys: Object.keys(firstTemplate).sort()
      } : null,
      allTemplates: sourceTemplates.map(t => ({
        template_code: t.template_code,
        template_name: t.template_name,
        hasSections: !!(t.sections && t.sections.length > 0)
      }))
    });
  } catch (error) {
    console.error('Inspect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});