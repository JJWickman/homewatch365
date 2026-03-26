import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user already has a tenant, return it
    if (user.primary_tenant_id) {
      const existing = await base44.asServiceRole.entities.Tenant.filter({ id: user.primary_tenant_id });
      if (existing.length > 0) {
        return Response.json({ success: true, tenant_id: existing[0].id, tenant: existing[0], message: 'Tenant already exists' });
      }
    }

    const { companyName, fullName, email, subdomain, subscriptionPlan, promoCode } = await req.json();

    if (!companyName || !subdomain) {
      return Response.json({ error: 'Company name and subdomain are required' }, { status: 400 });
    }

    // Check subdomain uniqueness
    const existing = await base44.asServiceRole.entities.Tenant.filter({ slug: subdomain });
    if (existing.length > 0) {
      return Response.json({ error: 'That subdomain is already taken. Please choose another.' }, { status: 409 });
    }

    // Create Tenant
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: companyName,
      slug: subdomain,
      email: email || user.email,
      subscription_plan: subscriptionPlan || 'trial',
      subscription_status: subscriptionPlan === 'trial' ? 'trial' : 'active',
      trial_ends_at: (!subscriptionPlan || subscriptionPlan === 'trial')
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      is_active: true,
      created_by_email: user.email
    });

    // Create UserTenant junction
    await base44.asServiceRole.entities.UserTenant.create({
      user_id: user.id,
      tenant_id: tenant.id,
      role_in_tenant: 'admin',
      is_owner: true,
      is_active: true
    });

    // Also create legacy Company record so old code doesn't break
    const company = await base44.asServiceRole.entities.Company.create({
      name: companyName,
      slug: subdomain,
      email: email || user.email,
      subscription_plan: subscriptionPlan || 'trial',
      subscription_status: subscriptionPlan === 'trial' ? 'trial' : 'active',
      trial_ends_at: (!subscriptionPlan || subscriptionPlan === 'trial')
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      is_active: true
    });

    // Create CompanyMember for legacy support
    await base44.asServiceRole.entities.CompanyMember.create({
      company_id: company.id,
      user_email: user.email,
      user_name: fullName || user.full_name,
      role: 'administrator',
      access_level: 'admin',
      is_owner: true,
      is_active: true
    });

    // Set primary_tenant_id, company_id, full_name, and onboarding_completed on user
    await base44.asServiceRole.entities.User.update(user.id, {
      primary_tenant_id: tenant.id,
      company_id: company.id,
      onboarding_completed: true
    });

    // Fetch price_id for paid plans
    let price_id = null;
    if (subscriptionPlan && subscriptionPlan !== 'trial') {
      try {
        const pricesRes = await base44.functions.invoke('getStripePrices', {});
        const plans = pricesRes.data?.plans || [];
        const plan = plans.find(p => p.id === subscriptionPlan);
        if (plan?.prices?.monthly?.id) price_id = plan.prices.monthly.id;
      } catch (e) {
        console.log('Could not fetch stripe price:', e.message);
      }
    }

    return Response.json({
      success: true,
      tenant_id: tenant.id,
      company_id: company.id,
      tenant,
      price_id,
      subscription_plan: subscriptionPlan || 'trial'
    });

  } catch (error) {
    console.error('Error in createCompanyOnboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});