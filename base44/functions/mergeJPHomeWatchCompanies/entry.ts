import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find all JP Home Watch tenants
    const tenants = await base44.asServiceRole.entities.Tenant.filter({}, '-created_date', 100);
    const jpTenants = tenants.filter(c => c.name && c.name.includes('JP Home Watch'));

    if (jpTenants.length <= 1) {
      return Response.json({ message: 'No duplicates to merge' });
    }

    // Keep the first (oldest) tenant
    const keepTenant = jpTenants[0];
    const deleteTenants = jpTenants.slice(1);

    // Migrate all data from duplicate tenants to the keeper
    const entityTypes = ['Client', 'Property', 'Visit', 'TenantUser', 'CommunicationLog', 'MonthlyStatement'];

    for (const dupTenant of deleteTenants) {
      for (const entityType of entityTypes) {
        try {
          const records = await base44.asServiceRole.entities[entityType].filter({ tenant_id: dupTenant.id }, '', 1000);
          for (const record of records) {
            await base44.asServiceRole.entities[entityType].update(record.id, { tenant_id: keepTenant.id });
          }
        } catch (e) {
          // Entity might not exist or have tenant_id field
          console.log(`Skipped ${entityType}:`, e.message);
        }
      }

      // Delete the duplicate tenant
      await base44.asServiceRole.entities.Tenant.delete(dupTenant.id);
    }

    return Response.json({
      success: true,
      message: `Merged ${deleteTenants.length} duplicate tenants into ${keepTenant.name}`,
      kept_tenant_id: keepTenant.id,
      deleted_count: deleteTenants.length
    });
  } catch (error) {
    console.error('Error merging companies:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});