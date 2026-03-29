import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'superadmin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { user_email, primary_tenant_id } = await req.json();

    if (!user_email || !primary_tenant_id) {
      return Response.json({ error: 'user_email and primary_tenant_id required' }, { status: 400 });
    }

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Update using service role to bypass RLS
    const updated = await base44.asServiceRole.entities.User.update(targetUser.id, {
      primary_tenant_id
    });

    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});