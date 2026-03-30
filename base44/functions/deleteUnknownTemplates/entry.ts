import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const batch = await sr.entities.ChecklistTemplate.filter({ name: 'unknown_name' }, null, 20);
    
    let deleted = 0;
    for (const t of batch) {
      await sr.entities.ChecklistTemplate.delete(t.id);
      deleted++;
      await new Promise(r => setTimeout(r, 300));
    }

    return Response.json({ success: true, deleted, remaining: batch.length === 20 ? 'more exist, run again' : 'all done' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});