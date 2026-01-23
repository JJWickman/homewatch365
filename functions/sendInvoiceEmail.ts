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

    // Get the statement using service role
    const statements = await base44.asServiceRole.entities.MonthlyStatement.filter({ id: statement_id });
    if (statements.length === 0) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }
    const statement = statements[0];

    // Get client and company using service role
    const [clients, companies] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ id: statement.client_id }),
      base44.asServiceRole.entities.Company.filter({ id: statement.company_id })
    ]);

    const client = clients[0];
    const company = companies[0];

    // Generate PDF using service role
    console.log('Calling generateInvoicePDF for statement:', statement_id);
    const pdfResponse = await base44.asServiceRole.functions.invoke('generateInvoicePDF', { statement_id });
    console.log('PDF response:', pdfResponse.data);
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
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }
    
    sgMail.setApiKey(sendgridApiKey);
    
    const recipientEmail = email_override || client.email;
    const fromEmail = 'noreply@estatewatch365.app';
    
    console.log('Sending email from:', fromEmail, 'to:', recipientEmail);
    
    try {
      await sgMail.send({
        to: recipientEmail,
        from: fromEmail,
        subject: subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>')
      });
      console.log('Email sent successfully');
    } catch (sgError) {
      console.error('SendGrid error:', sgError.response?.body || sgError);
      throw new Error(`SendGrid error: ${JSON.stringify(sgError.response?.body || sgError.message)}`);
    }

    // Update statement status
    await base44.asServiceRole.entities.MonthlyStatement.update(statement.id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    // Log communication
    await base44.asServiceRole.entities.CommunicationLog.create({
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