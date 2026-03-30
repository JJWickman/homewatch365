import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const tenantId = '69c4784908cbd3c8bce515f0';
    const templates = await sr.entities.ChecklistTemplate.filter({ tenant_id: tenantId });

    return Response.json({
      success: true,
      tenantId,
      count: templates.length,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        template_slug: t.template_slug
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});