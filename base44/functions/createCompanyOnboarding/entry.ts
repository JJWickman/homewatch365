import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, email, phone, address, city, state, zip, subscriptionPlan } = await req.json();

    if (!companyName || !email) {
      return Response.json({ error: 'Company name and email are required' }, { status: 400 });
    }

    // Create company with service role (bypasses RLS)
    const newCompany = await base44.asServiceRole.entities.Company.create({
      name: companyName,
      slug: companyName.toLowerCase().replace(/\s+/g, '-'),
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      subscription_plan: subscriptionPlan || 'trial',
      subscription_status: subscriptionPlan === 'trial' ? 'trial' : 'active',
      trial_ends_at: subscriptionPlan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      is_active: true
    });

    // Add user as company owner/admin
    await base44.asServiceRole.entities.CompanyMember.create({
      company_id: newCompany.id,
      user_email: user.email,
      user_name: user.full_name,
      role: 'administrator',
      access_level: 'admin',
      is_owner: true,
      is_active: true
    });

    // Link user to company
    await base44.auth.updateMe({ company_id: newCompany.id });

    return Response.json({
      success: true,
      company_id: newCompany.id,
      company: newCompany
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});