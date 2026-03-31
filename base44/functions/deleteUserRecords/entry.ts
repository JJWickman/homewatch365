import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, tenant_id } = await req.json();

    if (!user_email || !tenant_id) {
      return Response.json({ error: 'Missing user_email or tenant_id' }, { status: 400 });
    }

    const entities = [
      'ActivityLog',
      'Client',
      'Property',
      'Inspection',
      'FollowUp',
      'Contractor',
      'Invoice',
      'Campaign',
      'CommunicationLog',
      'InspectionTemplate',
      'CommunicationTemplate',
      'CustomContractorType',
      'MarketingList'
    ];

    const results = {};

    for (const entityName of entities) {
      try {
        const recordsToDelete = await base44.asServiceRole.entities[entityName].filter({
          created_by: user_email,
          tenant_id: tenant_id
        });

        if (recordsToDelete.length > 0) {
          for (const record of recordsToDelete) {
            await base44.asServiceRole.entities[entityName].delete(record.id);
          }
          results[entityName] = { deleted: recordsToDelete.length };
        } else {
          results[entityName] = { deleted: 0 };
        }
      } catch (error) {
        results[entityName] = { error: error.message, deleted: 0 };
      }
    }

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.deleted || 0), 0);

    return Response.json({
      success: true,
      user_email,
      total_deleted: totalDeleted,
      details: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});