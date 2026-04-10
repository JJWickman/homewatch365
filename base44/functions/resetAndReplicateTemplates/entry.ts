import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Deletes all non-source tenant templates and re-replicates from the source tenant
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'superadmin') {
      return Response.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    const sourceTenantId = '69c4784908cbd3c8bce515f0';

    // Get source templates (the authoritative ones)
    const sourceTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({ tenant_id: sourceTenantId });
    console.log(`Source templates: ${sourceTemplates.length}`);

    // Get all templates NOT from source tenant
    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.list('-created_date', 2000);
    const nonSourceTemplates = allTemplates.filter(t => t.tenant_id !== sourceTenantId);
    console.log(`Non-source templates to delete: ${nonSourceTemplates.length}`);

    // Delete all non-source templates
    for (const t of nonSourceTemplates) {
      await base44.asServiceRole.entities.ChecklistTemplate.delete(t.id);
    }
    console.log(`Deleted ${nonSourceTemplates.length} templates`);

    // Get all tenants except source
    const allTenants = await base44.asServiceRole.entities.Tenant.list('-created_date', 1000);
    const targetTenants = allTenants.filter(t => t.id !== sourceTenantId);
    console.log(`Replicating to ${targetTenants.length} tenants`);

    let totalCreated = 0;
    for (const tenant of targetTenants) {
      const copies = sourceTemplates.map(t => ({
        name: t.name,
        template_slug: t.template_slug,
        property_type: t.property_type,
        category: t.category,
        description: t.description,
        sections: t.sections,
        checklist_instructions: t.checklist_instructions,
        version: t.version,
        active: t.active,
        is_system_template: false,
        tenant_id: tenant.id
      }));
      await base44.asServiceRole.entities.ChecklistTemplate.bulkCreate(copies);
      totalCreated += copies.length;
    }

    return Response.json({
      success: true,
      sourceTemplates: sourceTemplates.length,
      deletedOld: nonSourceTemplates.length,
      tenantsUpdated: targetTenants.length,
      totalCreated
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});