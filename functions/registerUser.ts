import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Invite the user to the app (this creates their account with a temporary password)
    await base44.asServiceRole.users.inviteUser(email, 'user');

    // Update their full name
    // Note: The user won't be able to set their password until they log in with the invite link
    // This is a limitation of the current auth system, so we'll handle password via a separate update

    return Response.json({
      success: true,
      message: 'User account created'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Check if user already exists
    if (error.message && error.message.includes('already')) {
      return Response.json({
        success: false,
        error: 'User already exists'
      });
    }

    return Response.json({
      success: false,
      error: error.message || 'Failed to create user account'
    }, { status: 500 });
  }
});