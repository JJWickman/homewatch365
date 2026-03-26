import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subdomain } = await req.json();

    if (!subdomain) {
      return Response.json({ available: false, message: 'Subdomain is required' });
    }

    // Check if subdomain already exists
    const existing = await base44.asServiceRole.entities.Tenant.filter({ slug: subdomain.toLowerCase() });
    
    const available = existing.length === 0;
    return Response.json({ available });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    return Response.json({ available: false, message: 'Error checking availability' }, { status: 500 });
  }
});