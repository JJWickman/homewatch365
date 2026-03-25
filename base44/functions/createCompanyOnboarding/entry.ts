import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user already has a company, return it (prevent duplicates)
    if (user.company_id) {
      const existingCompany = await base44.asServiceRole.entities.Company.filter({ id: user.company_id });
      if (existingCompany.length > 0) {
        return Response.json({
          success: true,
          company_id: existingCompany[0].id,
          company: existingCompany[0],
          message: 'Company already exists'
        });
      }
    }

    const { companyName, email, phone, address, city, state, zip, subscriptionPlan } = await req.json();

    if (!companyName || !email) {
      return Response.json({ error: 'Company name and email are required' }, { status: 400 });
    }

    // Ensure user has a CompanyMember record for their company
    if (user.company_id) {
      const existingMembers = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: user.email });
      if (existingMembers.length === 0) {
        // User has company_id but no CompanyMember - create it
        const company = await base44.asServiceRole.entities.Company.filter({ id: user.company_id });
        if (company.length > 0) {
          await base44.asServiceRole.entities.CompanyMember.create({
            company_id: user.company_id,
            user_email: user.email,
            user_name: user.full_name,
            role: 'administrator',
            access_level: 'admin',
            is_owner: true,
            is_active: true
          });
          return Response.json({
            success: true,
            company_id: company[0].id,
            company: company[0],
            message: 'CompanyMember record created for existing company'
          });
        }
      }
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

    // Fetch price_id for the selected plan if it's paid
    let price_id = null;
    if (subscriptionPlan && subscriptionPlan !== 'trial') {
      try {
        const stripePricesResponse = await base44.functions.invoke('getStripePrices', {});
        const plans = stripePricesResponse.data?.plans || [];
        const selectedPlanData = plans.find(p => p.id === subscriptionPlan);
        if (selectedPlanData && selectedPlanData.prices?.monthly?.id) {
          price_id = selectedPlanData.prices.monthly.id;
        }
      } catch (e) {
        console.log('Could not fetch stripe price:', e.message);
      }
    }

    return Response.json({
      success: true,
      company_id: newCompany.id,
      company: newCompany,
      price_id: price_id,
      subscription_plan: subscriptionPlan
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});