import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const targetUserEmail = payload.targetUserEmail || user.email;

    // Only allow users to reset their own data or admins to reset any user
    const isAdmin = user.role === 'admin';
    if (!isAdmin && targetUserEmail !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and delete CompanyMember records
    const companyMembers = await base44.asServiceRole.entities.CompanyMember.filter({
      user_email: targetUserEmail
    });

    for (const member of companyMembers) {
      await base44.asServiceRole.entities.CompanyMember.delete(member.id);
      
      // Delete the associated Company if this user was the owner
      const company = await base44.asServiceRole.entities.Company.filter({
        id: member.company_id
      });
      
      if (company.length > 0 && member.is_owner) {
        await base44.asServiceRole.entities.Company.delete(company[0].id);
      }
    }

    return Response.json({
      success: true,
      message: `Reset complete for ${targetUserEmail}. User can now sign up with a new company.`,
      deletedCompanyMembers: companyMembers.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});