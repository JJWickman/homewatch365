import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, company_id } = await req.json();

    if (!email || !company_id) {
      return Response.json({ error: 'Email and company_id are required' }, { status: 400 });
    }

    // Find the user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Update user via service role to set both fields
    await base44.asServiceRole.entities.User.update(user.id, { 
      onboarding_completed: true, 
      company_id: company_id
    });

    return Response.json({ 
      success: true, 
      message: 'Onboarding completed for ' + email 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});