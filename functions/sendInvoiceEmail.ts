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

    if (!client || !company) {
      return Response.json({ error: 'Client or company not found' }, { status: 404 });
    }

    // Generate PDF inline instead of calling another function
    const { jsPDF } = await import('npm:jspdf@2.5.2');
    const doc = new jsPDF();

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 150, 25);

    // Company info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(company.name, 15, 50);
    if (company.address) doc.text(company.address, 15, 55);
    if (company.city) doc.text(`${company.city}, ${company.state} ${company.zip}`, 15, 60);
    if (company.phone) doc.text(`Phone: ${company.phone}`, 15, 65);
    if (company.email) doc.text(`Email: ${company.email}`, 15, 70);

    // Invoice details
    const invoiceDate = new Date(statement.created_date);
    doc.text(`Invoice #: ${statement.id.slice(0, 8).toUpperCase()}`, 150, 50);
    doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, 150, 55);
    doc.text(`Billing Period: ${statement.billing_month}`, 150, 60);
    doc.text(`Status: ${statement.status.toUpperCase()}`, 150, 65);

    // Bill to
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 15, 85);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`${client.first_name} ${client.last_name}`, 15, 92);
    if (client.address) doc.text(client.address, 15, 97);
    if (client.city) doc.text(`${client.city}, ${client.state} ${client.zip}`, 15, 102);
    doc.text(client.email, 15, 107);

    // Line items
    let y = 120;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Description', 20, y + 6);
    doc.text('Amount', 170, y + 6);
    doc.setFont(undefined, 'normal');

    y += 12;
    if (statement.line_items && statement.line_items.length > 0) {
      statement.line_items.forEach((item) => {
        doc.text(item.description || 'Service', 20, y);
        doc.text(`$${item.amount.toFixed(2)}`, 170, y);
        y += 8;
      });
    }

    // Totals
    y += 10;
    doc.line(15, y, 195, y);
    y += 8;
    doc.text('Subtotal:', 140, y);
    doc.text(`$${statement.subtotal.toFixed(2)}`, 170, y);
    
    if (statement.tax_amount > 0) {
      y += 8;
      doc.text('Tax:', 140, y);
      doc.text(`$${statement.tax_amount.toFixed(2)}`, 170, y);
    }

    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 140, y);
    doc.text(`$${statement.total.toFixed(2)}`, 170, y);

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `invoice_${statement.id}_${Date.now()}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const { file_url: pdf_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

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
    
    // Use company's verified billing email or default
    const fromEmail = (company.billing_email_verified && company.billing_email) 
      ? company.billing_email 
      : 'noreply@estatewatch365.app';
    
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
    console.error('Error details:', error.response?.data || error.stack);
    return Response.json({ 
      error: error.message, 
      details: error.response?.data || error.toString() 
    }, { status: 500 });
  }
});