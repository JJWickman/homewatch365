import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const targetUserEmail = payload.targetUserEmail || user.email;

    // Only allow users to reset their own data or admins to reset any user
    const isAdmin = user.role === 'admin';
    if (!isAdmin && targetUserEmail !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and delete TenantUser records
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: targetUserEmail
    });

    for (const tenantUser of tenantUsers) {
      await base44.asServiceRole.entities.TenantUser.delete(tenantUser.id);
    }

    return Response.json({
      success: true,
      message: `Reset complete for ${targetUserEmail}. User can now sign up with a new company.`,
      deletedCompanyMembers: companyMembers.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});