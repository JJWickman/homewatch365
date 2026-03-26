import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    return Response.json({
      email: user.email,
      id: user.id,
      role: user.role,
      primary_tenant_id: user.primary_tenant_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});