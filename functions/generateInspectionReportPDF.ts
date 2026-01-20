import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@4.0.0';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { visit_id, company_id } = body;

    if (!visit_id || !company_id) {
      return Response.json({ error: 'Missing visit_id or company_id' }, { status: 400 });
    }

    // Fetch visit, property, client, and company data
    const [visits, properties, clients, companies] = await Promise.all([
      base44.entities.Visit.filter({ id: visit_id }),
      base44.entities.Property.filter({ company_id }),
      base44.entities.Client.filter({ company_id }),
      base44.entities.Company.filter({ id: company_id })
    ]);

    if (visits.length === 0) {
      return Response.json({ error: 'Visit not found' }, { status: 404 });
    }

    const visit = visits[0];
    const property = properties.find(p => p.id === visit.property_id);
    const client = clients.find(c => c.id === visit.client_id);
    const company = companies[0];

    if (!property || !client || !company) {
      return Response.json({ error: 'Related entities not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPage = (spaceNeeded) => {
      if (yPosition + spaceNeeded > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Header with branding
    const primaryColor = company.primary_color || '#1e3a5f';
    const accentColor = company.accent_color || '#c9a962';

    // Background header
    doc.setFillColor(...hexToRgb(primaryColor));
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo and company name
    if (company.logo_url) {
      try {
        const logoData = await fetch(company.logo_url).then(r => r.arrayBuffer());
        doc.addImage(logoData, 'PNG', margin, 8, 12, 12);
      } catch (e) {
        console.error('Could not load logo');
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(company.name || 'Home Watch Report', margin + 15, 18);

    yPosition = 50;

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Property Inspection Report', margin, yPosition);
    yPosition += 10;

    // Report info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const reportDate = format(new Date(visit.completed_at || new Date()), 'MMMM d, yyyy');
    doc.text(`Report Date: ${reportDate}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Inspector: ${visit.assigned_to_name || 'N/A'}`, margin, yPosition);
    yPosition += 10;

    // Property Information Section
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...hexToRgb(primaryColor));
    doc.setFontSize(12);
    doc.text('Property Information', margin, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Address: ${property.address}`, margin, yPosition);
    yPosition += 5;
    doc.text(`${property.city}, ${property.state} ${property.zip}`, margin, yPosition);
    yPosition += 8;

    // Client Information
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...hexToRgb(primaryColor));
    doc.setFontSize(12);
    doc.text('Client Information', margin, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${client.first_name} ${client.last_name}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email: ${client.email}`, margin, yPosition);
    yPosition += 5;
    if (client.phone) {
      doc.text(`Phone: ${client.phone}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 3;

    // Inspection Results
    checkPage(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...hexToRgb(primaryColor));
    doc.setFontSize(12);
    doc.text('Inspection Results', margin, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const statusColor = visit.overall_status === 'all_clear' 
      ? '#22c55e' 
      : visit.overall_status === 'urgent'
        ? '#ef4444'
        : '#f59e0b';
    
    doc.setTextColor(...hexToRgb(statusColor));
    doc.setFont(undefined, 'bold');
    const statusText = visit.overall_status === 'all_clear' 
      ? 'All Clear - No Issues Found'
      : visit.overall_status === 'urgent'
        ? 'Urgent - Issues Require Immediate Attention'
        : 'Issues Found - Review Required';
    doc.setFontSize(11);
    doc.text(statusText, margin, yPosition);
    yPosition += 8;

    // Checklist items
    if (visit.checklist_data && visit.checklist_data.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);

      visit.checklist_data.forEach(section => {
        checkPage(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${section.section_name}:`, margin, yPosition);
        yPosition += 5;

        doc.setFont(undefined, 'normal');
        section.items?.forEach(item => {
          checkPage(5);
          const status = item.flagged ? '⚠ ISSUE' : item.status ? '✓' : '◯';
          const itemText = `${status} ${item.name}`;
          doc.text(itemText, margin + 5, yPosition);
          yPosition += 4;

          if (item.notes) {
            doc.setTextColor(100, 100, 100);
            const noteLines = doc.splitTextToSize(`Notes: ${item.notes}`, pageWidth - margin * 2 - 5);
            noteLines.forEach(line => {
              checkPage(3);
              doc.text(line, margin + 10, yPosition);
              yPosition += 3;
            });
            doc.setTextColor(0, 0, 0);
          }
        });
        yPosition += 3;
      });
    }

    // Summary notes
    if (visit.summary_notes) {
      checkPage(15);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...hexToRgb(primaryColor));
      doc.setFontSize(11);
      doc.text('Summary', margin, yPosition);
      yPosition += 6;

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(visit.summary_notes, pageWidth - margin * 2);
      summaryLines.forEach(line => {
        checkPage(4);
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });
      yPosition += 3;
    }

    // Photos section
    if (visit.photo_urls && visit.photo_urls.length > 0) {
      checkPage(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...hexToRgb(primaryColor));
      doc.setFontSize(11);
      doc.text(`Photos (${visit.photo_urls.length})`, margin, yPosition);
      yPosition += 8;

      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text('Photos are available in the online portal.', margin, yPosition);
      yPosition += 8;
    }

    // Footer
    checkPage(15);
    doc.setDrawColor(...hexToRgb(accentColor));
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, margin, pageHeight - 15);
    doc.text(`© ${new Date().getFullYear()} ${company.name}`, margin, pageHeight - 10);

    // Generate PDF as data URL
    const pdfOutput = doc.output('dataurlstring');
    
    // Upload to storage
    const pdfBase64 = pdfOutput.split('base64,')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const reportBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', reportBlob);
    
    const uploadRes = await base44.integrations.Core.UploadFile({ file: pdfBuffer });

    return Response.json({
      success: true,
      report_url: uploadRes.file_url
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [30, 58, 95];
}