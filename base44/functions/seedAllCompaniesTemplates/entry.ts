import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all companies
    const companies = await base44.asServiceRole.entities.Company.list();
    const results = [];

    for (const company of companies) {
      try {
        // Check if company already has templates
        const existingTemplates = await base44.asServiceRole.entities.ChecklistTemplate.filter({
          company_id: company.id
        });

        if (existingTemplates.length >= 3) {
          results.push({
            company: company.name,
            status: 'skipped',
            reason: 'Already has templates'
          });
          continue;
        }

        // Create three standard templates
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

        const created = await base44.asServiceRole.entities.ChecklistTemplate.bulkCreate(templates);

        results.push({
          company: company.name,
          status: 'success',
          templatesCreated: created.length
        });
      } catch (error) {
        results.push({
          company: company.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      totalCompanies: companies.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});