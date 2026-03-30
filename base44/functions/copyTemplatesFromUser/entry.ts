import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const currentTenantId = user.primary_tenant_id;
    
    // Find the source user (jason@agilidy.com)
    const sourceUsers = await base44.asServiceRole.entities.User.filter({ email: 'jason@agilidy.com' });
    if (sourceUsers.length === 0) {
      return Response.json({ error: 'Source user not found' }, { status: 404 });
    }
    
    const sourceUser = sourceUsers[0];
    const sourceTenantId = sourceUser.primary_tenant_id;

    // Get source tenant's templates
    const sourceTemplates = await base44.asServiceRole.entities.ChecklistTemplateV2.filter({ 
      tenant_id: sourceTenantId 
    });

    if (sourceTemplates.length === 0) {
      return Response.json({ error: 'No templates found in source account' }, { status: 404 });
    }

    // Get current user's templates
    const currentTemplates = await base44.asServiceRole.entities.ChecklistTemplateV2.filter({ 
      tenant_id: currentTenantId 
    });

    let updatedCount = 0;

    // Match by template_code and copy sections
    for (const currentTemplate of currentTemplates) {
      const sourceTemplate = sourceTemplates.find(t => t.template_code === currentTemplate.template_code);
      
      if (sourceTemplate && sourceTemplate.sections && sourceTemplate.sections.length > 0) {
        await base44.asServiceRole.entities.ChecklistTemplateV2.update(currentTemplate.id, {
          sections: sourceTemplate.sections
        });
        updatedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Copied sections to ${updatedCount} templates`,
      updatedCount
    });
  } catch (error) {
    console.error('Copy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});