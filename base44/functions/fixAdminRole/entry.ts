import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find the user and update their role via entity
    const users = await base44.asServiceRole.entities.User.filter({ email: 'jasonwi@live.com' });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const updated = await base44.asServiceRole.entities.User.update(users[0].id, {
      role: 'admin'
    });

    return Response.json({ success: true, message: 'Role updated to admin', user: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});