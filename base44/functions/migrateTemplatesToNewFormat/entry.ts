import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins and superadmins can run this
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user's tenant templates (RLS applies with user context, not service role)
    const allTemplates = await base44.entities.ChecklistTemplate.list('-created_date', 2000);

    let updatedCount = 0;
    const updates = [];

    for (const template of allTemplates) {
      let modified = false;
      const updatedSections = (template.sections || []).map(section => {
        let sectionModified = false;
        const updatedSection = { ...section };

        // Ensure section has notes field
        if (!updatedSection.notes) {
          updatedSection.notes = '';
          sectionModified = true;
        }

        // Update items to have response_type buttons (OK/Issue/NA)
        const updatedItems = (section.items || []).map(item => {
          const updatedItem = { ...item };
          // If item doesn't have response_type, default to 'ok'
          if (!updatedItem.response_type) {
            updatedItem.response_type = 'ok';
            sectionModified = true;
          }
          return updatedItem;
        });

        if (sectionModified) {
          updatedSection.items = updatedItems;
          modified = true;
        }

        return updatedSection;
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
      message: `Updated ${updatedCount} templates to new format with response type buttons, draggable items, and notes fields`,
      totalTemplates: allTemplates.length,
      updatedCount: updatedCount,
      skippedCount: allTemplates.length - updatedCount
    });
  } catch (error) {
    console.error('Error migrating templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});