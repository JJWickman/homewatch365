import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { target_email } = await req.json();
    const email = target_email || user.email;

    // Find the user record
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (!users.length) {
      return Response.json({ error: `User not found: ${email}` }, { status: 404 });
    }
    const targetUser = users[0];

    // Check if already has primary_tenant_id
    if (targetUser.primary_tenant_id) {
      // Verify tenant exists
      const existingTenants = await base44.asServiceRole.entities.Tenant.filter({ id: targetUser.primary_tenant_id });
      if (existingTenants.length > 0) {
        return Response.json({
          success: true,
          message: 'User already has a tenant',
          tenant_id: targetUser.primary_tenant_id,
          tenant: existingTenants[0]
        });
      }
    }

    // Find their Company record (old schema)
    let company = null;
    if (targetUser.company_id) {
      const companies = await base44.asServiceRole.entities.Company.filter({ id: targetUser.company_id });
      if (companies.length > 0) company = companies[0];
    }

    // If no company by ID, try by email
    if (!company) {
      const companiesByEmail = await base44.asServiceRole.entities.Company.filter({ email });
      if (companiesByEmail.length > 0) company = companiesByEmail[0];
    }

    if (!company) {
      return Response.json({ error: 'No Company record found for this user. Cannot migrate.' }, { status: 404 });
    }

    // Create Tenant from existing Company data
    const slug = (company.name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: company.name,
      slug,
      logo_url: company.logo_url || '',
      primary_color: company.primary_color || '#1e3a5f',
      accent_color: company.accent_color || '#c9a962',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip: company.zip || '',
      phone: company.phone || '',
      email: company.email || email,
      website: company.website || '',
      subscription_plan: company.subscription_plan || 'professional',
      subscription_status: company.subscription_status || 'active',
      trial_ends_at: company.trial_ends_at || null,
      stripe_customer_id: company.stripe_customer_id || '',
      stripe_subscription_id: company.stripe_subscription_id || '',
      google_business_url: company.google_business_url || '',
      facebook_business_url: company.facebook_business_url || '',
      is_active: true,
      created_by_email: email
    });

    // Create UserTenant junction
    await base44.asServiceRole.entities.UserTenant.create({
      user_id: targetUser.id,
      tenant_id: tenant.id,
      role_in_tenant: 'admin',
      is_owner: true,
      is_active: true
    });

    // Set primary_tenant_id on user + mark onboarding complete
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      primary_tenant_id: tenant.id,
      onboarding_completed: true
    });

    return Response.json({
      success: true,
      message: `Tenant provisioned for ${email}`,
      tenant_id: tenant.id,
      tenant_slug: slug,
      tenant_name: tenant.name,
      subdomain_example: `${slug}.estatewatch365.app`
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});