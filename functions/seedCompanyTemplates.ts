import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const company = payload.data;

    // Create three standard templates for this company
    const templates = [
      {
        name: 'Single Family Home',
        code: 'single_family_standard',
        company_id: company.id,
        property_type: 'single_family',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for single family homes',
        version: 1,
        active: true
      },
      {
        name: 'Condo/Villa',
        code: 'condo_villa_standard',
        company_id: company.id,
        property_type: 'condo_villa',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for condos and villas',
        version: 1,
        active: true
      },
      {
        name: 'High-Rise',
        code: 'high_rise_standard',
        company_id: company.id,
        property_type: 'high_rise',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for high-rise properties',
        version: 1,
        active: true
      }
    ];

    await base44.asServiceRole.entities.ChecklistTemplate.bulkCreate(templates);

    return Response.json({
      success: true,
      message: `Seeded 3 templates for company: ${company.name}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});