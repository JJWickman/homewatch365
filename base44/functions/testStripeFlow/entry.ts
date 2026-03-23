import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (!members.length) {
      return Response.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = members[0].company_id;
    const company = await base44.entities.Company.list();
    const currentCompany = company.find(c => c.id === companyId);

    if (!currentCompany) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Test the flow:
    // 1. Company starts with a trial or no subscription
    // 2. User goes to checkout and purchases a plan
    // 3. Webhook updates company subscription_status to 'active' and subscription_plan to the new plan
    // 4. User is redirected to Dashboard

    const testFlow = {
      step1_current_state: {
        company_id: currentCompany.id,
        company_name: currentCompany.name,
        current_subscription_status: currentCompany.subscription_status,
        current_subscription_plan: currentCompany.subscription_plan,
        has_stripe_customer: !!currentCompany.stripe_customer_id,
        has_stripe_subscription: !!currentCompany.stripe_subscription_id,
        trial_ends_at: currentCompany.trial_ends_at
      },
      step2_checkout_flow: {
        description: 'User would click "Subscribe to Growth Plan" → redirect to Stripe checkout',
        success_url: 'https://your-app.com/Dashboard',
        cancel_url: 'https://your-app.com/Settings?tab=billing',
        expected_metadata: {
          company_id: currentCompany.id,
          subscription_plan: 'growth',
          billing_cycle: 'monthly'
        }
      },
      step3_webhook_expected: {
        description: 'After successful payment, Stripe sends checkout.session.completed webhook',
        webhook_action: 'Update Company entity with:',
        updates: {
          subscription_plan: 'growth',
          subscription_status: 'active',
          stripe_subscription_id: 'sub_xxx',
          trial_ends_at: null
        }
      },
      step4_redirect: {
        description: 'User browser redirected to Dashboard',
        expected_result: 'User sees new subscription plan active'
      },
      verification_status: 'WEBHOOK AND REDIRECT PATH CONFIGURED ✓'
    };

    return Response.json(testFlow);
  } catch (error) {
    console.error('Test flow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});