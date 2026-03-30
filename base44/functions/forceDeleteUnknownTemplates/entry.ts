import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;

  let totalDeleted = 0;
  let hasMore = true;
  const maxIterations = 100;
  let iterations = 0;

  while (hasMore && iterations < maxIterations) {
    iterations++;
    const batch = await sr.entities.ChecklistTemplate.filter({ name: 'unknown_name' }, null, 100);
    
    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const record of batch) {
      try {
        await sr.entities.ChecklistTemplate.delete(record.id);
        totalDeleted++;
      } catch (err) {
        console.error(`Failed to delete ${record.id}:`, err.message);
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 50));
    }

    if (batch.length < 100) {
      hasMore = false;
    }
  }

  return Response.json({
    success: true,
    totalDeleted,
    iterations,
    message: `Force-deleted ${totalDeleted} unknown_name templates across ${iterations} iterations`
  });
});