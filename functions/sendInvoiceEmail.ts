import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statement_id } = await req.json();

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
    const { pdf_url, payment_url } = pdfResponse.data;

    // Prepare email
    const subject = `Invoice from ${company.name} - ${statement.billing_month}`;
    const emailBody = `
Dear ${client.first_name} ${client.last_name},

Please find attached your invoice for ${statement.billing_month}.

Invoice Details:
- Invoice #: ${statement.id.slice(0, 8).toUpperCase()}
- Total Amount: $${statement.total.toFixed(2)}
- Due Date: ${new Date(statement.finalized_at || statement.created_date).toLocaleDateString()}

You can pay this invoice online by clicking the link below:
${payment_url}

Or download the attached PDF for your records.

If you have any questions, please don't hesitate to contact us.

Best regards,
${company.name}
${company.phone || ''}
${company.email || ''}
    `.trim();

    // Send email with PDF attachment
    await base44.integrations.Core.SendEmail({
      from_name: company.name,
      to: client.email,
      subject: subject,
      body: emailBody
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
      client_email: client.email,
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
      payment_url
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});