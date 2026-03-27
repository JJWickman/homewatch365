import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_email, new_name } = await req.json();

    if (!user_email || !new_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update Visit assigned_to_name records
    const visits = await base44.asServiceRole.entities.Visit.filter({ assigned_to: user_email });
    for (const visit of visits) {
      await base44.asServiceRole.entities.Visit.update(visit.id, { assigned_to_name: new_name });
    }

    // Update FollowUp assigned_to_name records
    const followups = await base44.asServiceRole.entities.FollowUp.filter({ assigned_to: user_email });
    for (const followup of followups) {
      await base44.asServiceRole.entities.FollowUp.update(followup.id, { assigned_to_name: new_name });
    }

    return Response.json({
      success: true,
      message: `Updated name references for ${user_email} to "${new_name}"`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});