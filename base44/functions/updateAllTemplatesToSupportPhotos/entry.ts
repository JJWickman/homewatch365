import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get ALL templates (across all tenants)
    const allTemplates = await base44.asServiceRole.entities.ChecklistTemplate.list('-created_date', 1000);

    let updatedCount = 0;
    const updates = [];

    for (const template of allTemplates) {
      let modified = false;
      const updatedSections = (template.sections || []).map(section => {
        // Ensure allow_photo is true by default
        if (section.allow_photo === undefined || section.allow_photo === false) {
          modified = true;
          return { ...section, allow_photo: true };
        }
        return section;
      });

      if (modified) {
        updates.push({
          id: template.id,
          sections: updatedSections
        });
        updatedCount++;
      }
    }

    // Batch update all modified templates
    if (updates.length > 0) {
      for (const update of updates) {
        await base44.asServiceRole.entities.ChecklistTemplate.update(update.id, {
          sections: update.sections
        });
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updatedCount} templates to support photo capture`,
      totalTemplates: allTemplates.length,
      updatedCount: updatedCount
    });
  } catch (error) {
    console.error('Error updating templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});