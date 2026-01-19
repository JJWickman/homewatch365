import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statement_id, client_id } = await req.json();

    if (!statement_id || !client_id) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get statement
    const statements = await base44.entities.MonthlyStatement.filter({ id: statement_id });
    if (statements.length === 0) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }
    const statement = statements[0];

    // Get client
    const clients = await base44.entities.Client.filter({ id: client_id });
    if (clients.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }
    const client = clients[0];

    // Get company
    const companies = await base44.entities.Company.filter({ id: client.company_id });
    if (companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companies[0];

    // Generate statement HTML
    const statementHtml = generateStatementHtml(client, company, statement);

    // Send email
    await base44.integrations.Core.SendEmail({
      from_name: company.name,
      to: client.email,
      subject: `Monthly Statement - ${new Date(statement.billing_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      body: statementHtml
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateStatementHtml(client, company, statement) {
  const monthName = new Date(statement.billing_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const lineItems = statement.line_items || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .line-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; padding: 15px 0; border-top: 2px solid #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${company.name}</h1>
          <p>Monthly Statement - ${monthName}</p>
        </div>
        
        <div class="content">
          <p>Dear ${client.first_name} ${client.last_name},</p>
          <p>Here is your monthly statement for ${monthName}:</p>
          
          <div style="margin: 20px 0;">
            ${lineItems.map(item => `
              <div class="line-item">
                <span>${item.description}</span>
                <span>$${item.amount.toFixed(2)}</span>
              </div>
            `).join('')}
            
            <div class="total">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Amount Due:</span>
                <span>$${statement.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p>Payment will be automatically processed using your saved payment method.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>${company.name}</p>
          <p>${company.email} | ${company.phone}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}