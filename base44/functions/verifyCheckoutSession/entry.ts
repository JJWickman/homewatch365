import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { sessionId } = await req.json();

    // Fetch Stripe session for frontend display only
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return Response.json({
      success: true,
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      subscription_id: session.subscription
    });
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});