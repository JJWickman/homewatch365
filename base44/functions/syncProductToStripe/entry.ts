import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { product_service_id, tenant_id } = await req.json();

    if (!product_service_id || !tenant_id) {
      return Response.json({ error: 'Missing product_service_id or tenant_id' }, { status: 400 });
    }

    // Load tenant and product
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
    const company = tenants[0];
    if (!company) return Response.json({ error: 'Tenant not found' }, { status: 404 });

    const products = await base44.asServiceRole.entities.ProductService.filter({ id: product_service_id });
    const product = products[0];
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Determine if company has a connected Stripe account
    const connectedAccountId = company.stripe_connect_account_id;
    const stripeOptions = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

    // If product already has a stripe_price_id, check if it's still valid
    if (product.stripe_price_id) {
      try {
        const existingPrice = await stripe.prices.retrieve(product.stripe_price_id, {}, stripeOptions);
        if (existingPrice && existingPrice.active) {
          return Response.json({ 
            success: true, 
            stripe_price_id: product.stripe_price_id,
            message: 'Product already synced to Stripe'
          });
        }
      } catch (e) {
        // Price not found or invalid, will create new
      }
    }

    // Create or update Stripe product
    let stripeProduct;
    if (product.stripe_price_id) {
      // Try to get existing product from the price
      try {
        const existingPrice = await stripe.prices.retrieve(product.stripe_price_id, {}, stripeOptions);
        stripeProduct = await stripe.products.update(
          existingPrice.product,
          { name: product.name, description: product.description || undefined },
          stripeOptions
        );
      } catch (e) {
        stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description || undefined,
          metadata: { product_service_id: product.id, tenant_id: tenant_id }
        }, stripeOptions);
      }
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        metadata: { product_service_id: product.id, tenant_id: tenant_id }
      }, stripeOptions);
    }

    // Build price params
    let priceParams = {
      product: stripeProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: 'usd',
      metadata: { product_service_id: product.id, tenant_id: tenant_id }
    };

    // Add recurring if subscription
    if (product.type === 'subscription') {
      const freq = product.billing_frequency || 'monthly';
      if (freq === 'monthly') {
        priceParams.recurring = { interval: 'month', interval_count: 1 };
      } else if (freq === 'quarterly') {
        priceParams.recurring = { interval: 'month', interval_count: 3 };
      } else if (freq === 'annually') {
        priceParams.recurring = { interval: 'year', interval_count: 1 };
      }
    }

    const stripePrice = await stripe.prices.create(priceParams, stripeOptions);

    // Save stripe_price_id back to ProductService
    await base44.asServiceRole.entities.ProductService.update(product.id, {
      stripe_price_id: stripePrice.id
    });

    return Response.json({
      success: true,
      stripe_price_id: stripePrice.id,
      stripe_product_id: stripeProduct.id,
      connected_account: connectedAccountId || 'platform_account',
      message: connectedAccountId 
        ? `Product synced to company Stripe account (${connectedAccountId})`
        : 'Product synced to platform Stripe account (company has no connected Stripe account yet)'
    });

  } catch (error) {
    console.error('syncProductToStripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});