import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    
    // Find diane's CompanyMember record
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: email });
    if (members.length === 0) {
      return Response.json({ error: 'No company found for this user' }, { status: 404 });
    }

    const realCompanyId = members[0].company_id;
    
    // Verify company exists
    const companies = await base44.asServiceRole.entities.Company.filter({ id: realCompanyId });
    if (companies.length === 0) {
      return Response.json({ error: 'Company record missing' }, { status: 404 });
    }

    // Find the user and update their company_id
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = users[0];
    
    // Update user's company_id to match the real one
    await base44.asServiceRole.entities.User.update(currentUser.id, {
      company_id: realCompanyId,
      onboarding_completed: true
    });

    return Response.json({
      success: true,
      message: `Fixed link for ${email}`,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        company_id: realCompanyId
      },
      company: {
        id: companies[0].id,
        name: companies[0].name,
        subscription_plan: companies[0].subscription_plan
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});