import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserEmail } = await req.json();

    if (!targetUserEmail) {
      return Response.json({ 
        error: 'Target user email is required' 
      }, { status: 400 });
    }

    // Check if current user is admin
    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (members.length === 0 || (members[0].role !== 'administrator' && !members[0].is_owner)) {
      return Response.json({ 
        error: 'Only administrators can reset user passwords' 
      }, { status: 403 });
    }

    const companyId = members[0].company_id;

    // Get target user
    const targetUsers = await base44.entities.User.filter({ email: targetUserEmail });
    if (targetUsers.length === 0) {
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check target user is in same company
    const targetMembers = await base44.entities.CompanyMember.filter({ 
      user_email: targetUserEmail,
      company_id: companyId
    });

    if (targetMembers.length === 0) {
      return Response.json({ 
        error: 'User not found in your company' 
      }, { status: 404 });
    }

    // Generate 6-digit reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update target user with reset code
    const targetUser = targetUsers[0];
    
    // Use service role to update other user
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      password_reset_code: code,
      password_reset_expires: expiresAt
    });

    // Send email to target user
    await base44.integrations.Core.SendEmail({
      from_name: 'Estate Watch 365',
      to: targetUserEmail,
      subject: 'Password Reset Request from Administrator',
      body: `
An administrator has requested a password reset for your account.

Your password reset code is:

${code}

This code will expire in 24 hours.

Use this code to reset your password in the app.

If you didn't request this, please contact your administrator.
      `.trim()
    });

    return Response.json({ 
      success: true, 
      message: `Password reset code sent to ${targetUserEmail}`
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});