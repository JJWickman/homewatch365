import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return Response.json({ 
        error: 'Email, code, and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 });
    }

    // Get user
    const users = await base44.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const user = users[0];

    // Check if code matches and is not expired
    if (!user.password_reset_code || user.password_reset_code !== code) {
      return Response.json({ 
        error: 'Invalid reset code' 
      }, { status: 400 });
    }

    if (new Date() > new Date(user.password_reset_expires)) {
      return Response.json({ 
        error: 'Reset code has expired' 
      }, { status: 400 });
    }

    // Update password via auth using SDK
    await base44.asServiceRole.auth.resetUserPassword(email, newPassword);

    // Clear reset code
    await base44.auth.updateMe({
      password_reset_code: null,
      password_reset_expires: null
    });

    return Response.json({ 
      success: true, 
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});