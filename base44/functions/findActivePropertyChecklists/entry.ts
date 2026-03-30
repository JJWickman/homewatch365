import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const sr = (await import('npm:@base44/sdk@0.8.23')).createClientFromRequest(req).asServiceRole;

    // Find source user
    const sourceUsers = await sr.entities.User.filter({ email: 'jason@agilidy.com' });
    if (sourceUsers.length === 0) {
      return Response.json({ error: 'Source user not found' }, { status: 404 });
    }
    
    const sourceTenantId = sourceUsers[0].primary_tenant_id;

    // Get property checklists for jason's tenant
    const propertyChecklists = await sr.entities.PropertyChecklist.filter({ 
      tenant_id: sourceTenantId 
    });

    const withCustomSections = propertyChecklists.filter(c => c.customized_sections && c.customized_sections.length > 0);

    return Response.json({
      totalPropertyChecklists: propertyChecklists.length,
      withCustomSections: withCustomSections.length,
      examples: propertyChecklists.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        template_id: c.template_id,
        sectionsCount: c.customized_sections ? c.customized_sections.length : 0,
        firstSection: c.customized_sections ? c.customized_sections[0]?.title : null
      })),
      firstWithSections: withCustomSections[0] ? {
        id: withCustomSections[0].id,
        name: withCustomSections[0].name,
        customized_sections: withCustomSections[0].customized_sections
      } : null
    });
  } catch (error) {
    console.error('Inspect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});