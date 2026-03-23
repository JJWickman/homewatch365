import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, reset_code, new_pin } = await req.json();

    // Validate PIN format
    if (!/^\d{6}$/.test(new_pin)) {
      return Response.json({ 
        success: false, 
        message: 'PIN must be 6 digits' 
      }, { status: 400 });
    }

    // Get client
    const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
    if (clients.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Client not found' 
      }, { status: 404 });
    }

    const client = clients[0];

    // Check reset code
    if (!client.portal_pin_reset_code || client.portal_pin_reset_code !== reset_code) {
      return Response.json({ 
        success: false, 
        message: 'Invalid reset code' 
      }, { status: 400 });
    }

    // Check expiration
    if (client.portal_pin_reset_expires) {
      const expiresAt = new Date(client.portal_pin_reset_expires);
      if (expiresAt < new Date()) {
        return Response.json({ 
          success: false, 
          message: 'Reset code has expired' 
        }, { status: 400 });
      }
    }

    // Update PIN and clear reset code
    await base44.asServiceRole.entities.Client.update(client_id, {
      portal_pin: new_pin,
      portal_pin_reset_code: null,
      portal_pin_reset_expires: null
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});