import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'superadmin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { user_id, primary_tenant_id } = await req.json();

    if (!user_id || !primary_tenant_id) {
      return Response.json({ error: 'user_id and primary_tenant_id required' }, { status: 400 });
    }

    // Update using service role to bypass RLS
    const updated = await base44.asServiceRole.entities.User.update(user_id, {
      primary_tenant_id
    });

    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});