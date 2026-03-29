import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, firstName, lastName, email, slug, subscriptionPlan, price_id: passedPriceId } = await req.json();

    if (!companyName || !slug) {
      return Response.json({ error: 'Company name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await base44.asServiceRole.entities.Tenant.filter({ slug: slug.toLowerCase() });
    if (existing.length > 0) {
      return Response.json({ error: 'That company name is already taken. Please choose another.' }, { status: 409 });
    }

    // For PAID plans: do NOT create tenant yet — tenant will be created by Stripe webhook after payment
    if (subscriptionPlan && subscriptionPlan !== 'trial') {
      const price_id = passedPriceId || null;
      console.log('Paid plan selected, price_id:', price_id);
      return Response.json({ success: true, price_id, pending_paid: true });
    }

    // TRIAL PLAN: Check if user already has a tenant — prevent duplicates
    if (user.primary_tenant_id) {
      const existingTenants = await base44.asServiceRole.entities.Tenant.filter({ id: user.primary_tenant_id });
      if (existingTenants.length > 0) {
        return Response.json({ success: true, tenant_id: user.primary_tenant_id, tenant: existingTenants[0] });
      }
    }

    // Create Tenant (trial only)
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: companyName,
      slug: slug,
      email: email || user.email,
      subscription_plan: subscriptionPlan || 'trial',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_by_email: user.email
    });

    // Create TenantUser junction
    const existingTenantUser = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: tenant.id
    });
    if (existingTenantUser.length === 0) {
      await base44.asServiceRole.entities.TenantUser.create({
        user_id: user.id,
        tenant_id: tenant.id,
        role_in_tenant: 'admin',
        is_owner: true,
        is_active: true
      });
    }

    // Set primary_tenant_id, elevate to admin, and save first/last name
    const updateData = {
      primary_tenant_id: tenant.id,
      onboarding_completed: true,
      role: 'admin',
      first_name: firstName || '',
      last_name: lastName || ''
    };
    await base44.auth.updateMe(updateData);

    // Seed checklist templates and products for the new tenant
    try {
      const checkExists = await base44.asServiceRole.entities.ChecklistTemplate.filter({ tenant_id: tenant.id });
      if (checkExists.length === 0) {
        await base44.asServiceRole.functions.invoke('seedCompanyTemplates', { tenant_id: tenant.id });
        await base44.asServiceRole.functions.invoke('seedDefaultProducts', { tenant_id: tenant.id });
      }
    } catch (e) {
      console.log('Seeding failed (non-fatal):', e.message);
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

    // Small delay to let DB writes propagate before frontend redirects
    await new Promise(r => setTimeout(r, 500));

    return Response.json({
      success: true,
      tenant_id: tenant.id,
      company_id: tenant.id,
      tenant,
    });

  } catch (error) {
    console.error('Error in createCompanyOnboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});