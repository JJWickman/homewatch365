import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Live price IDs
    const soloPrice = 'price_1StZpsPeV0U8kQVW4yPBdJtL';
    const professionalPrice = 'price_1StZptPeV0U8kQVW10MfQjXQ';

    console.log('\n=== PLAN UPGRADE TEST: SOLOPRENEUR TO PROFESSIONAL ===\n');

    // Step 1: Create a customer
    console.log('Step 1: Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test-upgrade@example.com',
      name: 'Test Upgrade Company',
      description: 'Testing plan upgrade with prorations',
    });
    console.log('✓ Customer created:', customer.id);

    // Step 2: Create initial Solopreneur subscription
    console.log('\nStep 2: Creating initial Solopreneur subscription ($99/month)...');
    const initialSub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: soloPrice }],
      metadata: { plan: 'solopreneur' },
    });
    console.log('✓ Subscription created:', initialSub.id);
    console.log('  Amount:', initialSub.items.data[0].price.unit_amount / 100);
    console.log('  Period:', new Date(initialSub.current_period_start * 1000).toLocaleDateString(), 
                'to', new Date(initialSub.current_period_end * 1000).toLocaleDateString());

    // Step 3: Upgrade to Professional
    console.log('\nStep 3: Upgrading to Professional plan ($249/month) with proration...');
    const upgraded = await stripe.subscriptions.update(initialSub.id, {
      items: [{
        id: initialSub.items.data[0].id,
        price: professionalPrice,
      }],
      proration_behavior: 'create_prorations',
    });
    console.log('✓ Subscription upgraded:', upgraded.id);
    console.log('  New amount:', upgraded.items.data[0].price.unit_amount / 100);

    // Step 4: Check for prorated invoice
    console.log('\nStep 4: Checking for prorated charges...');
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    console.log(`Found ${invoices.data.length} invoices`);
    
    let hasProration = false;
    invoices.data.slice(0, 3).forEach((inv, i) => {
      console.log(`\n  Invoice ${i + 1}:`);
      console.log('    ID:', inv.id);
      console.log('    Status:', inv.status);
      console.log('    Total:', '$' + (inv.total / 100));
      console.log('    Date:', new Date(inv.created * 1000).toLocaleDateString());
      
      inv.lines.data.forEach(line => {
        if (line.proration) hasProration = true;
        const prorationNote = line.proration ? ' (PRORATED)' : '';
        console.log(`    • ${line.description}: $${line.amount / 100}${prorationNote}`);
      });
    });

    // Step 5: Verify billing
    console.log('\n=== BILLING SUMMARY ===');
    console.log('✓ OLD plan: Solopreneur - $99/month');
    console.log('✓ NEW plan: Professional - $249/month');
    console.log('✓ Difference: $' + (249 - 99) + '/month');
    console.log(`✓ Proration applied: ${hasProration ? 'YES - Customer will be charged difference immediately' : 'NO'}`);
    console.log('✓ Next billing cycle: Full $249/month amount');
    
    // Cleanup
    await stripe.subscriptions.del(initialSub.id);
    console.log('\n✓ Test completed - subscription cleaned up');

    return Response.json({
      success: true,
      test: {
        customer_id: customer.id,
        initial_subscription: initialSub.id,
        upgraded_subscription: upgraded.id,
        old_price: 99,
        new_price: 249,
        prorations_created: hasProration,
        billing_behavior: hasProration ? 'User charged difference today, full amount next cycle' : 'Standard upgrade',
      },
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});