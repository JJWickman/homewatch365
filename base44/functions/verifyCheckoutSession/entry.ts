import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    // LOG REQUEST CONTEXT for domain/app debugging
    const host = req.headers.get('host');
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const appIdHeader = req.headers.get('base44-app-id');
    const authHeader = req.headers.get('authorization');
    const userAgent = req.headers.get('user-agent');
    
    console.log('=== verifyCheckoutSession Request Context ===');
    console.log('Host:', host);
    console.log('Origin:', origin);
    console.log('Referer:', referer);
    console.log('Base44-App-Id Header:', appIdHeader || 'MISSING');
    console.log('Authorization Header:', authHeader ? 'Present' : 'MISSING');
    console.log('User-Agent:', userAgent);
    console.log('Request URL:', req.url);
    console.log('==========================================');

    const { sessionId } = await req.json();

    // Fetch Stripe session for frontend display only
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('Stripe session retrieved successfully:', { status: session.payment_status });
    
    return Response.json({
      success: true,
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      subscription_id: session.subscription
    });
  } catch (error) {
    console.error('❌ verifyCheckoutSession Error:', error.message);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});