import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user by email
    const users = await base44.entities.User.filter({ email });
    if (users.length === 0) {
      // Don't reveal if email exists
      return Response.json({ success: true, message: 'If email exists, reset code sent' });
    }

    const user = users[0];

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store code in user record
    await base44.auth.updateMe({
      password_reset_code: code,
      password_reset_expires: expiresAt
    });

    // Send email with code
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Your Password Reset Code',
      body: `
Your password reset code is:

${code}

This code will expire in 15 minutes.

If you didn't request a password reset, please ignore this email.
      `.trim()
    });

    return Response.json({ 
      success: true, 
      message: 'Password reset code sent to email'
    });
  } catch (error) {
    console.error('Error sending reset code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});