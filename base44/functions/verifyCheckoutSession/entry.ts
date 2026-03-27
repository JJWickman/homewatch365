import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { sessionId } = await req.json();

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // If session completed, subscription will be created by webhook
    // Just verify session status — webhook handles DB updates
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Payment not completed' });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});