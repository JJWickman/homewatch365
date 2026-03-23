import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company member to find company_id
    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (!members.length) {
      return Response.json({ error: 'No company found' }, { status: 400 });
    }

    const companyId = members[0].company_id;

    // Create template
    const template = await base44.entities.ChecklistTemplate.create({
      name: 'Single Family Home Watch Visit',
      code: 'single_family_home_watch_visit',
      property_type: 'single_family',
      category: 'home_watch_visit',
      description: 'Mobile checklist for single family Home Watch property visits.',
      version: 1,
      active: true,
      company_id: companyId
    });

    // Define all sections
    const sectionsData = [
      {
        title: 'Upon Arrival / Exterior Check',
        sort_order: 1,
        items: [
          { label: 'Check mailbox, remove newspapers, forward mail if requested', response_type: 'ok_issue_na', required: true, sort_order: 1 },
          { label: 'Exterior landscape inspection for brown spots or dead plants', response_type: 'ok_issue_na', required: true, sort_order: 2 },
          { label: 'Check for rodents, insects, or pests', response_type: 'ok_issue_na', required: true, sort_order: 3 },
          { label: 'Turn water ON at the main supply valve slowly', response_type: 'ok_issue_na', required: true, sort_order: 4 },
          { label: 'Exterior visual inspection including windows, roof from ground, screens, AC unit, pavers, pool cage', response_type: 'ok_issue_na', required: true, sort_order: 5 }
        ]
      },
      {
        title: 'Pool and Spa',
        sort_order: 2,
        items: [
          { label: 'Pool water level checked', response_type: 'ok_issue_na', required: true, sort_order: 6 },
          { label: 'Pool equipment checked', response_type: 'ok_issue_na', required: true, sort_order: 7 }
        ]
      },
      {
        title: 'Interior Check',
        sort_order: 3,
        items: [
          { label: 'Disarm security system', response_type: 'ok_issue_na', required: true, sort_order: 8 },
          { label: 'Test phone line', response_type: 'ok_issue_na', required: false, sort_order: 9 }
        ]
      },
      {
        title: 'Water Zone Method',
        sort_order: 4,
        items: [
          { label: 'Run short cycle on dishwasher and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 10 },
          { label: 'Operate garbage disposal and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 11 },
          { label: 'Run short cycle washing machine and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 12 },
          { label: 'Operate clothes dryer', response_type: 'ok_issue_na', required: true, sort_order: 13 },
          { label: 'Run water in sinks and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 14 },
          { label: 'Check refrigerator and freezer temperature', response_type: 'ok_issue_na', required: true, sort_order: 15 },
          { label: 'Ice maker emptied and OFF', response_type: 'ok_issue_na', required: false, sort_order: 16 },
          { label: 'Perishable food removed', response_type: 'ok_issue_na', required: false, sort_order: 17 },
          { label: 'Wine cooler / wine room temperature check', response_type: 'ok_issue_na', required: false, sort_order: 18 },
          { label: 'Run water in showers and tubs and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 19 },
          { label: 'Brush and flush toilets and check for leaks', response_type: 'ok_issue_na', required: true, sort_order: 20 },
          { label: 'Water heater inspected for rust or leaks', response_type: 'ok_issue_na', required: true, sort_order: 21 }
        ]
      },
      {
        title: 'AC System',
        sort_order: 5,
        items: [
          { label: 'Main room temperature', response_type: 'number', required: false, sort_order: 22 },
          { label: 'Main room humidity', response_type: 'percentage', required: false, sort_order: 23 },
          { label: 'Lower thermostat a few degrees and confirm AC set to Auto Cool', response_type: 'ok_issue_na', required: true, sort_order: 24 },
          { label: 'Confirm AC blowing cold air', response_type: 'ok_issue_na', required: true, sort_order: 25 },
          { label: 'Check AC filters', response_type: 'ok_issue_na', required: false, sort_order: 26 },
          { label: 'Check AC secondary drain pan for leaks', response_type: 'ok_issue_na', required: false, sort_order: 27 }
        ]
      },
      {
        title: 'Observe and Report',
        sort_order: 6,
        items: [
          { label: 'Confirm residence is in Home Watch Mode', response_type: 'ok_issue_na', required: true, sort_order: 28 }
        ]
      },
      {
        title: 'Storm Protection',
        sort_order: 7,
        items: [
          { label: 'Exercise electric storm shutters if applicable', response_type: 'ok_issue_na', required: false, sort_order: 29 },
          { label: 'Confirm shutter switch or remote working properly', response_type: 'ok_issue_na', required: false, sort_order: 30 }
        ]
      },
      {
        title: 'Garage',
        sort_order: 8,
        items: [
          { label: 'Inspect ceiling, walls, baseboards for damage', response_type: 'ok_issue_na', required: true, sort_order: 31 },
          { label: 'Exercise garage door', response_type: 'ok_issue_na', required: true, sort_order: 32 },
          { label: 'Check breaker box', response_type: 'ok_issue_na', required: true, sort_order: 33 }
        ]
      },
      {
        title: 'Departure',
        sort_order: 9,
        items: [
          { label: 'Return thermostats to proper setting', response_type: 'ok_issue_na', required: true, sort_order: 34 },
          { label: 'Turn water OFF at the main supply valve', response_type: 'ok_issue_na', required: true, sort_order: 35 },
          { label: 'Photo of water valve in OFF position', response_type: 'photo_only', required: true, sort_order: 36 },
          { label: 'Arm security system', response_type: 'ok_issue_na', required: true, sort_order: 37 },
          { label: 'Lock all doors', response_type: 'ok_issue_na', required: true, sort_order: 38 }
        ]
      }
    ];

    // Create sections and items
    for (const sectionData of sectionsData) {
      const section = await base44.entities.ChecklistTemplateSection.create({
        template_id: template.id,
        title: sectionData.title,
        sort_order: sectionData.sort_order,
        is_collapsible: true
      });

      // Create items for this section
      for (const itemData of sectionData.items) {
        await base44.entities.ChecklistTemplateItem.create({
          template_id: template.id,
          section_id: section.id,
          label: itemData.label,
          response_type: itemData.response_type,
          required: itemData.required,
          sort_order: itemData.sort_order,
          allow_na: itemData.response_type === 'ok_issue_na',
          allow_note: itemData.response_type === 'ok_issue_na',
          allow_photo: itemData.response_type === 'ok_issue_na' || itemData.response_type === 'photo_only',
          allow_severity: itemData.response_type === 'ok_issue_na'
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Single Family Home Watch Visit template created',
      template_id: template.id,
      sections: sectionsData.length,
      items: sectionsData.reduce((sum, s) => sum + s.items.length, 0)
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});