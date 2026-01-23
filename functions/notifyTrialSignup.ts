import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();
    
    // Only process create events
    if (event?.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }
    
    // Get company details
    const company = data;
    
    if (!company || company.subscription_status !== 'trial') {
      return Response.json({ success: true, message: 'Not a trial signup' });
    }
    
    // Get the company owner/creator details
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ 
      company_id: company.id, 
      is_owner: true 
    });
    
    const owner = members[0];
    
    // Send notification email to platform admins
    const adminEmail = 'notifications@estatewatch365.app'; // Change this to your admin email
    
    const subject = `🎉 New Trial Signup: ${company.name}`;
    const body = `
A new company has signed up for a trial!

Company Details:
- Name: ${company.name}
- Owner: ${owner?.user_name || 'Unknown'} (${owner?.user_email || 'N/A'})
- Plan: ${company.subscription_plan || 'solopreneur'}
- Trial Ends: ${company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : 'N/A'}
- Phone: ${company.phone || 'N/A'}
- Email: ${company.email || 'N/A'}
- Website: ${company.website || 'N/A'}

Created: ${new Date(company.created_date).toLocaleString()}

View in dashboard: https://estatewatch365.app/Dashboard
    `.trim();
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: subject,
      body: body
    });
    
    console.log('Trial signup notification sent for company:', company.name);
    
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