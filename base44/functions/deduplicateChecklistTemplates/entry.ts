import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'superadmin') {
      return Response.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.list('-created_date', 2000);
    console.log(`Total templates: ${allTemplates.length}`);

    // Group by tenant_id + name, keep the first (oldest by created_date), delete the rest
    const seen = {};
    const toDelete = [];

    // Sort by created_date ascending so we keep the oldest
    const sorted = [...allTemplates].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    for (const t of sorted) {
      const key = `${t.tenant_id}__${t.name}`;
      if (seen[key]) {
        toDelete.push(t.id);
      } else {
        seen[key] = true;
      }
    }

    console.log(`Deleting ${toDelete.length} duplicate templates`);

    for (const id of toDelete) {
      await base44.asServiceRole.entities.ChecklistTemplate.delete(id);
    }

    return Response.json({
      success: true,
      totalBefore: allTemplates.length,
      deleted: toDelete.length,
      remaining: allTemplates.length - toDelete.length
    });
  } catch (error) {
    console.error('Error deduplicating:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});