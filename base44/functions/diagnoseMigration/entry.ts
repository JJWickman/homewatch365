import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'superadmin') {
      return Response.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    console.log('Fetching ChecklistTemplate records...');
    // Get ALL templates—try without service role first to see user-scoped results
    const allTemplates = await base44.entities.ChecklistTemplate.list('-created_date', 2000);
    console.log(`Found ${allTemplates.length} templates with user context`);
    
    // Also try with service role
    const serviceTemplates = await base44.asServiceRole.entities.ChecklistTemplate.list('-created_date', 2000);
    console.log(`Found ${serviceTemplates.length} templates with service role context`);
    
    // Count unique tenant_ids
    const uniqueTenants = new Set(allTemplates.map(t => t.tenant_id).filter(Boolean));
    
    // Group by tenant_id
    const byTenant = {};
    allTemplates.forEach(t => {
      if (!byTenant[t.tenant_id]) byTenant[t.tenant_id] = [];
      byTenant[t.tenant_id].push(t.name);
    });

    return Response.json({
      totalCountUser: allTemplates.length,
      totalCountService: serviceTemplates.length,
      uniqueTenantIds: Array.from(uniqueTenants),
      uniqueTenantCount: uniqueTenants.size,
      byTenant: byTenant,
      templates: allTemplates.map(t => ({ id: t.id, name: t.name, tenant_id: t.tenant_id })),
      userPrimaryTenantId: user?.data?.primary_tenant_id,
      userRole: user?.role
    });
  } catch (error) {
    console.error('Error diagnosing:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});