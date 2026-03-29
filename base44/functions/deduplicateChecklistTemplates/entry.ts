import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'No tenant found' }, { status: 400 });
    }

    const tenantId = user.primary_tenant_id;
    const CORE_CODES = ['single_family_standard', 'condo_villa_standard', 'high_rise_standard'];

    // Fetch all templates for this tenant
    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
      tenant_id: tenantId
    });

    // Group by code
    const byCode = {};
    allTemplates.forEach(t => {
      if (!byCode[t.code]) byCode[t.code] = [];
      byCode[t.code].push(t);
    });

    // Identify and delete duplicates
    const deleted = [];
    for (const code of CORE_CODES) {
      if (byCode[code] && byCode[code].length > 1) {
        // Sort by created_date, keep oldest, delete rest
        const sorted = byCode[code].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const toDelete = sorted.slice(1); // Skip first (oldest)
        
        for (const template of toDelete) {
          await base44.asServiceRole.entities.ChecklistTemplate.delete(template.id);
          deleted.push({
            id: template.id,
            code: template.code,
            name: template.name,
            created_date: template.created_date
          });
        }
      }
    }

    return Response.json({
      success: true,
      tenant_id: tenantId,
      user_email: user.email,
      duplicates_deleted: deleted.length,
      deleted_templates: deleted,
      message: `Deleted ${deleted.length} duplicate core templates. Your tenant now has 3 core templates.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});