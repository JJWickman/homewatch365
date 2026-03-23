import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TEMPLATE_DATA = {
  name: 'Condo/Villa Home Watch Visit',
  code: 'condo_villa_home_watch_visit',
  property_type: 'condo_villa',
  category: 'home_watch_visit',
  description: 'Mobile field checklist for scheduled Condo/Villa Home Watch visits.',
  version: 1,
  active: true
};

const SECTIONS = [
  {
    title: 'Upon Arrival',
    description: 'Exterior arrival and startup checks.',
    sort_order: 1,
    icon: 'MapPin'
  },
  {
    title: 'Pool and Spa',
    description: 'Pool and equipment observation.',
    sort_order: 2,
    icon: 'Waves'
  },
  {
    title: 'Interior Check',
    description: 'Entry and first interior checks.',
    sort_order: 3,
    icon: 'Home'
  },
  {
    title: 'Water Zone Home Watch Method',
    description: 'Appliance, plumbing, leak, and moisture checks.',
    sort_order: 4,
    icon: 'Droplets'
  },
  {
    title: 'AC System',
    description: 'Air conditioning validation.',
    sort_order: 5,
    icon: 'Wind'
  },
  {
    title: 'Observe and Report',
    description: 'Interior condition and occupancy checks.',
    sort_order: 6,
    icon: 'Eye'
  },
  {
    title: 'Storm Protection',
    description: 'Property-specific storm protection checks.',
    sort_order: 7,
    icon: 'CloudLightning'
  },
  {
    title: 'Garage',
    description: 'Garage checks.',
    sort_order: 8,
    icon: 'Car'
  },
  {
    title: 'Departure',
    description: 'Final secure departure checks.',
    sort_order: 9,
    icon: 'LogOut'
  }
];

const ITEMS = [
  // Section 1: Upon Arrival
  { section: 0, label: 'Check mailbox, remove newspapers, forward mail if requested, etc.', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 0, label: 'Exterior check of landscape for brown spots or dead plants', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },
  { section: 0, label: 'Check for signs of rodents, insects, or other critters', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },
  { section: 0, label: 'Turn the water ON at the main supply valve, slowly and gingerly', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 4 },
  { section: 0, label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 5 },

  // Section 2: Pool and Spa
  { section: 1, label: 'Pool water level checked', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 1, label: 'Pool equipment checked', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },

  // Section 3: Interior Check
  { section: 2, label: 'Disarm security system', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 2, label: 'Test the phone line', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },

  // Section 4: Water Zone Home Watch Method
  { section: 3, label: 'Short cycle on the dishwasher, check for visible leaks', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 3, label: 'Run the garbage disposal, check for proper operation and visible leaks', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },
  { section: 3, label: 'Short cycle on the washing machine, check for visible leaks', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },
  { section: 3, label: 'Operate clothes dryer', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true, sort_order: 4 },
  { section: 3, label: 'Run water in sinks, check for visible leaks', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 5 },
  { section: 3, label: 'Check the refrigerator and freezer temp and for proper operation', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 6 },
  { section: 3, label: 'Ice maker emptied and OFF', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 7 },
  { section: 3, label: 'Perishable and frozen foods removed from fridge and freezer', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 8 },
  { section: 3, label: 'Check wine cooler or wine room for proper temp, signs of water, moisture, or condensation', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 9 },
  { section: 3, label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', response_type: 'instruction_only', required: false, sort_order: 10 },
  { section: 3, label: 'Run water in showers and tubs, checking for visible leaks', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 11 },
  { section: 3, label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', response_type: 'instruction_only', required: false, sort_order: 12 },
  { section: 3, label: 'Brush and flush toilets, check for visible leaks and signs of water damage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 13 },
  { section: 3, label: 'Water heater should be OFF at the breaker or set to Vacation Mode. Circulator pump must be OFF. Procedure varies by equipment type.', response_type: 'instruction_only', required: false, sort_order: 14 },
  { section: 3, label: 'Check water heater for signs of visible leaks and rust', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 15 },

  // Section 5: AC System
  { section: 4, label: 'Main room temperature', response_type: 'number', required: false, placeholder: 'Enter temperature', metadata_json: { unit: 'F' }, sort_order: 1 },
  { section: 4, label: 'Main room humidity', response_type: 'percentage', required: false, placeholder: 'Enter humidity %', metadata_json: { unit: '%' }, sort_order: 2 },
  { section: 4, label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },
  { section: 4, label: 'AC is blowing cold air', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 4 },
  { section: 4, label: 'AC filters, if accessible, checked', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 5 },
  { section: 4, label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 6 },

  // Section 6: Observe and Report
  { section: 5, label: 'Check visible ceilings for signs of water intrusion or other damage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 5, label: 'Check visible walls for signs of water intrusion or other damage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },
  { section: 5, label: 'Check visible baseboards for signs of water or other damage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },
  { section: 5, label: 'Check or test electronics only if requested by homeowner', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 4 },
  { section: 5, label: 'Check windows and sliders for damage or leaks, and make sure locked', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 5 },
  { section: 5, label: 'Ceiling fans are ON', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true, sort_order: 6 },
  { section: 5, label: 'Check for signs of insects or rodents', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 7 },
  { section: 5, label: 'Check furniture for any irregularities', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 8 },
  { section: 5, label: 'Home Watch Mode includes opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources', response_type: 'instruction_only', required: false, sort_order: 9 },
  { section: 5, label: 'Is the residence in Home Watch Mode', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 10 },

  // Section 7: Storm Protection
  { section: 6, label: 'Everything about storm protection will need to be customized for the property', response_type: 'instruction_only', required: false, sort_order: 1 },
  { section: 6, label: 'Exercise electric storm shutters', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, metadata_json: { customizable: true }, sort_order: 2 },
  { section: 6, label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested and operating properly', response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, metadata_json: { customizable: true }, sort_order: 3 },

  // Section 8: Garage
  { section: 7, label: 'Check visible ceiling, walls, and baseboards for signs of damage', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 1 },
  { section: 7, label: 'Exercise the garage door', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },
  { section: 7, label: 'Check breaker box', response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },

  // Section 9: Departure
  { section: 8, label: 'Always take a few moments before leaving the home to listen for unusual sounds', response_type: 'instruction_only', required: false, sort_order: 1 },
  { section: 8, label: 'Thermostat(s) returned to proper setting', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 2 },
  { section: 8, label: 'Turn water OFF at the main supply valve, slowly and gingerly, water lines drained', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true, sort_order: 3 },
  { section: 8, label: 'Photo of water valve in the OFF position', response_type: 'photo_only', required: true, allow_note: false, allow_photo: true, sort_order: 4 },
  { section: 8, label: 'Security system armed', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true, sort_order: 5 },
  { section: 8, label: 'Doors locked', response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true, sort_order: 6 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();

    // Check if template already exists
    const existingTemplate = await base44.entities.ChecklistTemplate.filter({ code: TEMPLATE_DATA.code, company_id });
    if (existingTemplate.length > 0) {
      return Response.json({ message: 'Template already exists', template: existingTemplate[0] });
    }

    // Create template
    const template = await base44.entities.ChecklistTemplate.create({
      ...TEMPLATE_DATA,
      company_id
    });

    // Create sections
    const sectionMap = {};
    for (const section of SECTIONS) {
      const created = await base44.entities.ChecklistTemplateSection.create({
        template_id: template.id,
        ...section
      });
      sectionMap[SECTIONS.indexOf(section)] = created.id;
    }

    // Create items
    for (const item of ITEMS) {
      await base44.entities.ChecklistTemplateItem.create({
        template_id: template.id,
        section_id: sectionMap[item.section],
        label: item.label,
        response_type: item.response_type,
        required: item.required || false,
        sort_order: item.sort_order,
        allow_na: item.allow_na !== false,
        allow_note: item.allow_note || false,
        allow_photo: item.allow_photo || false,
        allow_severity: item.allow_severity || false,
        placeholder: item.placeholder,
        metadata_json: item.metadata_json
      });
    }

    return Response.json({
      success: true,
      template: template,
      message: 'Condo/Villa Home Watch Visit template seeded successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});