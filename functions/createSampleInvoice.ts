import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Jason Wickman client
    const allClients = await base44.entities.Client.list();
    const client = allClients.find(c => c.first_name === 'Jason' && c.last_name === 'Wickman');

    if (!client) {
      return Response.json({ error: 'Client Jason Wickman not found' }, { status: 404 });
    }

    // Find Premium Monthly subscription
    const allProducts = await base44.entities.ProductService.list();
    const premiumService = allProducts.find(p => p.name && p.name.includes('Premium Monthly'));
    const premiumPrice = premiumService ? premiumService.price : 249;

    // Create invoice for December 2025
    const totalAmount = premiumPrice + 50;
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      company_id: client.company_id,
      client_id: client.id,
      invoice_number: 'INV-2025-12-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      issue_date: '2025-12-01',
      due_date: '2025-12-31',
      paid_date: '2025-12-15',
      status: 'paid',
      line_items: [
        {
          description: 'Premium Monthly Visit Service',
          quantity: 1,
          unit_price: premiumPrice,
          total: premiumPrice
        },
        {
          description: 'Additional Follow-up Visit',
          quantity: 1,
          unit_price: 50,
          total: 50
        }
      ],
      subtotal: totalAmount,
      tax_rate: 0,
      tax_amount: 0,
      total: totalAmount,
      notes: 'Thank you for your continued business. This invoice includes your monthly premium service and one additional follow-up visit.',
      payment_method: 'card'
    });

    return Response.json({ 
      success: true, 
      invoice: invoice,
      message: `Created sample invoice for ${client.first_name} ${client.last_name} - December 2025`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});