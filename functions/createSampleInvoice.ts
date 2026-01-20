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
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      company_id: client.company_id,
      client_id: client.id,
      invoice_number: 'INV-2025-12-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      invoice_date: '2025-12-01',
      due_date: '2025-12-31',
      description: 'December 2025 - Premium Monthly Visit Service + Follow-up',
      amount: premiumPrice + 50,
      status: 'paid',
      billing_period: 'December 2025',
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
      subtotal: premiumPrice + 50,
      tax: 0,
      total: premiumPrice + 50,
      notes: 'Thank you for your continued business. This invoice includes your monthly premium service and one additional follow-up visit.',
      paid_at: '2025-12-15T10:00:00Z'
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