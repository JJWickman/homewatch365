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

    // Get all ChecklistTemplateV2 records for tenant
    const allTemplates = await sr.entities.ChecklistTemplateV2.filter({ tenant_id: tenantId });

    // Group by template_code to find duplicates
    const grouped = {};
    for (const t of allTemplates) {
      if (!grouped[t.template_code]) {
        grouped[t.template_code] = [];
      }
      grouped[t.template_code].push(t);
    }

    let deletedCount = 0;
    const deleted = [];

    // For each code with duplicates, keep the one with sections, delete others
    for (const [code, templates] of Object.entries(grouped)) {
      if (templates.length > 1) {
        // Sort by whether it has sections
        const withSections = templates.filter(t => t.sections && t.sections.length > 0);
        const withoutSections = templates.filter(t => !t.sections || t.sections.length === 0);

        // Keep one with sections, delete all others
        const toKeep = withSections.length > 0 ? withSections[0] : templates[0];
        const toDelete = templates.filter(t => t.id !== toKeep.id);

        for (const t of toDelete) {
          await sr.entities.ChecklistTemplateV2.delete(t.id);
          deletedCount++;
          deleted.push({ template_code: code, id: t.id });
        }
      }
    }

    return Response.json({
      success: true,
      message: `Deleted ${deletedCount} duplicate templates`,
      deletedCount,
      deleted
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});