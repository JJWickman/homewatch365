import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all templates
    const templates = await base44.asServiceRole.entities.ChecklistTemplate.list('-created_date', 100);

    // Define core templates
    const coreTemplates = [
      { name: 'Single Family Home', property_type: 'single_family' },
      { name: 'Condo/Villa', property_type: 'condo_villa' },
      { name: 'High-Rise', property_type: 'high_rise' }
    ];

    // Find which templates to keep (first occurrence of each property_type)
    const propertyTypesSeen = new Set();
    const templatesToKeep = [];
    const templatesToDelete = [];

    templates.forEach((template) => {
      const key = template.property_type || template.name;
      if (!propertyTypesSeen.has(key)) {
        propertyTypesSeen.add(key);
        templatesToKeep.push(template);
      } else {
        templatesToDelete.push(template.id);
      }
    });

    // Delete duplicates
    for (const templateId of templatesToDelete) {
      await base44.asServiceRole.entities.ChecklistTemplate.delete(templateId);
    }

    return Response.json({
      message: `Cleaned up ${templatesToDelete.length} duplicate templates`,
      kept: templatesToKeep.length,
      deleted: templatesToDelete.length,
      templates: templatesToKeep.map(t => ({ id: t.id, name: t.name, property_type: t.property_type }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});