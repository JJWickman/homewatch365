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

    // Get client and tenant using service role
    const [clients, companies] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ id: statement.client_id }),
      base44.asServiceRole.entities.Tenant.filter({ id: statement.tenant_id })
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
    const portalUrl = `https://estatewatch365.app/ClientPortal`;

    // Prepare email with branded HTML template
    const subject = `Invoice from ${company.name} - ${statement.billing_month}`;
    
    const primaryColor = company.primary_color || '#1e3a5f';
    const accentColor = company.accent_color || '#c9a962';
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; padding: 30px 20px; text-align: center; }
    .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .invoice-details { background: #f8f9fa; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .invoice-details strong { color: ${primaryColor}; }
    .line-items { margin: 20px 0; border-collapse: collapse; width: 100%; }
    .line-items th { background: ${primaryColor}; color: white; padding: 10px; text-align: left; }
    .line-items td { padding: 10px; border-bottom: 1px solid #eee; }
    .totals { text-align: right; margin: 20px 0; font-size: 18px; }
    .totals strong { color: ${primaryColor}; }
    .button { display: inline-block; background: ${accentColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #666; }
    .signature strong { color: ${primaryColor}; display: block; margin-bottom: 5px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${company.logo_url ? `<img src="${company.logo_url}" alt="${company.name}" class="logo">` : ''}
      <h1 style="margin: 10px 0; font-size: 28px;">INVOICE</h1>
      <p style="margin: 5px 0; opacity: 0.9;">${statement.billing_month}</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Dear ${client.first_name} ${client.last_name},</p>
      <p>Please find your invoice details below. Payment can be made through the client portal or by contacting us directly.</p>
      
      <div class="invoice-details">
        <strong>Invoice #:</strong> ${statement.id.slice(0, 8).toUpperCase()}<br>
        <strong>Invoice Date:</strong> ${new Date(statement.created_date).toLocaleDateString()}<br>
        <strong>Billing Period:</strong> ${statement.billing_month}<br>
        <strong>Due Date:</strong> ${new Date(statement.finalized_at || statement.created_date).toLocaleDateString()}
      </div>
      
      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${statement.line_items && statement.line_items.length > 0 
            ? statement.line_items.map(item => `
              <tr>
                <td>${item.description || 'Service'}</td>
                <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')
            : '<tr><td colspan="2">No items</td></tr>'
          }
        </tbody>
      </table>
      
      <div class="totals">
        <div>Subtotal: $${statement.subtotal.toFixed(2)}</div>
        ${statement.tax_amount > 0 ? `<div>Tax: $${statement.tax_amount.toFixed(2)}</div>` : ''}
        <div style="margin-top: 10px;"><strong>Total Due: $${statement.total.toFixed(2)}</strong></div>
      </div>
      
      <center>
        <a href="${portalUrl}" class="button">View & Pay Invoice</a>
      </center>
      
      <p style="margin-top: 20px; color: #666; font-size: 14px;">A PDF copy of this invoice is attached for your records.</p>
      
      <div class="signature">
        <strong>${company.name}</strong>
        ${company.address ? `<div>${company.address}</div>` : ''}
        ${company.city ? `<div>${company.city}, ${company.state} ${company.zip}</div>` : ''}
        ${company.phone ? `<div>Phone: ${company.phone}</div>` : ''}
        ${company.email ? `<div>Email: ${company.email}</div>` : ''}
        ${company.website ? `<div>Web: ${company.website}</div>` : ''}
      </div>
    </div>
    
    <div class="footer">
      <p>If you have any questions about this invoice, please contact us.</p>
      <p style="margin-top: 10px;">This is an automated email sent via SendGrid by ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    
    // Plain text version
    const plainTextBody = `
Dear ${client.first_name} ${client.last_name},

Please find your invoice for ${statement.billing_month}.

INVOICE DETAILS:
Invoice #: ${statement.id.slice(0, 8).toUpperCase()}
Invoice Date: ${new Date(statement.created_date).toLocaleDateString()}
Billing Period: ${statement.billing_month}
Total Amount: $${statement.total.toFixed(2)}
Due Date: ${new Date(statement.finalized_at || statement.created_date).toLocaleDateString()}

View and pay your invoice in the client portal:
${portalUrl}

A PDF copy is attached for your records.

---
${company.name}
${company.address || ''}
${company.city ? `${company.city}, ${company.state} ${company.zip}` : ''}
${company.phone ? `Phone: ${company.phone}` : ''}
${company.email ? `Email: ${company.email}` : ''}
${company.website ? `Web: ${company.website}` : ''}

If you have any questions, please don't hesitate to contact us.
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
    
    // Fetch the PDF file content for attachment
    const pdfResponse = await fetch(pdf_url);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    try {
      await sgMail.send({
        to: recipientEmail,
        from: fromEmail,
        subject: subject,
        text: plainTextBody,
        html: emailBody,
        attachments: [{
          content: pdfBase64,
          filename: `invoice_${statement.billing_month}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });
      console.log('Email sent successfully with PDF attachment');
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
      tenant_id: statement.tenant_id,
      client_id: client.id,
      client_email: email_override || client.email,
      type: 'email',
      subject: subject,
      message: plainTextBody,
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