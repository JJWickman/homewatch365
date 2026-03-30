import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;

  try {
    console.log('Starting ChecklistTemplate reset...');
    let totalDeleted = 0;
    let batchCount = 0;
    const batchSize = 500; // Process in chunks
    let hasMore = true;

    // Delete all existing records in batches
    while (hasMore) {
      batchCount++;
      console.log(`Batch ${batchCount}: Fetching records...`);
      
      const batch = await sr.entities.ChecklistTemplate.filter({}, null, batchSize);
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Batch ${batchCount}: Deleting ${batch.length} records...`);
      for (const record of batch) {
        try {
          await sr.entities.ChecklistTemplate.delete(record.id);
          totalDeleted++;
        } catch (err) {
          console.warn(`Failed to delete ${record.id}:`, err.message);
        }
      }

      // Small delay between batches to avoid rate limits
      await new Promise(r => setTimeout(r, 100));

      if (batch.length < batchSize) {
        hasMore = false;
      }
    }

    console.log(`Deleted ${totalDeleted} total records in ${batchCount} batches`);

    // Re-seed system templates with clean data
    const systemTemplates = [
      {
        name: 'Single Family Home',
        template_slug: 'single_family_standard',
        property_type: 'single_family',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for single family homes',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Condo/Villa',
        template_slug: 'condo_villa_standard',
        property_type: 'condo_villa',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for condos and villas',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'High-Rise',
        template_slug: 'high_rise_standard',
        property_type: 'high_rise',
        category: 'home_watch_visit',
        description: 'Standard home watch visit checklist for high-rise properties',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Arrival / Departure Visit',
        template_slug: 'arrival_departure_standard',
        property_type: null,
        category: 'arrival_departure',
        description: 'Checklist for arrival and departure visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Access Visit',
        template_slug: 'access_visit_standard',
        property_type: null,
        category: 'access_visit',
        description: 'Checklist for vendor/contractor access visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Emergency Visit',
        template_slug: 'emergency_visit_standard',
        property_type: null,
        category: 'emergency_visit',
        description: 'Checklist for emergency property visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Damage Recovery',
        template_slug: 'damage_recovery_standard',
        property_type: null,
        category: 'damage_recovery',
        description: 'Ongoing damage recovery tracking checklist',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Auto Care Visit',
        template_slug: 'auto_care_standard',
        property_type: null,
        category: 'auto_care',
        description: 'Checklist for vehicle care visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Post-Storm Visit',
        template_slug: 'post_storm_standard',
        property_type: null,
        category: 'post_storm',
        description: 'Checklist for post-storm property assessment',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Client Service Visit',
        template_slug: 'client_service_standard',
        property_type: null,
        category: 'client_service',
        description: 'Checklist for client service visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      },
      {
        name: 'Concierge Service Visit',
        template_slug: 'concierge_service_standard',
        property_type: null,
        category: 'concierge',
        description: 'Checklist for concierge service visits',
        version: 1,
        active: true,
        is_system_template: true,
        tenant_id: null,
        sections: []
      }
    ];

    let seededCount = 0;
    for (const template of systemTemplates) {
      try {
        await sr.entities.ChecklistTemplate.create(template);
        seededCount++;
      } catch (err) {
        console.error(`Failed to create template ${template.template_slug}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      deleted: totalDeleted,
      deleteBatches: batchCount,
      seeded: seededCount,
      message: `Deleted ${totalDeleted} records and seeded ${seededCount} system templates`
    });
  } catch (error) {
    console.error('Reset error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});