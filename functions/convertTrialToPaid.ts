import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Check if user is admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const targetEmails = ['diane@yourhwp.com', 'djoeadhiya@gmail.com'];
    
    // Find companies for these users
    const allMembers = await base44.asServiceRole.entities.CompanyMember.list();
    const targetMembers = allMembers.filter(m => targetEmails.includes(m.user_email));

    const results = [];

    for (const member of targetMembers) {
      try {
        // Update company to professional paid plan
        await base44.asServiceRole.entities.Company.update(member.company_id, {
          subscription_plan: 'professional',
          subscription_status: 'active',
          trial_ends_at: '2024-01-01T00:00:00Z' // Set to past date
        });

        results.push({
          email: member.user_email,
          company_id: member.company_id,
          status: 'success'
        });
      } catch (error) {
        results.push({
          email: member.user_email,
          company_id: member.company_id,
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