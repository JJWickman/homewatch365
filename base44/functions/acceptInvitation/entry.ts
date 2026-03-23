import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { token, password, full_name } = await req.json();

    if (!token || !password || !full_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find invitation by token
    const invitations = await base44.asServiceRole.entities.Invitation.filter({
      token: token
    });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invalid invitation link' }, { status: 400 });
    }

    const invitation = invitations[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Invitation.update(invitation.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return Response.json({ error: 'Invitation already used' }, { status: 400 });
    }

    // Step 1: Invite user to app
    await base44.asServiceRole.users.inviteUser(invitation.invitee_email, 'user');

    // Step 2: Set user's company_id to the inviter's company (tenant isolation)
    await base44.asServiceRole.auth.updateUser(invitation.invitee_email, {
      company_id: invitation.company_id,
      full_name: full_name
    });

    // Step 3: Create CompanyMember for this user with the role specified in invitation
    const newMember = await base44.asServiceRole.entities.CompanyMember.create({
      company_id: invitation.company_id,
      user_email: invitation.invitee_email,
      user_name: full_name,
      role: invitation.role || 'field_inspector',
      access_level: invitation.access_level || 'user',
      is_active: true
    });

    // Mark invitation as accepted
    await base44.asServiceRole.entities.Invitation.update(invitation.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Invitation accepted and account created'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});