import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

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

    // Generate payment link
    const appUrl = new URL(req.url).origin;
    const paymentUrl = `${appUrl}/InvoicePayment?statement_id=${statement.id}`;

    // Create PDF
    const doc = new jsPDF();

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 220, 40, 'F');
    
    if (company.logo_url) {
      doc.addImage(company.logo_url, 'PNG', 15, 10, 20, 20);
    }
    
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
    doc.setFontSize(10);
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

    // Line items table
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

    // Payment link section
    y += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(59, 130, 246);
    doc.rect(15, y - 5, 180, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Pay Online:', 20, y + 3);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(paymentUrl, 20, y + 10);
    doc.text('Click the link above or visit the URL to pay securely online', 20, y + 17);

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Upload to storage
    const fileName = `invoice_${statement.id}_${Date.now()}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({
      success: true,
      pdf_url: file_url,
      payment_url: paymentUrl
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});