import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, first_name, last_name } = await req.json();

    if (!user_email || !first_name || !last_name) {
      return Response.json({ error: 'Missing user_email, first_name, or last_name' }, { status: 400 });
    }

    const full_name = `${first_name} ${last_name}`;

    // Entities that have user_name and assigned_to_name fields
    const entitiesWithNames = [
      { name: 'ActivityLog', fields: ['user_name'] },
      { name: 'Inspection', fields: ['assigned_to_name'] },
      { name: 'FollowUp', fields: ['assigned_to_name'] },
      { name: 'CompanyMember', fields: ['user_name'] }
    ];

    const results = {};

    for (const entity of entitiesWithNames) {
      try {
        const filter = { created_by: user_email };
        const records = await base44.asServiceRole.entities[entity.name].filter(filter);

        let updated = 0;
        for (const record of records) {
          const updateData = {};
          for (const field of entity.fields) {
            updateData[field] = full_name;
          }
          await base44.asServiceRole.entities[entity.name].update(record.id, updateData);
          updated++;
        }
        results[entity.name] = { updated };
      } catch (error) {
        results[entity.name] = { error: error.message, updated: 0 };
      }
    }

    const totalUpdated = Object.values(results).reduce((sum, r) => sum + (r.updated || 0), 0);

    return Response.json({
      success: true,
      user_email,
      new_name: full_name,
      total_updated: totalUpdated,
      details: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});