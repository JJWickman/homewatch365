import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find all "To the Moon" companies
    const companies = await base44.asServiceRole.entities.Company.filter({}, '-created_date', 100);
    const toTheMoonCompanies = companies.filter(c => c.name && c.name.toLowerCase().includes('to the moon'));

    if (toTheMoonCompanies.length <= 1) {
      return Response.json({ message: 'No duplicates to merge' });
    }

    // Keep the oldest company
    const keepCompany = toTheMoonCompanies[toTheMoonCompanies.length - 1];
    const deleteCompanies = toTheMoonCompanies.filter(c => c.id !== keepCompany.id);

    // Migrate all data from duplicate companies to the keeper
    const entityTypes = ['Client', 'Property', 'Visit', 'CompanyMember', 'CommunicationLog', 'MonthlyStatement', 'FollowUp'];

    for (const dupCompany of deleteCompanies) {
      for (const entityType of entityTypes) {
        try {
          const records = await base44.asServiceRole.entities[entityType].filter({ company_id: dupCompany.id }, '', 1000);
          for (const record of records) {
            await base44.asServiceRole.entities[entityType].update(record.id, { company_id: keepCompany.id });
          }
        } catch (e) {
          console.log(`Skipped ${entityType}:`, e.message);
        }
      }

      // Delete the duplicate company
      await base44.asServiceRole.entities.Company.delete(dupCompany.id);
    }

    return Response.json({
      success: true,
      message: `Merged ${deleteCompanies.length} duplicate "To the Moon" companies`,
      kept_company_id: keepCompany.id,
      deleted_count: deleteCompanies.length
    });
  } catch (error) {
    console.error('Error merging companies:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});