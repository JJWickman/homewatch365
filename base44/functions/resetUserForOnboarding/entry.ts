import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { target_email } = await req.json().catch(() => ({}));
    const email = target_email || user.email;

    // Find user record
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (!users.length) {
      return Response.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    const targetUser = users[0];

    // Full reset — wipe all tenant/company/onboarding fields
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      primary_tenant_id: null,
      company_id: null,
      onboarding_completed: false
    });

    return Response.json({
      success: true,
      message: `User ${email} reset — they will see the new onboarding flow on next login`,
      user_id: targetUser.id
    });

  } catch (error) {
    console.error('Error resetting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});