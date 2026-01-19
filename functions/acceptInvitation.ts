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

    // Register the user
    const registerResponse = await base44.asServiceRole.functions.invoke('registerUser', {
      email: invitation.invitee_email,
      password: password,
      full_name: full_name
    });

    if (!registerResponse.data.success) {
      return Response.json({ error: registerResponse.data.error || 'Failed to create account' }, { status: 400 });
    }

    // Activate the CompanyMember
    const members = await base44.asServiceRole.entities.CompanyMember.filter({
      company_id: invitation.company_id,
      user_email: invitation.invitee_email
    });

    if (members.length > 0) {
      await base44.asServiceRole.entities.CompanyMember.update(members[0].id, {
        is_active: true
      });
    }

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