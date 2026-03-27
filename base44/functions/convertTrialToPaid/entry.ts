import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Check if user is admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const targetEmails = ['diane@yourhwp.com', 'djoeadhiya@gmail.com'];
    
    // Find TenantUser records for these emails
    const allTenantUsers = await base44.asServiceRole.entities.TenantUser.list();
    const targetTenantUsers = allTenantUsers.filter(tu => targetEmails.includes(tu.user_email || ''));

    const results = [];

    for (const tenantUser of targetTenantUsers) {
      try {
        // Update tenant to professional paid plan
        await base44.asServiceRole.entities.Tenant.update(tenantUser.tenant_id, {
          subscription_plan: 'professional',
          subscription_status: 'active',
          trial_ends_at: '2024-01-01T00:00:00Z' // Set to past date
        });

        results.push({
          email: tenantUser.user_email,
          tenant_id: tenantUser.tenant_id,
          status: 'success'
        });
      } catch (error) {
        results.push({
          email: tenantUser.user_email,
          tenant_id: tenantUser.tenant_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return Response.json({ 
      message: 'Conversion complete',
      results 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});