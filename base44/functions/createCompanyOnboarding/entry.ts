import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Do NOT return early if user already has a tenant — always process the new data they entered

    const { companyName, fullName, email, slug, subscriptionPlan, promoCode, isCreatingTenant } = await req.json();

    if (!companyName || !slug) {
      return Response.json({ error: 'Company name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await base44.asServiceRole.entities.Tenant.filter({ slug: slug.toLowerCase() });
    if (existing.length > 0) {
      return Response.json({ error: 'That company name is already taken. Please choose another.' }, { status: 409 });
    }

    // Create Tenant
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: companyName,
      slug: slug,
      email: email || user.email,
      subscription_plan: subscriptionPlan || 'trial',
      subscription_status: subscriptionPlan === 'trial' ? 'trial' : 'active',
      trial_ends_at: (!subscriptionPlan || subscriptionPlan === 'trial')
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      is_active: true,
      created_by_email: user.email
    });

    // Create TenantUser junction
    await base44.asServiceRole.entities.TenantUser.create({
      user_id: user.id,
      tenant_id: tenant.id,
      role_in_tenant: 'admin',
      is_owner: true,
      is_active: true
    });

    // Set primary_tenant_id immediately for all plans (trial + paid)
    // For paid plans, this is already set before Stripe redirect; webhook will re-confirm
    const userUpdate = {
      primary_tenant_id: tenant.id,
      onboarding_completed: true
    };

    // If they're creating a new tenant, set their User.role to tenantadmin
    if (isCreatingTenant) {
      userUpdate.role = 'tenantadmin';
    }

    await base44.auth.updateMe(userUpdate);
    // Role authority is at the entity level (TenantUser.role_in_tenant), not User.role
    // Permission checks must always use tenantUser.role_in_tenant for multi-tenant isolation

    // Seed checklist templates for the new tenant
    try {
      await base44.asServiceRole.functions.invoke('seedCompanyTemplates', { tenant_id: tenant.id });
    } catch (e) {
      console.log('Template seeding failed (non-fatal):', e.message);
    }

    // Seed default products/services for the new tenant
    try {
      await base44.asServiceRole.functions.invoke('seedDefaultProducts', { tenant_id: tenant.id });
    } catch (e) {
      console.log('Default products seeding failed (non-fatal):', e.message);
    }

    // Seed sample celebrity properties
    try {
      const sampleClients = [
        {
          tenant_id: tenant.id,
          first_name: 'Chevy',
          last_name: 'Chase',
          email: 'chevy.chase@sample.com',
          phone: '239-555-0101',
          address: '1234 Gulf Shore Boulevard',
          city: 'Naples',
          state: 'FL',
          zip: '34102',
          portal_access: true,
          portal_user_email: 'chevy.chase@sample.com',
          billing_status: 'active',
          monthly_rate: 500
        },
        {
          tenant_id: tenant.id,
          first_name: 'Steve',
          last_name: 'Martin',
          email: 'steve.martin@sample.com',
          phone: '239-555-0102',
          address: '567 Boca Grande Avenue',
          city: 'Boca Grande',
          state: 'FL',
          zip: '33921',
          portal_access: true,
          portal_user_email: 'steve.martin@sample.com',
          billing_status: 'active',
          monthly_rate: 600
        }
      ];

      const createdClients = await base44.asServiceRole.entities.Client.bulkCreate(sampleClients);

      const sampleProperties = [
        {
          tenant_id: tenant.id,
          client_id: createdClients[0].id,
          name: 'Beachfront Estate',
          address: '1234 Gulf Shore Boulevard',
          city: 'Naples',
          state: 'FL',
          zip: '34102',
          latitude: 26.1403,
          longitude: -81.7945,
          property_type: 'single_family',
          status: 'seasonal',
          bedrooms: 4,
          bathrooms: 3.5,
          square_feet: 4500,
          year_built: 2012,
          access_instructions: 'Key in lockbox by front door',
          notes: 'Seasonal property - weekly inspections recommended',
          visit_frequency: 'weekly'
        },
        {
          tenant_id: tenant.id,
          client_id: createdClients[1].id,
          name: 'Waterfront Villa',
          address: '567 Boca Grande Avenue',
          city: 'Boca Grande',
          state: 'FL',
          zip: '33921',
          latitude: 26.7533,
          longitude: -82.2700,
          property_type: 'single_family',
          status: 'seasonal',
          bedrooms: 5,
          bathrooms: 4,
          square_feet: 5500,
          year_built: 2015,
          access_instructions: 'Keypad code on request',
          security_gate: true,
          gate_code: '5555',
          notes: 'Premium waterfront property',
          visit_frequency: 'weekly'
        }
      ];

      await base44.asServiceRole.entities.Property.bulkCreate(sampleProperties);
    } catch (e) {
      console.log('Sample data seeding failed (non-fatal):', e.message);
    }

    // Fetch price_id for paid plans
    let price_id = null;
    if (subscriptionPlan && subscriptionPlan !== 'trial') {
      try {
        const pricesRes = await base44.functions.invoke('getStripePrices', {});
        const plans = pricesRes.data?.plans || [];
        const plan = plans.find(p => p.id === subscriptionPlan);
        if (plan?.prices?.monthly?.priceId) price_id = plan.prices.monthly.priceId;
      } catch (e) {
        console.log('Could not fetch stripe price:', e.message);
      }
    }

    // Small delay to let DB writes propagate before frontend redirects
    await new Promise(r => setTimeout(r, 500));

    return Response.json({
      success: true,
      tenant_id: tenant.id,
      company_id: tenant.id,
      price_id,
      tenant,
    });

  } catch (error) {
    console.error('Error in createCompanyOnboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});