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

    // Get user's company
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ 
      user_email: user.email 
    });

    if (members.length === 0) {
      return Response.json({ 
        expired: false, 
        message: 'No company membership found' 
      });
    }

    const companies = await base44.asServiceRole.entities.Company.filter({ 
      id: members[0].company_id 
    });

    if (companies.length === 0) {
      return Response.json({ 
        expired: false, 
        message: 'Company not found' 
      });
    }

    const company = companies[0];

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
        isOwner: members[0].is_owner
      });
    }

    // Not on trial or already subscribed
    return Response.json({
      expired: false,
      subscriptionStatus: company.subscription_status,
      subscriptionPlan: company.subscription_plan,
      isOwner: members[0].is_owner
    });

  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});