import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import sgMail from 'npm:@sendgrid/mail@8.1.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statement_id, email_override } = await req.json();

    // Get the statement
    const statements = await base44.entities.MonthlyStatement.filter({ id: statement_id });
    if (statements.length === 0) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }
    const statement = statements[0];

    // Get client and company
    const [clients, companies] = await Promise.all([
      base44.entities.Client.filter({ id: statement.client_id }),
      base44.entities.Company.filter({ id: statement.company_id })
    ]);

    const client = clients[0];
    const company = companies[0];

    // Generate PDF
    const pdfResponse = await base44.functions.invoke('generateInvoicePDF', { statement_id });
    const { pdf_url } = pdfResponse.data;

    // Generate client portal link
    const appUrl = new URL(req.url).origin;
    const portalUrl = `${appUrl}/ClientPortal`;

    // Prepare email
    const subject = `Invoice from ${company.name} - ${statement.billing_month}`;
    const emailBody = `
Dear ${client.first_name} ${client.last_name},

Please find attached your invoice for ${statement.billing_month}.

Invoice Details:
- Invoice #: ${statement.id.slice(0, 8).toUpperCase()}
- Total Amount: $${statement.total.toFixed(2)}
- Due Date: ${new Date(statement.finalized_at || statement.created_date).toLocaleDateString()}

View and pay your invoice in the client portal:
${portalUrl}

Or download the attached PDF for your records.

If you have any questions, please don't hesitate to contact us.

Best regards,
${company.name}
${company.phone || ''}
${company.email || ''}
    `.trim();

    // Send email with SendGrid
    sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));
    
    const recipientEmail = email_override || client.email;
    
    await sgMail.send({
      to: recipientEmail,
      from: company.email || 'noreply@estatewatch365.com',
      subject: subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>')
    });

    // Update statement status
    await base44.entities.MonthlyStatement.update(statement.id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    // Log communication
    await base44.entities.CommunicationLog.create({
      company_id: statement.company_id,
      client_id: client.id,
      client_email: email_override || client.email,
      type: 'email',
      subject: subject,
      message: emailBody,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Invoice sent successfully',
      pdf_url,
      portal_url: portalUrl
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});