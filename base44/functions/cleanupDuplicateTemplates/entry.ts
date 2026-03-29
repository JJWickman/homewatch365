import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all templates
    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.list();

    // Group by (tenant_id, code)
    const groups = {};
    allTemplates.forEach(t => {
      const key = `${t.tenant_id || 'null'}|${t.code}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Find duplicates: for each group with >1, keep oldest, delete rest
    const toDelete = [];
    const stats = { totalGroups: 0, duplicateGroups: 0, deleted: 0 };

    Object.entries(groups).forEach(([key, templates]) => {
      stats.totalGroups++;
      if (templates.length > 1) {
        stats.duplicateGroups++;
        // Sort by created_date, keep first
        const sorted = templates.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const keep = sorted[0];
        const deleteThese = sorted.slice(1);
        toDelete.push(...deleteThese.map(t => ({ id: t.id, name: t.name, created: t.created_date })));
      }
    });

    // Delete all duplicates
    for (const template of toDelete) {
      await base44.asServiceRole.entities.ChecklistTemplate.delete(template.id);
      stats.deleted++;
    }

    return Response.json({
      success: true,
      stats,
      deleted_ids: toDelete.map(t => t.id),
      deleted_count: toDelete.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});