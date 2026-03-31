import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Find the Follow-Up template (should be tenant-specific currently)
    const templates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
      template_slug: 'followup_standard'
    });

    if (templates.length === 0) {
      return Response.json({ error: 'Follow-Up template not found' }, { status: 404 });
    }

    const template = templates[0];

    // Convert to system template
    await base44.asServiceRole.entities.ChecklistTemplate.update(template.id, {
      tenant_id: null,
      is_system_template: true
    });

    console.log('Converted Follow-Up to system template');

    // Find Agilidy tenant
    const agilidy = await base44.asServiceRole.entities.Tenant.filter({
      slug: 'agilidy'
    });

    if (agilidy.length === 0) {
      return Response.json({
        success: true,
        message: 'Promoted to system template, but Agilidy tenant not found'
      });
    }

    const agilityTenantId = agilidy[0].id;

    // Create a copy for Agilidy
    const templateCopy = await base44.asServiceRole.entities.ChecklistTemplate.create({
      ...template,
      id: undefined, // Let DB generate new ID
      tenant_id: agilityTenantId,
      is_system_template: false
    });

    console.log(`Created Follow-Up template copy for Agilidy: ${templateCopy.id}`);

    return Response.json({
      success: true,
      message: 'Promoted Follow-Up to system template and seeded to Agilidy',
      systemTemplateId: template.id,
      agilityTemplateId: templateCopy.id
    });
  } catch (error) {
    console.error('Error promoting template:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});