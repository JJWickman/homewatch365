import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── Home Watch Templates ────────────────────────────────────────────────────

const HOME_WATCH_TEMPLATES = [
  {
    meta: {
      name: 'Single Family Home',
      code: 'single_family_standard',
      property_type: 'single_family',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for single family homes',
      version: 1, active: true
    },
    sections: [
      { title: 'Upon Arrival / Exterior Check', sort_order: 1, icon: 'Home' },
      { title: 'Interior Check', sort_order: 2, icon: 'DoorOpen' },
      { title: 'Water Zone Home Watch Method', sort_order: 3, icon: 'Droplet' },
      { title: 'AC System', sort_order: 4, icon: 'Wind' },
      { title: 'Observe and Report', sort_order: 5, icon: 'Eye' },
      { title: 'Storm Protection', sort_order: 6, icon: 'Cloud' },
      { title: 'Garage', sort_order: 7, icon: 'Car' },
      { title: 'Departure', sort_order: 8, icon: 'LogOut' }
    ],
    items: [
      { section: 0, label: 'Check mailbox, remove newspapers, forward mail if requested', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Exterior check of landscape for brown spots or dead plants', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Check for signs of rodents, insects or other critters', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Turn the water ON at the main supply valve, slowly and gingerly, and confirm all OK', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Pool water level checked', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Pool equipment checked', sort_order: 7, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Disarm security system', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Test the phone line', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 2, label: 'Short cycle on the dishwasher, check for visible leaks', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Operate the garbage disposal, check for proper operation and leaks', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Short cycle on the washing machine, check for visible leaks', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Operate clothes dryer', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 2, label: 'Run water in sinks, check for visible leaks', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Check the refrigerator and freezer temperature and proper operation', sort_order: 6, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Ice maker emptied and OFF', sort_order: 7, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Perishable and frozen foods removed from fridge and freezer', sort_order: 8, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Check wine cooler or wine room for proper temperature and operation', sort_order: 9, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Wine cooler / wine room temperature', sort_order: 10, response_type: 'number', required: false, metadata_json: { unit: 'F' } },
      { section: 2, label: 'Run water in showers and tubs, checking for visible leaks', sort_order: 11, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Brush and flush toilets, check for visible leaks and signs of water damage', sort_order: 12, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Check the water heater for signs of leaks and rust', sort_order: 13, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Record temperature in main room', sort_order: 1, response_type: 'number', required: false, placeholder: 'Enter temperature (°F)', metadata_json: { unit: 'F' } },
      { section: 3, label: 'Record humidity in main room', sort_order: 2, response_type: 'percentage', required: false, placeholder: 'Enter humidity (%)', metadata_json: { unit: '%' } },
      { section: 3, label: 'Lower thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'AC is blowing cold air', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'AC filters checked', sort_order: 5, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Check for visible leaks or water in the secondary pan, if accessible', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Confirm the residence is in Home Watch Mode', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Exercise electric storm shutters and confirm all OK', sort_order: 1, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Confirm shutter wall switch is in neutral position and all OK, or shutter remote control tested', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Check visible ceiling, walls, and baseboards for signs of damage', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Exercise the garage door', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Check breaker box', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Thermostat(s) returned to proper setting', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Turn water OFF at the main supply valve slowly and gingerly', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Photo of water valve in OFF position', sort_order: 3, response_type: 'photo_only', required: true, allow_note: false, allow_photo: true },
      { section: 7, label: 'Security system set', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 7, label: 'Doors locked', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true },
    ]
  },
  {
    meta: {
      name: 'Condo/Villa',
      code: 'condo_villa_standard',
      property_type: 'condo_villa',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for condos and villas',
      version: 1, active: true
    },
    sections: [
      { title: 'Upon Arrival', sort_order: 1, icon: 'MapPin' },
      { title: 'Pool and Spa', sort_order: 2, icon: 'Waves' },
      { title: 'Interior Check', sort_order: 3, icon: 'Home' },
      { title: 'Water Zone Home Watch Method', sort_order: 4, icon: 'Droplets' },
      { title: 'AC System', sort_order: 5, icon: 'Wind' },
      { title: 'Observe and Report', sort_order: 6, icon: 'Eye' },
      { title: 'Storm Protection', sort_order: 7, icon: 'CloudLightning' },
      { title: 'Garage', sort_order: 8, icon: 'Car' },
      { title: 'Departure', sort_order: 9, icon: 'LogOut' }
    ],
    items: [
      { section: 0, label: 'Check mailbox, remove newspapers, forward mail if requested, etc.', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Exterior check of landscape for brown spots or dead plants', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Check for signs of rodents, insects, or other critters', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Turn the water ON at the main supply valve, slowly and gingerly', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Pool water level checked', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Pool equipment checked', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Disarm security system', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Test the phone line', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Short cycle on the dishwasher, check for visible leaks', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Run the garbage disposal, check for proper operation and visible leaks', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Short cycle on the washing machine, check for visible leaks', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Operate clothes dryer', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 3, label: 'Run water in sinks, check for visible leaks', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Check the refrigerator and freezer temp and for proper operation', sort_order: 6, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Ice maker emptied and OFF', sort_order: 7, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Perishable and frozen foods removed from fridge and freezer', sort_order: 8, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Check wine cooler or wine room for proper temp, signs of water, moisture, or condensation', sort_order: 9, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Wine cooler / wine room temperature', sort_order: 10, response_type: 'number', required: false, metadata_json: { unit: 'F' } },
      { section: 3, label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', sort_order: 11, response_type: 'instruction_only', required: false },
      { section: 3, label: 'Run water in showers and tubs, checking for visible leaks', sort_order: 12, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', sort_order: 13, response_type: 'instruction_only', required: false },
      { section: 3, label: 'Brush and flush toilets, check for visible leaks and signs of water damage', sort_order: 14, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Water heater should be OFF at the breaker or set to Vacation Mode. Circulator pump must be OFF.', sort_order: 15, response_type: 'instruction_only', required: false },
      { section: 3, label: 'Check water heater for signs of visible leaks and rust', sort_order: 16, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Main room temperature', sort_order: 1, response_type: 'number', required: false, placeholder: 'Enter temperature', metadata_json: { unit: 'F' } },
      { section: 4, label: 'Main room humidity', sort_order: 2, response_type: 'percentage', required: false, placeholder: 'Enter humidity %', metadata_json: { unit: '%' } },
      { section: 4, label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'AC is blowing cold air', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'AC filters, if accessible, checked', sort_order: 5, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check visible ceilings for signs of water intrusion or other damage', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check visible walls for signs of water intrusion or other damage', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check visible baseboards for signs of water or other damage', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check or test electronics only if requested by homeowner', sort_order: 4, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check windows and sliders for damage or leaks, and make sure locked', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Ceiling fans are ON', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 5, label: 'Check for signs of insects or rodents', sort_order: 7, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Check furniture for any irregularities', sort_order: 8, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Is the residence in Home Watch Mode', sort_order: 9, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Everything about storm protection will need to be customized for the property', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 6, label: 'Exercise electric storm shutters', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested', sort_order: 3, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Check visible ceiling, walls, and baseboards for signs of damage', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Exercise the garage door', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 7, label: 'Check breaker box', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 8, label: 'Always take a few moments before leaving to listen for unusual sounds', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 8, label: 'Thermostat(s) returned to proper setting', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 8, label: 'Turn water OFF at the main supply valve, slowly and gingerly, water lines drained', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 8, label: 'Photo of water valve in the OFF position', sort_order: 4, response_type: 'photo_only', required: true, allow_note: false, allow_photo: true },
      { section: 8, label: 'Security system armed', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 8, label: 'Doors locked', sort_order: 6, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true }
    ]
  },
  {
    meta: {
      name: 'High-Rise',
      code: 'high_rise_standard',
      property_type: 'high_rise',
      category: 'home_watch_visit',
      description: 'Standard home watch visit checklist for high-rise properties',
      version: 1, active: true
    },
    sections: [
      { title: 'Upon Arrival', sort_order: 1, icon: 'Building2' },
      { title: 'Interior Check', sort_order: 2, icon: 'Home' },
      { title: 'Water Zone Home Watch Method', sort_order: 3, icon: 'Droplets' },
      { title: 'AC System', sort_order: 4, icon: 'Wind' },
      { title: 'Observe and Report', sort_order: 5, icon: 'Eye' },
      { title: 'Storm Protection', sort_order: 6, icon: 'CloudLightning' },
      { title: 'Departure', sort_order: 7, icon: 'LogOut' }
    ],
    items: [
      { section: 0, label: 'Check mailbox, remove newspapers, forward mail if requested', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Check for signs of rodents, insects, or other critters in common areas', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Turn the water ON at the main supply valve, slowly and gingerly', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 0, label: 'Visual exterior check of balcony including windows, screens, and sliders', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Disarm security system', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Test the phone line', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 1, label: 'Check balcony/lanai for debris or damage', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Short cycle on the dishwasher, check for visible leaks', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Run the garbage disposal, check for proper operation and visible leaks', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Short cycle on the washing machine, check for visible leaks', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Operate clothes dryer', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 2, label: 'Run water in sinks, check for visible leaks', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Check the refrigerator and freezer temp and for proper operation', sort_order: 6, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Ice maker emptied and OFF', sort_order: 7, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Perishable and frozen foods removed from fridge and freezer', sort_order: 8, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', sort_order: 9, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Run water in showers and tubs, checking for visible leaks', sort_order: 10, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', sort_order: 11, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Brush and flush toilets, check for visible leaks and signs of water damage', sort_order: 12, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Water heater should be OFF at the breaker or set to Vacation Mode.', sort_order: 13, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Check water heater for signs of visible leaks and rust', sort_order: 14, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Main room temperature', sort_order: 1, response_type: 'number', required: false, placeholder: 'Enter temperature', metadata_json: { unit: 'F' } },
      { section: 3, label: 'Main room humidity', sort_order: 2, response_type: 'percentage', required: false, placeholder: 'Enter humidity %', metadata_json: { unit: '%' } },
      { section: 3, label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'AC is blowing cold air', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'AC filters, if accessible, checked', sort_order: 5, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check visible ceilings for signs of water intrusion or other damage', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check visible walls for signs of water intrusion or other damage', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check visible baseboards for signs of water or other damage', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check windows and sliders for damage or leaks, and make sure locked', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Ceiling fans are ON', sort_order: 5, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 4, label: 'Check or test electronics only if requested by homeowner', sort_order: 6, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Check for signs of insects or rodents', sort_order: 7, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Is the residence in Home Watch Mode', sort_order: 8, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Everything about storm protection will need to be customized for the property', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 5, label: 'Exercise electric storm shutters', sort_order: 2, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 5, label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested', sort_order: 3, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Always take a few moments before leaving to listen for unusual sounds', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 6, label: 'Thermostat(s) returned to proper setting', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Turn water OFF at the main supply valve, slowly and gingerly', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 6, label: 'Photo of water valve in the OFF position', sort_order: 4, response_type: 'photo_only', required: true, allow_note: false, allow_photo: true },
      { section: 6, label: 'Security system armed', sort_order: 5, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true },
      { section: 6, label: 'Doors locked', sort_order: 6, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: true }
    ]
  }
];

// ─── Service Visit Templates ─────────────────────────────────────────────────

const SERVICE_VISIT_TEMPLATES = [
  {
    meta: { name: 'Arrival / Departure Visit', code: 'arrival_departure_standard', property_type: null, category: 'arrival_departure', description: 'Checklist for arrival and departure visits', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Calendar' },
      { title: 'Services & Observations', sort_order: 2, icon: 'ClipboardCheck' },
      { title: 'Items Not Completed', sort_order: 3, icon: 'AlertCircle' },
      { title: 'Issue Status', sort_order: 4, icon: 'Eye' },
      { title: 'Photos', sort_order: 5, icon: 'Camera' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Purpose (Pre-Arrival or Post-Departure)', sort_order: 3, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Services Performed', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 1, label: 'General Observations', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 2, label: 'Anything Not Completed', sort_order: 1, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 4, label: 'Property Photos', sort_order: 1, response_type: 'photo_only', required: false, allow_note: false, allow_photo: true }
    ]
  },
  {
    meta: { name: 'Access Visit', code: 'access_visit_standard', property_type: null, category: 'access_visit', description: 'Checklist for vendor/contractor access visits', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Clock' },
      { title: 'Vendor Information', sort_order: 2, icon: 'Briefcase' },
      { title: 'Observations', sort_order: 3, icon: 'Eye' },
      { title: 'Issue Status', sort_order: 4, icon: 'AlertCircle' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time In', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time Out', sort_order: 3, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Vendor Name', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Vendor Company', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Purpose of Visit', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 1, label: 'Reporter Present', sort_order: 4, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: false, allow_photo: false, allow_severity: false },
      { section: 2, label: 'Observations Before', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Observations After', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true }
    ]
  },
  {
    meta: { name: 'Emergency Visit', code: 'emergency_visit_standard', property_type: null, category: 'emergency_visit', description: 'Checklist for emergency property visits', version: 1, active: true },
    sections: [
      { title: 'Emergency Trigger', sort_order: 1, icon: 'AlertTriangle' },
      { title: 'Initial Assessment', sort_order: 2, icon: 'ClipboardCheck' },
      { title: 'Notifications', sort_order: 3, icon: 'Bell' },
      { title: 'Issue Status', sort_order: 4, icon: 'Eye' }
    ],
    items: [
      { section: 0, label: 'Trigger (Alarm, client request, storm, etc.)', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Date Received', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time Received', sort_order: 3, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time On Site', sort_order: 4, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Initial Observations', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Actions Taken', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Who Was Contacted', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Follow-up Required', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true }
    ]
  },
  {
    meta: { name: 'Damage Recovery', code: 'damage_recovery_standard', property_type: null, category: 'damage_recovery', description: 'Ongoing damage recovery tracking checklist', version: 1, active: true },
    sections: [
      { title: 'Issue Documentation', sort_order: 1, icon: 'FileText' },
      { title: 'Recovery Timeline', sort_order: 2, icon: 'Clock' },
      { title: 'Vendors & Status', sort_order: 3, icon: 'Briefcase' },
      { title: 'Photos', sort_order: 4, icon: 'Camera' }
    ],
    items: [
      { section: 0, label: 'Date Opened', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Type of Issue', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Description of Condition', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 1, label: 'Timeline Notes', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Vendors Involved', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Recovery Status (Active / Monitoring / Resolved)', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Progress Photos', sort_order: 1, response_type: 'photo_only', required: false, allow_note: true, allow_photo: true }
    ]
  },
  {
    meta: { name: 'Auto Care Visit', code: 'auto_care_standard', property_type: null, category: 'auto_care', description: 'Checklist for vehicle care visits', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Car' },
      { title: 'Mileage & Duration', sort_order: 2, icon: 'Gauge' },
      { title: 'Vehicle Assessment', sort_order: 3, icon: 'Eye' },
      { title: 'Issue Status', sort_order: 4, icon: 'AlertCircle' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Vehicle (Make, model, year)', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Start Mileage', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 1, label: 'End Mileage', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Duration of Drive (hours)', sort_order: 3, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Dashboard Alerts', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'General Observations', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true }
    ]
  },
  {
    meta: { name: 'Post-Storm Visit', code: 'post_storm_standard', property_type: null, category: 'post_storm', description: 'Checklist for post-storm property assessment', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Calendar' },
      { title: 'Weather & Conditions', sort_order: 2, icon: 'CloudRain' },
      { title: 'Property Assessment', sort_order: 3, icon: 'Home' },
      { title: 'Actions', sort_order: 4, icon: 'ClipboardCheck' },
      { title: 'Issue Status', sort_order: 5, icon: 'AlertCircle' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Weather Conditions at time of visit', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Exterior Observations (roof, siding, windows, outdoor structures)', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Interior Observations (water intrusion, damage, conditions)', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 2, label: 'Visible Changes Since Last Visit', sort_order: 3, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: true, allow_severity: true },
      { section: 3, label: 'Actions Taken', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: true, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 4, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: true }
    ]
  },
  {
    meta: { name: 'Client Service Visit', code: 'client_service_standard', property_type: null, category: 'client_service', description: 'Checklist for client service visits', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Calendar' },
      { title: 'Request & Services', sort_order: 2, icon: 'ClipboardCheck' },
      { title: 'Outcome', sort_order: 3, icon: 'CheckCircle' },
      { title: 'Issue Status', sort_order: 4, icon: 'Eye' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Request Description', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Services Performed', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 2, label: 'Outcome', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: true, allow_severity: false },
      { section: 2, label: 'Follow-up Required', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: false, allow_photo: false, allow_severity: false }
    ]
  },
  {
    meta: { name: 'Concierge Service Visit', code: 'concierge_service_standard', property_type: null, category: 'concierge', description: 'Checklist for concierge service visits', version: 1, active: true },
    sections: [
      { title: 'Visit Details', sort_order: 1, icon: 'Calendar' },
      { title: 'Service Type', sort_order: 2, icon: 'Star' },
      { title: 'Service Details', sort_order: 3, icon: 'ClipboardCheck' },
      { title: 'Issue Status', sort_order: 4, icon: 'Eye' },
      { title: 'Photos', sort_order: 5, icon: 'Camera' }
    ],
    items: [
      { section: 0, label: 'Date', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 0, label: 'Time', sort_order: 2, response_type: 'instruction_only', required: false },
      { section: 1, label: 'Service Type (Package handling / Delivery coordination / Guest access / Other)', sort_order: 1, response_type: 'instruction_only', required: false },
      { section: 2, label: 'Description of Service Performed', sort_order: 1, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 2, label: 'Outcome', sort_order: 2, response_type: 'ok_issue_na', required: true, allow_na: false, allow_note: true, allow_photo: false, allow_severity: false },
      { section: 3, label: 'Overall Status', sort_order: 1, response_type: 'ok_issue_na', required: false, allow_na: true, allow_note: false, allow_photo: false, allow_severity: false },
      { section: 4, label: 'Service Photos', sort_order: 1, response_type: 'photo_only', required: false, allow_note: false, allow_photo: true }
    ]
  }
];

// New tenants get the 3 core home watch templates + 8 service-specific templates
const ALL_TEMPLATES = [...HOME_WATCH_TEMPLATES, ...SERVICE_VISIT_TEMPLATES];

// ─── Core seeding function ────────────────────────────────────────────────────

async function seedTemplateForCompany(base44client, company_id, tenant_id) {
  const results = [];

  for (const tmpl of ALL_TEMPLATES) {
    // Skip if already exists
    const existingQuery = tenant_id
      ? { code: tmpl.meta.code, tenant_id }
      : { code: tmpl.meta.code, company_id };
    const existing = await base44client.entities.ChecklistTemplate.filter(existingQuery);
    if (existing.length > 0) {
      results.push({ name: tmpl.meta.name, status: 'skipped' });
      continue;
    }

    const template = await base44client.entities.ChecklistTemplate.create({
      ...tmpl.meta,
      company_id: company_id || null,
      tenant_id: tenant_id || null
    });

    // Create sections and build index map
    const sectionMap = {};
    for (const section of tmpl.sections) {
      const created = await base44client.entities.ChecklistTemplateSection.create({
        template_id: template.id,
        ...section
      });
      sectionMap[section.sort_order - 1] = created.id;
    }

    // Create items
    for (const item of tmpl.items) {
      const { section, ...itemData } = item;
      await base44client.entities.ChecklistTemplateItem.create({
        template_id: template.id,
        section_id: sectionMap[section],
        ...itemData
      });
    }

    results.push({ name: tmpl.meta.name, status: 'created', template_id: template.id });
  }

  return results;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const company_id = payload.company_id || payload.data?.id || null;
    const tenant_id = payload.tenant_id || null;

    const results = await seedTemplateForCompany(base44.asServiceRole, company_id, tenant_id);

    return Response.json({
      success: true,
      message: 'Seeded 3 core templates for company/tenant',
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});