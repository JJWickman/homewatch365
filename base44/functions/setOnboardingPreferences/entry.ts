import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, onboardingDismissed } = await req.json();

    if (!email || onboardingDismissed === undefined) {
      return Response.json({ error: 'Missing email or onboardingDismissed' }, { status: 400 });
    }

    // Get all users and find the one with matching email
    const users = await base44.asServiceRole.entities.User.filter({ email });

    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Update the user's onboarding_dismissed preference
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      onboarding_dismissed: onboardingDismissed
    });

    return Response.json({
      success: true,
      email,
      onboarding_dismissed: onboardingDismissed,
      message: `Updated ${email}: onboarding_dismissed = ${onboardingDismissed}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});