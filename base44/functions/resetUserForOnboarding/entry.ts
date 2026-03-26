import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear primary_tenant_id so user sees onboarding again
    await base44.auth.updateMe({
      primary_tenant_id: null
    });

    return Response.json({
      success: true,
      message: 'User reset for onboarding. Refresh the page to start over.'
    });

  } catch (error) {
    console.error('Error resetting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});