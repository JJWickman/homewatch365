import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'superadmin') {
      return Response.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    const sourceTenanId = '69c4784908cbd3c8bce515f0';
    
    // Get the 12 templates from source tenant
    const sourceTemplates = await base44.entities.ChecklistTemplate.filter({
      tenant_id: sourceTenanId
    });
    
    console.log(`Found ${sourceTemplates.length} source templates`);

    // Get all tenants
    const allTenants = await base44.asServiceRole.entities.Tenant.list('-created_date', 1000);
    console.log(`Found ${allTenants.length} total tenants`);

    const targetTenants = allTenants.filter(t => t.id !== sourceTenanId);
    console.log(`Will replicate to ${targetTenants.length} target tenants`);

    let totalCreated = 0;

    // For each target tenant, create copies of all source templates
    for (const targetTenant of targetTenants) {
      const templatesForTenant = sourceTemplates.map(template => ({
        name: template.name,
        template_slug: template.template_slug,
        property_type: template.property_type,
        category: template.category,
        description: template.description,
        sections: template.sections,
        checklist_instructions: template.checklist_instructions,
        version: template.version,
        active: template.active,
        is_system_template: false,
        tenant_id: targetTenant.id
      }));

      if (templatesForTenant.length > 0) {
        await base44.asServiceRole.entities.ChecklistTemplate.bulkCreate(templatesForTenant);
        totalCreated += templatesForTenant.length;
        console.log(`Created ${templatesForTenant.length} templates for tenant ${targetTenant.id}`);
      }
    }

    return Response.json({
      success: true,
      sourceTemplatesCount: sourceTemplates.length,
      targetTenantsCount: targetTenants.length,
      totalTemplatesCreated: totalCreated,
      message: `Replicated ${sourceTemplates.length} templates to ${targetTenants.length} tenants (${totalCreated} total created)`
    });
  } catch (error) {
    console.error('Error replicating templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});