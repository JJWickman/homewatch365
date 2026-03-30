import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;

  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await sr.entities.ChecklistTemplate.filter({ name: 'unknown_name' }, null, 50);
    if (batch.length === 0) {
      hasMore = false;
      break;
    }
    for (const t of batch) {
      await sr.entities.ChecklistTemplate.delete(t.id);
      totalDeleted++;
      await new Promise(r => setTimeout(r, 80));
    }
    if (batch.length < 50) hasMore = false;
  }

  return Response.json({ success: true, totalDeleted, status: 'all done' });
});