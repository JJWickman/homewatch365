import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { token, password, full_name } = await req.json();

    if (!token || !full_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find invitation by token
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ token });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invalid invitation link' }, { status: 400 });
    }

    const invitation = invitations[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Invitation.update(invitation.id, { status: 'expired' });
      return Response.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return Response.json({ error: 'Invitation already used' }, { status: 400 });
    }

    // Invite user to platform
    await base44.asServiceRole.users.inviteUser(invitation.invitee_email, 'user');

    // Set user's primary_tenant_id and full_name
    await base44.asServiceRole.auth.updateUser(invitation.invitee_email, {
      primary_tenant_id: invitation.tenant_id,
      full_name: full_name
    });

    // Find the newly created user
    const users = await base44.asServiceRole.entities.User.filter({ email: invitation.invitee_email });
    const userId = users.length > 0 ? users[0].id : null;

    if (userId) {
      // Create TenantUser record
      await base44.asServiceRole.entities.TenantUser.create({
        tenant_id: invitation.tenant_id,
        user_id: userId,
        role_in_tenant: invitation.role || 'field_inspector',
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