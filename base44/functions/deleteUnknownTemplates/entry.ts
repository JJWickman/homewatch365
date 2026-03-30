import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    // Fetch a batch
    const all = await sr.entities.ChecklistTemplate.list('-created_date', 50);
    const toDelete = all.filter(t => t.name === 'unknown_name' || t.template_slug === 'unknown_code' || t.code === 'unknown_code');

    let deleted = 0;
    for (const t of toDelete) {
      await sr.entities.ChecklistTemplate.delete(t.id);
      deleted++;
    }

    return Response.json({ success: true, deleted, batch_size: all.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});