import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only operation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find CompanyMember records for this user
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: email });

    if (members.length === 0) {
      return Response.json({ message: 'No company found for this user' });
    }

    const companyId = members[0].company_id;

    // Delete the company
    await base44.asServiceRole.entities.Company.delete(companyId);

    return Response.json({
      success: true,
      message: `Company ${companyId} deleted for user ${email}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});