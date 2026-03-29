import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'No tenant found' }, { status: 400 });
    }

    const tenantId = user.primary_tenant_id;

    // Get all templates for this tenant
    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
      tenant_id: tenantId
    });

    // Core template codes - should have exactly 1 of each
    const CORE_CODES = ['single_family_standard', 'condo_villa_standard', 'high_rise_standard'];

    // Group by code
    const templatesByCode = {};
    allTemplates.forEach(t => {
      if (!templatesByCode[t.code]) templatesByCode[t.code] = [];
      templatesByCode[t.code].push(t);
    });

    // Identify duplicates
    const duplicates = [];
    const toDelete = [];
    CORE_CODES.forEach(code => {
      if (templatesByCode[code] && templatesByCode[code].length > 1) {
        duplicates.push({
          code,
          count: templatesByCode[code].length,
          templates: templatesByCode[code].map(t => ({ id: t.id, name: t.name, created_date: t.created_date }))
        });
        // Keep the first (oldest), delete the rest
        toDelete.push(...templatesByCode[code].slice(1).map(t => t.id));
      }
    });

    // Delete duplicates
    let deleted = 0;
    for (const templateId of toDelete) {
      await base44.asServiceRole.entities.ChecklistTemplate.delete(templateId);
      deleted++;
    }

    // Get final count
    const finalTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
      tenant_id: tenantId
    });

    return Response.json({
      success: true,
      tenant_id: tenantId,
      user_email: user.email,
      before_count: allTemplates.length,
      after_count: finalTemplates.length,
      duplicates_found: duplicates,
      deleted_count: deleted,
      deleted_ids: toDelete,
      final_templates: finalTemplates.map(t => ({ id: t.id, code: t.code, name: t.name }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});