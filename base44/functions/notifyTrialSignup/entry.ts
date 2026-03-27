import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();
    
    // Only process create events
    if (event?.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }
    
    // Get tenant details
    const tenant = data;
    
    if (!tenant || tenant.subscription_status !== 'trial') {
      return Response.json({ success: true, message: 'Not a trial signup' });
    }
    
    // Get the tenant owner/creator details from TenantUser
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({ 
      tenant_id: tenant.id, 
      is_owner: true 
    });
    
    const owner = tenantUsers[0];
    
    // Send notification email to platform admins
    const adminEmails = ['jason@estatewatch365.com', 'alex@estatewatch365.com'];
    
    const subject = `🎉 New Trial Signup: ${tenant.name}`;
    const body = `
A new tenant has signed up for a trial!

Tenant Details:
- Name: ${tenant.name}
- Owner: ${owner?.user_id || 'Unknown'}
- Plan: ${tenant.subscription_plan || 'solopreneur'}
- Trial Ends: ${tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : 'N/A'}
- Phone: ${tenant.phone || 'N/A'}
- Email: ${tenant.email || 'N/A'}
- Address: ${[tenant.address, tenant.city, tenant.state, tenant.zip].filter(Boolean).join(', ') || 'N/A'}

Created: ${new Date(tenant.created_date).toLocaleString()}

View in dashboard: https://estatewatch365.app/Dashboard
    `.trim();
    
    // Send to all admin emails using Core integration
    await Promise.all(adminEmails.map(email => 
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: subject,
        body: body
      })
    ));
    
    console.log('Trial signup notification sent for tenant:', tenant.name);
    
    return Response.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending trial signup notification:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});