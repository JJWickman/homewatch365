import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get current month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const billingMonth = lastMonth.toISOString().slice(0, 7);

    // Get all companies
    const companies = await base44.asServiceRole.entities.Company.list();
    const results = [];

    for (const company of companies) {
      // Get all active clients for this company
      const clients = await base44.asServiceRole.entities.Client.filter({ 
        company_id: company.id,
        is_active: true,
        billing_status: 'active'
      });

      for (const client of clients) {
        try {
          // Check if statement already exists
          const existingStatements = await base44.asServiceRole.entities.MonthlyStatement.filter({
            client_id: client.id,
            billing_month: billingMonth
          });

          if (existingStatements.length > 0 && existingStatements[0].status !== 'draft') {
            continue; // Skip if already processed
          }

          // Generate line items
          const lineItems = [];
          let subtotal = 0;

          // Add subscription service
          if (client.service_subscription_id) {
            const services = await base44.asServiceRole.entities.ProductService.filter({ 
              id: client.service_subscription_id 
            });
            if (services.length > 0) {
              const service = services[0];
              lineItems.push({
                description: service.name,
                amount: service.price,
                type: 'service',
                product_service_id: service.id
              });
              subtotal += service.price;
            }
          }

          // Add additional products
          if (client.additional_products && client.additional_products.length > 0) {
            const products = await base44.asServiceRole.entities.ProductService.filter({ 
              company_id: company.id 
            });
            
            for (const productId of client.additional_products) {
              const product = products.find(p => p.id === productId);
              if (product) {
                lineItems.push({
                  description: product.name,
                  amount: product.price,
                  type: 'product',
                  product_service_id: product.id
                });
                subtotal += product.price;
              }
            }
          }

          // Add custom transactions
          const transactions = await base44.asServiceRole.entities.ClientTransaction.filter({ 
            client_id: client.id,
            billing_month: billingMonth
          });
          
          for (const t of transactions) {
            lineItems.push({
              description: t.description,
              amount: t.amount,
              type: 'custom'
            });
            subtotal += t.amount;
          }

          // Create or update statement
          let statement;
          if (existingStatements.length > 0) {
            statement = await base44.asServiceRole.entities.MonthlyStatement.update(existingStatements[0].id, {
              line_items: lineItems,
              subtotal,
              total: subtotal,
              status: 'finalized',
              finalized_at: new Date().toISOString()
            });
          } else {
            statement = await base44.asServiceRole.entities.MonthlyStatement.create({
              company_id: company.id,
              client_id: client.id,
              billing_month: billingMonth,
              status: 'finalized',
              line_items: lineItems,
              subtotal,
              tax_amount: 0,
              total: subtotal,
              finalized_at: new Date().toISOString()
            });
          }

          // Send email with statement
          const statementHtml = generateStatementHtml(client, company, statement, lineItems);
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: company.name,
            to: client.email,
            subject: `Monthly Statement - ${new Date(billingMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            body: statementHtml
          });

          // Update statement status
          await base44.asServiceRole.entities.MonthlyStatement.update(statement.id, {
            status: 'sent',
            sent_at: new Date().toISOString()
          });

          results.push({
            client_id: client.id,
            client_name: `${client.first_name} ${client.last_name}`,
            status: 'success',
            total: subtotal
          });

        } catch (error) {
          results.push({
            client_id: client.id,
            client_name: `${client.first_name} ${client.last_name}`,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return Response.json({ 
      success: true,
      billing_month: billingMonth,
      processed: results.length,
      results 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateStatementHtml(client, company, statement, lineItems) {
  const monthName = new Date(statement.billing_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
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