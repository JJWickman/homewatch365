import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('=== STRIPE CONNECTION DIAGNOSTIC ===\n');

    // Test 1: Check API key
    console.log('Test 1: Verifying API Key...');
    const account = await stripe.accounts.retrieve();
    console.log('✓ API Key is valid');
    console.log('  Account ID:', account.id);
    console.log('  Account Status:', account.charges_enabled ? 'ENABLED' : 'DISABLED');

    // Test 2: List all products
    console.log('\nTest 2: Listing all products in account...');
    const products = await stripe.products.list({ limit: 100 });
    console.log(`Found ${products.data.length} products:`);
    
    const productsSummary = [];
    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, limit: 10 });
      productsSummary.push({
        name: product.name,
        id: product.id,
        active: product.active,
        prices: prices.data.map(p => ({
          id: p.id,
          amount: p.unit_amount ? (p.unit_amount / 100) : 'custom',
          recurring: p.recurring?.interval || 'one-time',
          active: p.active,
        })),
      });
      console.log(`  • ${product.name} (${product.id})`);
      prices.data.forEach(p => {
        const amount = p.unit_amount ? `$${p.unit_amount / 100}` : 'custom';
        console.log(`    - ${amount}/${p.recurring?.interval || 'one-time'} (${p.id})`);
      });
    }

    // Test 3: List customers
    console.log('\nTest 3: Checking customers...');
    const customers = await stripe.customers.list({ limit: 5 });
    console.log(`✓ Found ${customers.data.length} customers (showing first 5):`);
    customers.data.slice(0, 5).forEach(c => {
      console.log(`  • ${c.email || c.name || c.id}`);
    });

    // Test 4: Check for existing subscriptions
    console.log('\nTest 4: Checking subscriptions...');
    const subscriptions = await stripe.subscriptions.list({ limit: 5 });
    console.log(`✓ Found ${subscriptions.data.length} subscriptions (showing first 5):`);
    subscriptions.data.slice(0, 5).forEach(sub => {
      const items = sub.items.data.map(item => item.price?.nickname || item.price?.id).join(', ');
      console.log(`  • ${sub.id} - ${items} (${sub.status})`);
    });

    return Response.json({
      success: true,
      diagnostic: {
        api_key_valid: true,
        account_id: account.id,
        charges_enabled: account.charges_enabled,
        products_count: products.data.length,
        customers_count: customers.data.length,
        subscriptions_count: subscriptions.data.length,
        products: productsSummary,
      },
      status: {
        ready_for_products: account.charges_enabled ? 'YES' : 'NO - Enable charges in Stripe Dashboard',
        ready_for_subscriptions: subscriptions.data.length > 0 ? 'YES - Can create subscriptions' : 'YES - Ready to create',
        ready_for_payments: products.data.length > 0 ? 'YES - Have products' : 'NO - Need to create products first',
      },
    });

  } catch (error) {
    return Response.json({
      error: error.message,
      type: error.type,
      code: error.code,
      suggestion: error.code === 'invalid_api_key' ? 'Your STRIPE_SECRET_KEY secret is invalid or missing' : 'Check your Stripe account settings',
    }, { status: 500 });
  }
});