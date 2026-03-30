import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentTenantId = user.primary_tenant_id;

    // Find source user
    const sourceUsers = await base44.asServiceRole.entities.User.filter({ email: 'jason@agilidy.com' });
    if (sourceUsers.length === 0) {
      return Response.json({ error: 'Source user not found' }, { status: 404 });
    }
    
    const sourceTenantId = sourceUsers[0].primary_tenant_id;

    // Get both tenants' templates
    const sourceTemplates = await base44.asServiceRole.entities.ChecklistTemplateV2.filter({ 
      tenant_id: sourceTenantId 
    });
    const currentTemplates = await base44.asServiceRole.entities.ChecklistTemplateV2.filter({ 
      tenant_id: currentTenantId 
    });

    return Response.json({
      sourceTenantId,
      currentTenantId,
      sourceTemplateCount: sourceTemplates.length,
      currentTemplateCount: currentTemplates.length,
      sourceTemplatesSample: sourceTemplates.slice(0, 2).map(t => ({
        id: t.id,
        template_code: t.template_code,
        template_name: t.template_name,
        hasSections: !!(t.sections && t.sections.length > 0),
        sectionsCount: t.sections ? t.sections.length : 0
      })),
      currentTemplatesSample: currentTemplates.slice(0, 2).map(t => ({
        id: t.id,
        template_code: t.template_code,
        template_name: t.template_name,
        hasSections: !!(t.sections && t.sections.length > 0),
        sectionsCount: t.sections ? t.sections.length : 0
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});