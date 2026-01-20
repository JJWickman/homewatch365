import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { visit_id, client_id, company_id, report_url } = body;

    if (!visit_id || !client_id || !company_id) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch data
    const [visits, clients, companies, properties] = await Promise.all([
      base44.entities.Visit.filter({ id: visit_id }),
      base44.entities.Client.filter({ id: client_id }),
      base44.entities.Company.filter({ id: company_id }),
      base44.entities.Property.filter({ company_id })
    ]);

    const visit = visits[0];
    const client = clients[0];
    const company = companies[0];
    const property = properties.find(p => p.id === visit.property_id);

    if (!visit || !client || !company || !property) {
      return Response.json({ error: 'Related entities not found' }, { status: 404 });
    }

    // Check if client wants email reports
    if (client.receive_report_emails === false) {
      return Response.json({ success: true, skipped: true, reason: 'Client opted out' });
    }

    // Build email
    const reportDate = format(new Date(visit.completed_at), 'MMMM d, yyyy');
    const statusText = visit.overall_status === 'all_clear' 
      ? 'All Clear - No Issues Found'
      : visit.overall_status === 'urgent'
        ? 'Urgent - Issues Require Immediate Attention'
        : 'Issues Found - Review Required';

    const portalUrl = `${new URL(req.url).origin}/client-portal?client_id=${client_id}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${company.primary_color || '#1e3a5f'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #ddd; padding: 20px; background: #f9f9f9; }
    .footer { border: 1px solid #ddd; padding: 15px; background: #f0f0f0; font-size: 12px; text-align: center; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: ${company.primary_color || '#1e3a5f'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .status { font-size: 18px; font-weight: bold; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .status.all-clear { background-color: #e6ffe6; color: #006600; }
    .status.issues { background-color: #fff4e6; color: #cc6600; }
    .status.urgent { background-color: #ffe6e6; color: #990000; }
    .divider { border-top: 2px solid ${company.accent_color || '#c9a962'}; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Property Inspection Report</h1>
      <p>${company.name}</p>
    </div>

    <div class="content">
      <p>Hello ${client.first_name},</p>

      <p>Your property inspection has been completed! Here are the details:</p>

      <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <p><strong>Property:</strong> ${property.name || property.address}</p>
        <p><strong>Address:</strong> ${property.address}<br/>
           ${property.city}, ${property.state} ${property.zip}</p>
        <p><strong>Inspection Date:</strong> ${reportDate}</p>
      </div>

      <div class="status ${visit.overall_status === 'all_clear' ? 'all-clear' : visit.overall_status === 'urgent' ? 'urgent' : 'issues'}">
        Status: ${statusText}
      </div>

      ${visit.summary_notes ? `
      <h3>Inspector's Summary:</h3>
      <p>${visit.summary_notes}</p>
      ` : ''}

      <a href="${portalUrl}" class="button">View Full Report in Portal</a>

      <p>The detailed inspection report with photos is available in your client portal. You can view it anytime by logging in with your portal credentials.</p>

      <div class="divider"></div>

      <h3>Stop Receiving Report Emails</h3>
      <p>If you prefer not to receive inspection report emails, you can update your preferences in your portal account settings under "Notification Preferences" or reply to this email requesting to opt out.</p>

      <p>If you have any questions about the inspection report, please don't hesitate to contact us.</p>

      <p>Best regards,<br/>
      <strong>${company.name}</strong></p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ${company.name}. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email
    const emailRes = await base44.integrations.Core.SendEmail({
      from_name: company.name,
      to: client.email,
      subject: `Your Property Inspection Report - ${property.name || property.address}`,
      body: emailBody
    });

    // Log communication
    await base44.entities.CommunicationLog.create({
      company_id,
      client_id,
      client_email: client.email,
      type: 'email',
      subject: `Your Property Inspection Report - ${property.name || property.address}`,
      message: emailBody,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      email_sent: true
    });
  } catch (error) {
    console.error('Error sending report email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});