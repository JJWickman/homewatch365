import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, email, phone } = await req.json();

    // Generate 6-character reset code
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in client record
    await base44.asServiceRole.entities.Client.update(client_id, {
      portal_pin_reset_code: resetCode,
      portal_pin_reset_expires: expiresAt.toISOString()
    });

    // Send email
    const emailPromise = base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Client Portal PIN Reset',
      body: `
Your PIN reset code is: ${resetCode}

This code will expire in 15 minutes.

If you did not request this reset, please contact your property manager immediately.
      `
    });

    // Send SMS (if phone number provided)
    let smsPromise = Promise.resolve();
    if (phone) {
      // Note: This would require SMS integration setup
      // For now, we'll skip SMS and just send email
      console.log(`Would send SMS to ${phone}: Your PIN reset code is ${resetCode}`);
    }

    await Promise.all([emailPromise, smsPromise]);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending reset code:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});