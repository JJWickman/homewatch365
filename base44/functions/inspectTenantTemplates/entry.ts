import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Query all ChecklistTemplate records for the tenant
    const templates = await sr.entities.ChecklistTemplate.filter({ tenant_id: '69c4784908cbd3c8bce515f0' });

    return Response.json({
      success: true,
      count: templates.length,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        template_slug: t.template_slug,
        tenant_id: t.tenant_id,
        is_system_template: t.is_system_template,
        active: t.active
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});