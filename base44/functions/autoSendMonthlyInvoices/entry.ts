import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all companies
    const companies = await base44.asServiceRole.entities.Company.list();

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Previous month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const billingMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    for (const company of companies) {
      try {
        // Get all active clients for this company
        const clients = await base44.asServiceRole.entities.Client.filter({
          company_id: company.id,
          is_active: true
        });

        for (const client of clients) {
          try {
            results.processed++;

            // Check if statement already exists
            const existingStatements = await base44.asServiceRole.entities.MonthlyStatement.filter({
              client_id: client.id,
              billing_month: billingMonth
            });

            if (existingStatements.length > 0) {
              continue; // Skip if already generated
            }

            // Get transactions for the billing month
            const transactions = await base44.asServiceRole.entities.ClientTransaction.filter({
              client_id: client.id,
              billing_month: billingMonth
            });

            if (transactions.length === 0) {
              continue; // Skip if no transactions
            }

            // Calculate totals
            const subtotal = transactions.reduce((sum, t) => sum + t.amount, 0);
            const taxAmount = 0;
            const total = subtotal + taxAmount;

            // Create line items
            const lineItems = transactions.map(t => ({
              description: t.description,
              amount: t.amount,
              type: t.type
            }));

            // Create statement
            const statement = await base44.asServiceRole.entities.MonthlyStatement.create({
              company_id: company.id,
              client_id: client.id,
              billing_month: billingMonth,
              status: 'draft',
              line_items: lineItems,
              subtotal,
              tax_amount: taxAmount,
              total,
              finalized_at: new Date().toISOString()
            });

            // Send invoice if client has email
            if (client.email) {
              await base44.functions.invoke('sendInvoiceEmail', {
                statement_id: statement.id
              });
              results.sent++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              client_id: client.id,
              client_name: `${client.first_name} ${client.last_name}`,
              error: error.message
            });
          }
        }
      } catch (error) {
        results.errors.push({
          company_id: company.id,
          company_name: company.name,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      billing_month: billingMonth,
      results
    });

  } catch (error) {
    console.error('Error in auto-send monthly invoices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});