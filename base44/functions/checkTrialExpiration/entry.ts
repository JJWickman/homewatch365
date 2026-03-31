import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        expired: false, 
        message: 'Not authenticated' 
      });
    }

    // Get user's tenant
    const tenantId = user.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ 
        expired: false, 
        message: 'No tenant found' 
      });
    }

    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
    if (tenants.length === 0) {
      return Response.json({ 
        expired: false, 
        message: 'Tenant not found' 
      });
    }

    const company = tenants[0];

    // Check if user is owner
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id, tenant_id: tenantId
    });
    const isOwner = tenantUsers[0]?.is_owner || false;

    // Check trial expiration
    if (company.subscription_status === 'trial' && company.trial_ends_at) {
      const trialEndsAt = new Date(company.trial_ends_at);
      const now = new Date();
      const isExpired = now > trialEndsAt;
      const daysRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

      return Response.json({
        expired: isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        trialEndsAt: company.trial_ends_at,
        subscriptionStatus: company.subscription_status,
        subscriptionPlan: company.subscription_plan,
        isOwner
      });
    }

    // Not on trial or already subscribed
    return Response.json({
      expired: false,
      subscriptionStatus: company.subscription_status,
      subscriptionPlan: company.subscription_plan,
      isOwner
    });

  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});