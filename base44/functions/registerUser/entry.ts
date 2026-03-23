import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { email, full_name, company_name, company_slug } = await req.json();

    if (!email || !full_name || !company_name || !company_slug) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Step 1: Create the company (tenant) for this first user
    const company = await base44.asServiceRole.entities.Company.create({
      name: company_name,
      slug: company_slug,
      subscription_plan: 'solopreneur',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 day trial
    });

    // Step 2: Invite the user to the app
    await base44.asServiceRole.users.inviteUser(email, 'user');

    // Step 3: Update user with company_id (tenant isolation)
    await base44.asServiceRole.auth.updateUser(email, {
      company_id: company.id,
      full_name: full_name
    });

    // Step 4: Create CompanyMember record for role/permissions
    await base44.asServiceRole.entities.CompanyMember.create({
      company_id: company.id,
      user_email: email,
      user_name: full_name,
      role: 'administrator',
      access_level: 'admin',
      is_owner: true,
      is_active: true
    });

    return Response.json({
      success: true,
      message: 'Company and user account created',
      company_id: company.id
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Check if user already exists
    if (error.message && error.message.includes('already')) {
      return Response.json({
        success: false,
        error: 'User already exists'
      });
    }

    return Response.json({
      success: false,
      error: error.message || 'Failed to create user account'
    }, { status: 500 });
  }
});