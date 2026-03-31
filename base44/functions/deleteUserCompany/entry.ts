import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only operation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find TenantUser records for this user
    const tenantUsers = await base44.asServiceRole.entities.User.filter({ email });
    if (tenantUsers.length === 0) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    const user_id = tenantUsers[0].id;
    const tenants = await base44.asServiceRole.entities.TenantUser.filter({ user_id });

    if (tenants.length === 0) {
      return Response.json({ message: 'No tenant found for this user' });
    }

    // Delete TenantUser associations
    for (const tu of tenants) {
      await base44.asServiceRole.entities.TenantUser.delete(tu.id);
    }

    return Response.json({
      success: true,
      message: `Tenant associations deleted for user ${email}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});