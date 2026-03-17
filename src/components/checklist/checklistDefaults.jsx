export const SFH_SECTIONS = [
  {
    title: 'Upon Arrival / Exterior Check',
    items: [
      { label: 'Check mailbox, remove newspapers, forward mail if requested', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Exterior check of landscape for brown spots or dead plants', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of rodents, insects or other critters', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn the water ON at the main supply valve, slowly and gingerly, and confirm all OK', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Pool water level checked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Pool equipment checked', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Interior Check',
    items: [
      { label: 'Disarm security system', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Test the phone line', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Water Zone Home Watch Method',
    items: [
      { label: 'Short cycle on the dishwasher, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Operate the garbage disposal, check for proper operation and leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Short cycle on the washing machine, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Operate clothes dryer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Run water in sinks, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check the refrigerator and freezer temperature and proper operation', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Ice maker emptied and OFF', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Perishable and frozen foods removed from fridge and freezer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check wine cooler or wine room for proper temperature and operation', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Wine cooler / wine room temperature', responseType: 'number', instructions: '' },
      { label: 'Run water in showers and tubs, checking for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Brush and flush toilets, check for visible leaks and signs of water damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check the water heater for signs of leaks and rust', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Water heater type and notes', responseType: 'water_heater', instructions: '' },
    ],
  },
  {
    title: 'AC System',
    items: [
      { label: 'Record temperature in main room', responseType: 'number', instructions: '' },
      { label: 'Record humidity in main room', responseType: 'percentage', instructions: '' },
      { label: 'Lower thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC is blowing cold air', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC filters checked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for visible leaks or water in the secondary pan, if accessible', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Observe and Report',
    items: [
      { label: 'Confirm the residence is in Home Watch Mode', responseType: 'ok_issue_na', instructions: 'Home Watch Mode may include opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources as applicable.' },
    ],
  },
  {
    title: 'Storm Protection',
    items: [
      { label: 'Exercise electric storm shutters and confirm all OK', responseType: 'ok_issue_na', instructions: 'Do not exercise shutters if they have permanent bars or pins that prevent opening.' },
      { label: 'Confirm shutter wall switch is in neutral position and all OK, or shutter remote control tested', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Garage',
    items: [
      { label: 'Check visible ceiling, walls, and baseboards for signs of damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Exercise the garage door', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check breaker box', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Departure',
    items: [
      { label: 'Thermostat(s) returned to proper setting', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn water OFF at the main supply valve slowly and gingerly', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Photo of water valve in OFF position', responseType: 'photo_only', instructions: '' },
      { label: 'Security system set', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Doors locked', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
];

export const CONDO_SECTIONS = [
  {
    title: 'Upon Arrival',
    items: [
      { label: 'Check mailbox, remove newspapers, forward mail if requested', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Exterior check of landscape for brown spots or dead plants', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of rodents, insects, or other critters', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn the water ON at the main supply valve, slowly and gingerly', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Visual exterior check including windows, roof from the ground, screens, AC unit, pavers, and pool cage', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Pool and Spa',
    items: [
      { label: 'Pool water level checked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Pool equipment checked', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Interior Check',
    items: [
      { label: 'Disarm security system', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Test the phone line', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Water Zone Home Watch Method',
    items: [
      { label: 'Short cycle on the dishwasher, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Run the garbage disposal, check for proper operation and visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Short cycle on the washing machine, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Operate clothes dryer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Run water in sinks, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check the refrigerator and freezer temp and for proper operation', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Ice maker emptied and OFF', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Perishable and frozen foods removed from fridge and freezer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check wine cooler or wine room for proper temp, signs of water, moisture, or condensation', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Wine cooler / wine room temperature', responseType: 'number', instructions: '' },
      { label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', responseType: 'instruction_only', instructions: '' },
      { label: 'Run water in showers and tubs, checking for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', responseType: 'instruction_only', instructions: '' },
      { label: 'Brush and flush toilets, check for visible leaks and signs of water damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check water heater for signs of visible leaks and rust', responseType: 'ok_issue_na', instructions: 'Water heater should be OFF at the breaker or set to Vacation Mode. Circulator pump must be OFF.' },
      { label: 'Water heater type and notes', responseType: 'water_heater', instructions: '' },
    ],
  },
  {
    title: 'AC System',
    items: [
      { label: 'Main room temperature', responseType: 'number', instructions: '' },
      { label: 'Main room humidity', responseType: 'percentage', instructions: '' },
      { label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC is blowing cold air', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC filters, if accessible, checked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Observe and Report',
    items: [
      { label: 'Check visible ceilings for signs of water intrusion or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check visible walls for signs of water intrusion or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check visible baseboards for signs of water or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check or test electronics only if requested by homeowner', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check windows and sliders for damage or leaks, and make sure locked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Ceiling fans are ON', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of insects or rodents', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check furniture for any irregularities', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Is the residence in Home Watch Mode', responseType: 'ok_issue_na', instructions: 'Home Watch Mode includes opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources.' },
    ],
  },
  {
    title: 'Storm Protection',
    items: [
      { label: 'Everything about storm protection will need to be customized for the property', responseType: 'instruction_only', instructions: '' },
      { label: 'Exercise electric storm shutters', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Garage',
    items: [
      { label: 'Check visible ceiling, walls, and baseboards for signs of damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Exercise the garage door', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check breaker box', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Departure',
    items: [
      { label: 'Always take a few moments before leaving the home to listen for unusual sounds', responseType: 'instruction_only', instructions: '' },
      { label: 'Thermostat(s) returned to proper setting', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn water OFF at the main supply valve, slowly and gingerly, water lines drained', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Photo of water valve in the OFF position', responseType: 'photo_only', instructions: '' },
      { label: 'Security system armed', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Doors locked', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
];

export const HIGHRISE_SECTIONS = [
  {
    title: 'Upon Arrival',
    items: [
      { label: 'Check mailbox, remove newspapers, forward mail if requested', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of rodents, insects, or other critters in common areas', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn the water ON at the main supply valve, slowly and gingerly', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Visual exterior check of balcony including windows, screens, and sliders', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Interior Check',
    items: [
      { label: 'Disarm security system', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Test the phone line', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check balcony/lanai for debris or damage', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Water Zone Home Watch Method',
    items: [
      { label: 'Short cycle on the dishwasher, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Run the garbage disposal, check for proper operation and visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Short cycle on the washing machine, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Operate clothes dryer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Run water in sinks, check for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check the refrigerator and freezer temp and for proper operation', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Ice maker emptied and OFF', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Perishable and frozen foods removed from fridge and freezer', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Bathrooms: Always careful and mindful of splashing water on glass enclosures', responseType: 'instruction_only', instructions: '' },
      { label: 'Run water in showers and tubs, checking for visible leaks', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Always mindful of the valve at the wall as well as any discoloration of the tile grout', responseType: 'instruction_only', instructions: '' },
      { label: 'Brush and flush toilets, check for visible leaks and signs of water damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check water heater for signs of visible leaks and rust', responseType: 'ok_issue_na', instructions: 'Water heater should be OFF at the breaker or set to Vacation Mode.' },
      { label: 'Water heater type and notes', responseType: 'water_heater', instructions: '' },
    ],
  },
  {
    title: 'AC System',
    items: [
      { label: 'Main room temperature', responseType: 'number', instructions: '' },
      { label: 'Main room humidity', responseType: 'percentage', instructions: '' },
      { label: 'Lower the thermostat(s) by a couple of degrees. Confirm AC system is set to Auto-Cool', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC is blowing cold air', responseType: 'ok_issue_na', instructions: '' },
      { label: 'AC filters, if accessible, checked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of visible leaks or water in the secondary pan, if accessible', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Observe and Report',
    items: [
      { label: 'Check visible ceilings for signs of water intrusion or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check visible walls for signs of water intrusion or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check visible baseboards for signs of water or other damage', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check windows and sliders for damage or leaks, and make sure locked', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Ceiling fans are ON', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check or test electronics only if requested by homeowner', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Check for signs of insects or rodents', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Is the residence in Home Watch Mode', responseType: 'ok_issue_na', instructions: 'Home Watch Mode includes opening interior room doors and closets for air circulation, bathroom brush across bowl to dry, and cabinet doors open at water sources.' },
    ],
  },
  {
    title: 'Storm Protection',
    items: [
      { label: 'Everything about storm protection will need to be customized for the property', responseType: 'instruction_only', instructions: '' },
      { label: 'Exercise electric storm shutters', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Confirm shutter wall switch is neutral and operating properly, or shutter remote control tested', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
  {
    title: 'Departure',
    items: [
      { label: 'Always take a few moments before leaving to listen for unusual sounds', responseType: 'instruction_only', instructions: '' },
      { label: 'Thermostat(s) returned to proper setting', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Turn water OFF at the main supply valve, slowly and gingerly', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Photo of water valve in the OFF position', responseType: 'photo_only', instructions: '' },
      { label: 'Security system armed', responseType: 'ok_issue_na', instructions: '' },
      { label: 'Doors locked', responseType: 'ok_issue_na', instructions: '' },
    ],
  },
];