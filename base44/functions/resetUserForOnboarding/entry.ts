import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear company_id and onboarding_completed so user can start fresh
    await base44.auth.updateMe({
      company_id: null,
      onboarding_completed: false
    });

    return Response.json({
      success: true,
      message: 'User reset for onboarding',
      user_email: user.email
    });
  } catch (error) {
    console.error('Error resetting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});