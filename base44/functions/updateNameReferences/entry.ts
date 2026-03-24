import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_email, new_name, company_id } = await req.json();

    if (!user_email || !new_name || !company_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update ActivityLog records
    await base44.asServiceRole.entities.ActivityLog.bulkUpdate(
      { company_id, user_email },
      { user_name: new_name }
    );

    // Update Inspection assigned_to_name records
    await base44.asServiceRole.entities.Inspection.bulkUpdate(
      { company_id, assigned_to: user_email },
      { assigned_to_name: new_name }
    );

    // Update FollowUp assigned_to_name records
    await base44.asServiceRole.entities.FollowUp.bulkUpdate(
      { company_id, assigned_to: user_email },
      { assigned_to_name: new_name }
    );

    // Update CompanyMember user_name
    const members = await base44.asServiceRole.entities.CompanyMember.filter({
      company_id,
      user_email
    });

    for (const member of members) {
      await base44.asServiceRole.entities.CompanyMember.update(member.id, {
        user_name: new_name
      });
    }

    return Response.json({
      success: true,
      message: `Updated name references for ${user_email} to "${new_name}"`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});