import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CHECKLIST_DATA = {
  name: 'Single Family Home Watch Visit',
  code: 'sfh_watch_visit',
  description: 'Mobile field checklist for a scheduled home watch visit at a single family residence.',
  category: 'home_watch_visit',
  version: 1,
  sections: [
    {
      title: 'Upon Arrival / Exterior Check',
      sort_order: 1,
      icon: 'Home',
      items: [
        { label: 'Check mailbox, remove newspapers, forward mail if requested', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Exterior check of landscape for brown spots or dead plants', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check for signs of rodents, insects or other critters', sort_order: 3, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Turn the water ON at the main supply valve, slowly and gingerly, and confirm all OK', sort_order: 4, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', sort_order: 5, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Pool water level checked', sort_order: 6, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Pool equipment checked', sort_order: 7, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
      ]
    },
    {
      title: 'Interior Check',
      sort_order: 2,
      icon: 'DoorOpen',
      items: [
        { label: 'Disarm security system', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Test the phone line', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: false },
      ]
    },
    {
      title: 'Water Zone Home Watch Method',
      sort_order: 3,
      icon: 'Droplet',
      items: [
        { label: 'Short cycle on the dishwasher, check for visible leaks', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Operate the garbage disposal, check for proper operation and leaks', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Short cycle on the washing machine, check for visible leaks', sort_order: 3, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Operate clothes dryer', sort_order: 4, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: false },
        { label: 'Run water in sinks, check for visible leaks', sort_order: 5, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check the refrigerator and freezer temperature and proper operation', sort_order: 6, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Ice maker emptied and OFF', sort_order: 7, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Perishable and frozen foods removed from fridge and freezer', sort_order: 8, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check wine cooler or wine room for proper temperature and operation', sort_order: 9, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Run water in showers and tubs, checking for visible leaks', sort_order: 10, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Brush and flush toilets, check for visible leaks and signs of water damage', sort_order: 11, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check the water heater for signs of leaks and rust', sort_order: 12, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
      ]
    },
    {
      title: 'AC System',
      sort_order: 4,
      icon: 'Wind',
      items: [
        { label: 'Record temperature in main room', sort_order: 1, response_type: 'temperature_reading', required: false, placeholder: 'Enter temperature (°F)' },
        { label: 'Record humidity in main room', sort_order: 2, response_type: 'humidity_reading', required: false, placeholder: 'Enter humidity (%)' },
        { label: 'Lower thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', sort_order: 3, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'AC is blowing cold air', sort_order: 4, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'AC filters checked', sort_order: 5, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check for visible leaks or water in the secondary pan, if accessible', sort_order: 6, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
      ]
    },
    {
      title: 'Observe and Report',
      sort_order: 5,
      icon: 'Eye',
      items: [
        { label: 'Confirm the residence is in Home Watch Mode', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true, help_text: 'Home Watch Mode may include opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources as applicable.' },
      ]
    },
    {
      title: 'Storm Protection',
      sort_order: 6,
      icon: 'Cloud',
      items: [
        { label: 'Exercise electric storm shutters and confirm all OK', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true, help_text: 'Do not exercise shutters if they have permanent bars or pins that prevent opening. This should be customizable by client/property.' },
        { label: 'Confirm shutter wall switch is in neutral position and all OK, or shutter remote control tested', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
      ]
    },
    {
      title: 'Garage',
      sort_order: 7,
      icon: 'Car',
      items: [
        { label: 'Check visible ceiling, walls, and baseboards for signs of damage', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Exercise the garage door', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Check breaker box', sort_order: 3, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
      ]
    },
    {
      title: 'Departure',
      sort_order: 8,
      icon: 'LogOut',
      items: [
        { label: 'Thermostat(s) returned to proper setting', sort_order: 1, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Turn water OFF at the main supply valve slowly and gingerly', sort_order: 2, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: true },
        { label: 'Photo of water valve in OFF position', sort_order: 3, response_type: 'photo_only', required: false },
        { label: 'Security system set', sort_order: 4, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: false },
        { label: 'Doors locked', sort_order: 5, response_type: 'ok_issue_na', allow_issue_note: true, allow_issue_photo: false },
      ]
    },
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (!members.length) {
      return Response.json({ error: 'No company found' }, { status: 400 });
    }

    const company_id = members[0].company_id;

    // Create template
    const template = await base44.entities.ChecklistTemplate.create({
      ...CHECKLIST_DATA,
      company_id,
      active: true
    });

    // Create sections and items
    for (const section of CHECKLIST_DATA.sections) {
      const sectionData = await base44.entities.ChecklistTemplateSection.create({
        template_id: template.id,
        title: section.title,
        sort_order: section.sort_order,
        icon: section.icon,
        collapsible: true
      });

      // Create items for this section
      for (const item of section.items) {
        await base44.entities.ChecklistTemplateItem.create({
          section_id: sectionData.id,
          label: item.label,
          response_type: item.response_type,
          sort_order: item.sort_order,
          required: item.required || false,
          allow_issue_note: item.allow_issue_note || false,
          allow_issue_photo: item.allow_issue_photo || false,
          help_text: item.help_text || null,
          placeholder: item.placeholder || null
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Single Family Home Watch Visit template seeded',
      template_id: template.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});