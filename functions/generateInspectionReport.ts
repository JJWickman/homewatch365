import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inspection_id } = await req.json();

    if (!inspection_id) {
      return Response.json({ error: 'inspection_id required' }, { status: 400 });
    }

    // Fetch inspection
    const inspections = await base44.entities.Inspection.filter({ id: inspection_id });
    if (!inspections.length) {
      return Response.json({ error: 'Inspection not found' }, { status: 404 });
    }
    
    const inspection = inspections[0];

    // Fetch property and client
    const [properties, clients] = await Promise.all([
      base44.entities.Property.filter({ id: inspection.property_id }),
      base44.entities.Client.filter({ id: inspection.client_id })
    ]);

    const property = properties[0];
    const client = clients[0];

    // Prepare data for AI summarization
    const categories = inspection.checklist_data || [];
    const photoCount = inspection.photo_count || 0;

    // Build prompt for AI
    const prompt = `You are an expert property inspector. Analyze the following inspection data and create a professional summary report.

Property: ${property?.name || 'Unknown'} at ${property?.address}, ${property?.city}, ${property?.state}
Client: ${client?.first_name} ${client?.last_name}
Date: ${new Date(inspection.scheduled_date).toLocaleDateString()}
Inspection Type: ${inspection.type === 'routine' ? 'Routine' : inspection.type.replace(/_/g, ' ')}

Categories Inspected:
${categories.map(cat => `
**${cat.section_name || 'Category'}:**
${cat.items?.map(item => `- ${item.name}: ${item.status || 'Not checked'} ${item.notes ? `(${item.notes})` : ''}`).join('\n')}
`).join('\n')}

Photos Captured: ${photoCount}

Create a professional summary report that:
1. Provides an executive summary of overall property condition
2. Highlights any issues found by category
3. Provides recommendations for maintenance
4. Is written in professional language suitable for the homeowner
5. Is concise but thorough (3-4 paragraphs)`;

    // Call LLM for summarization
    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    // Update inspection with AI summary
    await base44.entities.Inspection.update(inspection_id, {
      summary_notes: summary,
      overall_status: inspection.overall_status || 'all_clear'
    });

    return Response.json({
      success: true,
      report: {
        property_name: property?.name || property?.address,
        property_address: `${property?.city}, ${property?.state}`,
        client_name: `${client?.first_name} ${client?.last_name}`,
        inspection_date: new Date(inspection.scheduled_date).toLocaleDateString(),
        summary: summary,
        photo_count: photoCount,
        inspection_type: inspection.type
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});