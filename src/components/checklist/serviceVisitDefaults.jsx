// Default section structures for the 8 new service visit type templates

export const ARRIVAL_DEPARTURE_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '' },
      { label: 'Time', responseType: 'instruction_only', instructions: '' },
      { label: 'Purpose', responseType: 'instruction_only', instructions: 'Pre-Arrival or Post-Departure', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Services & Observations',
    items: [
      { label: 'Services Performed', responseType: 'ok_issue_na', instructions: 'Check all services completed', require_note: false, require_photo: false },
      { label: 'General Observations', responseType: 'ok_issue_na', instructions: 'Document property condition', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Items Not Completed',
    items: [
      { label: 'Anything Not Completed', responseType: 'ok_issue_na', instructions: 'Optional - note any incomplete items', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Photos',
    items: [
      { label: 'Property Photos', responseType: 'photo_only', instructions: 'Optional - capture property conditions', require_note: false, require_photo: false }
    ]
  }
];

export const ACCESS_VISIT_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '' },
      { label: 'Time In', responseType: 'instruction_only', instructions: '' },
      { label: 'Time Out', responseType: 'instruction_only', instructions: '' }
    ]
  },
  {
    title: 'Vendor Information',
    items: [
      { label: 'Vendor Name', responseType: 'instruction_only', instructions: 'Company or individual name', require_note: false, require_photo: false },
      { label: 'Vendor Company', responseType: 'instruction_only', instructions: 'Business entity', require_note: false, require_photo: false },
      { label: 'Purpose of Visit', responseType: 'ok_issue_na', instructions: 'Document vendor purpose', require_note: true, require_photo: false },
      { label: 'Reporter Present', responseType: 'ok_issue_na', instructions: 'Yes / No', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Observations',
    items: [
      { label: 'Observations Before', responseType: 'ok_issue_na', instructions: 'Property condition prior to vendor work', require_note: true, require_photo: true },
      { label: 'Observations After', responseType: 'ok_issue_na', instructions: 'Property condition after vendor work', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: true, require_photo: true }
    ]
  }
];

export const EMERGENCY_VISIT_SECTIONS = [
  {
    title: 'Emergency Trigger',
    items: [
      { label: 'Trigger', responseType: 'instruction_only', instructions: 'Alarm, client request, storm, etc.', require_note: true, require_photo: false },
      { label: 'Date Received', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Time Received', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Time On Site', responseType: 'instruction_only', instructions: 'Arrival time at property', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Initial Assessment',
    items: [
      { label: 'Initial Observations', responseType: 'ok_issue_na', instructions: 'Property condition upon arrival', require_note: true, require_photo: true },
      { label: 'Actions Taken', responseType: 'ok_issue_na', instructions: 'Document all actions performed', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Who Was Contacted', responseType: 'instruction_only', instructions: 'List all people/entities contacted', require_note: true, require_photo: false },
      { label: 'Follow-up Required', responseType: 'ok_issue_na', instructions: 'Yes / No', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: true, require_photo: true }
    ]
  }
];

export const DAMAGE_RECOVERY_SECTIONS = [
  {
    title: 'Issue Documentation',
    items: [
      { label: 'Date Opened', responseType: 'instruction_only', instructions: 'Date issue identified', require_note: false, require_photo: false },
      { label: 'Type of Issue', responseType: 'instruction_only', instructions: 'Category of damage', require_note: false, require_photo: false },
      { label: 'Description of Condition', responseType: 'ok_issue_na', instructions: 'Detailed condition description', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Recovery Timeline',
    items: [
      { label: 'Timeline Notes', responseType: 'instruction_only', instructions: 'Ongoing entries documenting recovery progress', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Vendors & Status',
    items: [
      { label: 'Vendors Involved', responseType: 'instruction_only', instructions: 'List contractors/vendors working on recovery', require_note: true, require_photo: false },
      { label: 'Recovery Status', responseType: 'ok_issue_na', instructions: 'Active / Monitoring / Resolved', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Photos',
    items: [
      { label: 'Progress Photos', responseType: 'photo_only', instructions: 'Document recovery progress - organized by date', require_note: true, require_photo: false }
    ]
  }
];

export const AUTO_CARE_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Vehicle', responseType: 'instruction_only', instructions: 'Make, model, year', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Mileage & Duration',
    items: [
      { label: 'Start Mileage', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'End Mileage', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Duration of Drive', responseType: 'instruction_only', instructions: 'Hours spent on drive', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Vehicle Assessment',
    items: [
      { label: 'Dashboard Alerts', responseType: 'ok_issue_na', instructions: 'Note any warning lights or alerts', require_note: true, require_photo: true },
      { label: 'General Observations', responseType: 'ok_issue_na', instructions: 'Overall vehicle condition', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: true, require_photo: true }
    ]
  }
];

export const POST_STORM_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Time', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Weather & Conditions',
    items: [
      { label: 'Weather Conditions', responseType: 'instruction_only', instructions: 'Current conditions at time of visit', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Property Assessment',
    items: [
      { label: 'Exterior Observations', responseType: 'ok_issue_na', instructions: 'Roof, siding, windows, outdoor structures', require_note: true, require_photo: true },
      { label: 'Interior Observations', responseType: 'ok_issue_na', instructions: 'Water intrusion, damage, conditions', require_note: true, require_photo: true },
      { label: 'Visible Changes Since Last Visit', responseType: 'ok_issue_na', instructions: 'Document any changes or new damage', require_note: true, require_photo: true }
    ]
  },
  {
    title: 'Actions',
    items: [
      { label: 'Actions Taken', responseType: 'ok_issue_na', instructions: 'Any immediate mitigation performed', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: true, require_photo: true }
    ]
  }
];

export const CLIENT_SERVICE_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Time', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Request & Services',
    items: [
      { label: 'Request Description', responseType: 'instruction_only', instructions: 'Detailed client request', require_note: true, require_photo: false },
      { label: 'Services Performed', responseType: 'ok_issue_na', instructions: 'Document all services completed', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Outcome',
    items: [
      { label: 'Outcome', responseType: 'ok_issue_na', instructions: 'Result of services provided', require_note: true, require_photo: true },
      { label: 'Follow-up Required', responseType: 'ok_issue_na', instructions: 'Yes / No', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'No visible issue / Issue observed / Not observed', require_note: false, require_photo: false }
    ]
  }
];

export const CONCIERGE_SERVICE_SECTIONS = [
  {
    title: 'Visit Details',
    items: [
      { label: 'Date', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false },
      { label: 'Time', responseType: 'instruction_only', instructions: '', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Service Type',
    items: [
      { label: 'Service Type', responseType: 'instruction_only', instructions: 'Package handling / Delivery coordination / Guest access / Other', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Service Details',
    items: [
      { label: 'Description of Service Performed', responseType: 'ok_issue_na', instructions: 'Detailed description of concierge service', require_note: true, require_photo: false },
      { label: 'Outcome', responseType: 'ok_issue_na', instructions: 'Result of service provided', require_note: true, require_photo: false }
    ]
  },
  {
    title: 'Issue Status',
    items: [
      { label: 'Overall Status', responseType: 'ok_issue_na', instructions: 'If applicable - No issue / Issue observed / Not applicable', require_note: false, require_photo: false }
    ]
  },
  {
    title: 'Photos',
    items: [
      { label: 'Service Photos', responseType: 'photo_only', instructions: 'Optional - capture service details', require_note: false, require_photo: false }
    ]
  }
];