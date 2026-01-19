import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verify admin access
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the user to delete
    const usersToDelete = await base44.asServiceRole.entities.User.filter({ email });
    if (usersToDelete.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userToDelete = usersToDelete[0];

    // Find all company memberships
    const memberships = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: email });

    // Delete related data for each company
    for (const membership of memberships) {
      const companyId = membership.company_id;

      // Delete activity logs
      const activityLogs = await base44.asServiceRole.entities.ActivityLog.filter({ company_id: companyId, user_email: email });
      for (const log of activityLogs) {
        await base44.asServiceRole.entities.ActivityLog.delete(log.id);
      }

      // Delete company membership
      await base44.asServiceRole.entities.CompanyMember.delete(membership.id);
    }

    // Delete the user
    await base44.asServiceRole.entities.User.delete(userToDelete.id);

    return Response.json({
      success: true,
      message: `Successfully deleted user ${email} and all related data`,
      deletedCompanyMemberships: memberships.length
    });

  } catch (error) {
    console.error('Error deleting user data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});