import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { statement_id, payment_intent_id } = await req.json();

    // Get statement
    const statements = await base44.asServiceRole.entities.MonthlyStatement.filter({ id: statement_id });
    if (statements.length === 0) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }

    const statement = statements[0];

    // Update statement to paid
    await base44.asServiceRole.entities.MonthlyStatement.update(statement.id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'card'
    });

    // Create transaction record
    await base44.asServiceRole.entities.ClientTransaction.create({
      tenant_id: statement.tenant_id,
      client_id: statement.client_id,
      description: `Payment for invoice ${statement.id.slice(0, 8).toUpperCase()}`,
      amount: statement.total,
      transaction_date: new Date().toISOString().split('T')[0],
      billing_month: statement.billing_month,
      type: 'custom',
      status: 'paid'
    });

    return Response.json({
      success: true,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});