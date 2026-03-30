import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const sr = (await import('npm:@base44/sdk@0.8.23')).createClientFromRequest(req).asServiceRole;

    // Get system templates (null tenant)
    const oldTemplates = await sr.entities.ChecklistTemplate.list(null, 100);

    const withSections = oldTemplates.filter(t => t.sections && t.sections.length > 0);

    return Response.json({
      totalOldTemplates: oldTemplates.length,
      withSections: withSections.length,
      examples: oldTemplates.slice(0, 3).map(t => ({
        name: t.name,
        template_slug: t.template_slug,
        sectionsCount: t.sections ? t.sections.length : 0,
        firstSection: t.sections ? t.sections[0]?.title : null
      }))
    });
  } catch (error) {
    console.error('Inspect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});