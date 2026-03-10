import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TEMPLATE_SCHEMA = {
  name: 'Single Family Home Checklist',
  description: 'Home Watch standard visit checklist for single family homes',
  type: 'standard',
  estimated_duration_minutes: 90,
  sections: [
    {
      name: 'Equipment Locations',
      order: 1,
      items: [
        { name: 'Water valve location', description: 'Note the location of water valve', order: 1, check_type: 'text', requires_note: true },
        { name: 'Breaker Box Location', description: 'Note the location of breaker box', order: 2, check_type: 'text', requires_note: true },
        { name: 'Water Heater Location', description: 'Note the location of water heater', order: 3, check_type: 'text', requires_note: true },
        { name: 'Air Handler Location', description: 'Note the location of air handler', order: 4, check_type: 'text', requires_note: true },
      ]
    },
    {
      name: 'Upon Arrival - Exterior Check',
      order: 2,
      items: [
        { name: 'Mailbox', description: 'Check mailbox, remove newspapers, forward mail if requested', order: 1, check_type: 'pass_fail' },
        { name: 'Landscape', description: 'Exterior check of landscape for brown spots or dead plants', order: 2, check_type: 'pass_fail' },
        { name: 'Rodents/Insects', description: 'Check for signs of rodents, insects or other critters', order: 3, check_type: 'pass_fail' },
        { name: 'Water Supply', description: 'Turn the water ON at the main supply valve, slowly and gingerly', order: 4, check_type: 'pass_fail' },
        { name: 'Exterior Visual', description: 'Visual exterior check including windows, roof, screens, AC unit, pavers and pool cage', order: 5, check_type: 'pass_fail', requires_photo: true },
        { name: 'Pool water level', description: 'Pool water level checked', order: 6, check_type: 'pass_fail' },
        { name: 'Pool equipment', description: 'Pool equipment checked', order: 7, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Upon Arrival - Interior Check',
      order: 3,
      items: [
        { name: 'Security system', description: 'Disarm security system', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Phone line', description: 'Test the phone line', order: 2, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Water Zone Home Watch Method',
      order: 4,
      items: [
        { name: 'Dishwasher', description: 'Short cycle on the dishwasher, check for visible leaks', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Garbage disposal', description: 'Operate the garbage disposal, check for proper operation and leaks', order: 2, check_type: 'pass_fail' },
        { name: 'Washing machine', description: 'Short cycle on the washing machine, check for visible leaks', order: 3, check_type: 'pass_fail' },
        { name: 'Clothes dryer', description: 'Operate clothes dryer', order: 4, check_type: 'pass_fail' },
        { name: 'Sinks', description: 'Run water in sinks, check for visible leaks', order: 5, check_type: 'pass_fail' },
        { name: 'Refrigerator/Freezer', description: 'Check the refrigerator and freezer temp and for proper operation', order: 6, check_type: 'pass_fail' },
        { name: 'Ice maker', description: 'Ice maker emptied and OFF', order: 7, check_type: 'pass_fail' },
        { name: 'Perishable foods', description: 'Perishable and frozen foods removed from fridge and freezer', order: 8, check_type: 'pass_fail' },
        { name: 'Wine cooler', description: 'Check wine cooler or wine room for proper temp and operation', order: 9, check_type: 'pass_fail' },
        { name: 'Showers/Tubs', description: 'Run water in showers and tubs, checking for visible leaks', order: 10, check_type: 'pass_fail', requires_photo: true },
        { name: 'Toilets', description: 'Brush and flush toilets, check for visible leaks and water damage', order: 11, check_type: 'pass_fail' },
        { name: 'Water heater', description: 'Check the water heater for signs of leaks and rust (should be OFF or Vacation Mode)', order: 12, check_type: 'pass_fail', requires_photo: true },
      ]
    },
    {
      name: 'AC System',
      order: 5,
      items: [
        { name: 'Temperature and humidity', description: 'Record temperature and humidity in main room', order: 1, check_type: 'text', requires_note: true },
        { name: 'Thermostat', description: 'Lower the thermostat by a couple of degrees. AC system set to Auto-Cool?', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'AC blowing cold', description: 'AC is blowing cold air', order: 3, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'AC filters', description: 'AC filters checked', order: 4, check_type: 'pass_fail' },
        { name: 'Secondary pan', description: 'Check for signs of visible leaks or water in the secondary pan', order: 5, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Observe and Report',
      order: 6,
      items: [
        { name: 'Home Watch Mode', description: 'Is the residence in Home Watch Mode? (doors/closets open for air circulation, etc)', order: 1, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Storm Protection',
      order: 7,
      items: [
        { name: 'Electric shutters', description: 'Exercise electric storm shutters and all OK?', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Shutter controls', description: 'Shutter wall switch in neutral position or shutter remote control tested', order: 2, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Garage',
      order: 8,
      items: [
        { name: 'Ceiling/Walls', description: 'Check visible ceiling, walls, baseboards for signs of damage', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Garage door', description: 'Exercise the garage door', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Breaker Box', description: 'Check Breaker Box', order: 3, check_type: 'pass_fail', requires_note: true, requires_photo: true },
      ]
    },
    {
      name: 'Departure',
      order: 9,
      items: [
        { name: 'Thermostat', description: 'Thermostat(s) returned to proper setting', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Water OFF', description: 'Turn water OFF at the main supply valve - slowly and gingerly', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Water valve OFF photo', description: 'Photo of water valve in the OFF position', order: 3, check_type: 'photo' },
        { name: 'Security system', description: 'Security system set', order: 4, check_type: 'pass_fail' },
        { name: 'Doors locked', description: 'Doors locked', order: 5, check_type: 'pass_fail' },
      ]
    },
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company from user's company membership
    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (!members.length) {
      return Response.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = members[0].company_id;

    // Check if template already exists
    const existing = await base44.entities.VisitTemplate.filter({
      company_id: companyId,
      name: 'Single Family Home Checklist'
    });

    if (existing.length > 0) {
      return Response.json({ message: 'Template already exists', template: existing[0] });
    }

    // Create the template
    const template = await base44.entities.VisitTemplate.create({
      ...TEMPLATE_SCHEMA,
      company_id: companyId
    });

    return Response.json({ success: true, template });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});