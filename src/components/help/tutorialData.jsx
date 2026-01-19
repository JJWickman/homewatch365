import { Users, Building2, ClipboardCheck, Calendar, UserPlus, Home, FileText, Route, MapPin, Navigation } from 'lucide-react';

export const tutorials = {
  createClient: {
    id: 'createClient',
    title: 'Creating a New Client',
    description: 'Learn how to add a new client to your system',
    category: 'Getting Started',
    duration: '3 min',
    icon: Users,
    steps: [
      {
        title: 'Navigate to Clients Page',
        description: 'Click on "Clients" in the sidebar navigation to access the clients management page.',
        icon: Users,
        tips: [
          'You can also use the search bar to quickly find existing clients',
          'The clients page shows all your active clients by default'
        ]
      },
      {
        title: 'Click "Add Client" Button',
        description: 'Look for the "Add Client" button in the top right corner of the clients page and click it.',
        icon: UserPlus,
        tips: [
          'Make sure you have the necessary permissions to add clients',
          'The form will open in a new view'
        ]
      },
      {
        title: 'Fill in Client Information',
        description: 'Enter the client\'s basic information including name, email, and phone number. All fields marked with * are required.',
        icon: FileText,
        tips: [
          'Email is required as clients will receive portal access',
          'Adding a phone number helps with communication',
          'You can add secondary contacts later'
        ]
      },
      {
        title: 'Add Address and Billing Details',
        description: 'Enter the client\'s primary address and set up their billing information including service tier and monthly rate.',
        icon: Home,
        tips: [
          'The address can be different from the property address',
          'Choose the appropriate service tier for the client',
          'Billing frequency can be monthly, quarterly, or annually'
        ]
      },
      {
        title: 'Review and Save',
        description: 'Review all the information you\'ve entered and click "Save" to create the client record.',
        icon: ClipboardCheck,
        tips: [
          'You can edit client information anytime after creation',
          'The client will automatically receive portal access',
          'You can now add properties for this client'
        ]
      }
    ]
  },

  createProperty: {
    id: 'createProperty',
    title: 'Adding a New Property',
    description: 'Step-by-step guide to add a property to the system',
    category: 'Getting Started',
    duration: '4 min',
    icon: Building2,
    steps: [
      {
        title: 'Go to Properties Page',
        description: 'Navigate to the Properties section using the sidebar menu to view all properties.',
        icon: Building2,
        tips: [
          'You can filter properties by client or status',
          'Use the search to find specific properties quickly'
        ]
      },
      {
        title: 'Select Client',
        description: 'Click "Add Property" and choose which client this property belongs to from the dropdown menu.',
        icon: Users,
        tips: [
          'You must create the client first before adding properties',
          'You can search for clients by name in the dropdown',
          'One client can have multiple properties'
        ]
      },
      {
        title: 'Enter Property Details',
        description: 'Fill in the property address, type, and basic information like square footage, bedrooms, and bathrooms.',
        icon: Home,
        tips: [
          'The address will be used for routing and mapping',
          'Property nickname helps identify properties quickly',
          'Select the appropriate property type'
        ]
      },
      {
        title: 'Add Access Information',
        description: 'Enter important access details like alarm codes, lockbox codes, gate codes, and WiFi credentials.',
        icon: FileText,
        tips: [
          'This information is securely stored',
          'Field inspectors will see this when visiting',
          'Update codes whenever they change'
        ]
      },
      {
        title: 'Set Inspection Schedule',
        description: 'Choose the inspection frequency and assign field inspectors to this property.',
        icon: Calendar,
        tips: [
          'Common frequencies: weekly, bi-weekly, or monthly',
          'Assign inspectors based on location and availability',
          'You can change the schedule anytime'
        ]
      },
      {
        title: 'Save Property',
        description: 'Review all details and click "Save" to add the property to your system.',
        icon: ClipboardCheck,
        tips: [
          'The property will now appear in your properties list',
          'You can immediately schedule visits for this property',
          'Upload photos and documents from the property detail page'
        ]
      }
    ]
  },

  createVisit: {
    id: 'createVisit',
    title: 'Scheduling a Visit',
    description: 'Learn how to schedule inspections and follow-up visits',
    category: 'Daily Operations',
    duration: '3 min',
    icon: ClipboardCheck,
    steps: [
      {
        title: 'Access the Schedule',
        description: 'Navigate to the Schedule page from the sidebar to view the calendar and add new visits.',
        icon: Calendar,
        tips: [
          'The calendar shows all scheduled visits',
          'You can switch between day, week, and month views',
          'Color coding helps identify different visit types'
        ]
      },
      {
        title: 'Create New Visit',
        description: 'Click on a date in the calendar or use the "Add Visit" button to open the visit creation form.',
        icon: ClipboardCheck,
        tips: [
          'You can also create visits from the property detail page',
          'Choose between inspection or follow-up visit types'
        ]
      },
      {
        title: 'Select Property and Type',
        description: 'Choose the property to visit and select whether it\'s an inspection or a follow-up visit.',
        icon: Building2,
        tips: [
          'Inspections use checklist templates',
          'Follow-ups are for specific tasks or issues',
          'The client is automatically selected based on the property'
        ]
      },
      {
        title: 'Assign and Schedule',
        description: 'Assign a field inspector, set the date and time, and add any special instructions.',
        icon: Users,
        tips: [
          'Check inspector availability before assigning',
          'Add time estimates to help with scheduling',
          'Special notes appear on the mobile app'
        ]
      },
      {
        title: 'Complete and Notify',
        description: 'Save the visit to add it to the schedule. The assigned inspector will be notified automatically.',
        icon: ClipboardCheck,
        tips: [
          'Inspectors see visits on their mobile app',
          'You can edit visits anytime before they start',
          'Clients can view scheduled visits in their portal'
        ]
      }
    ]
  },

  optimizeRoute: {
    id: 'optimizeRoute',
    title: 'Optimizing Visit Routes',
    description: 'Learn how to optimize routes for efficient field operations',
    category: 'Daily Operations',
    duration: '4 min',
    icon: Route,
    steps: [
      {
        title: 'Access Route Optimizer',
        description: 'Navigate to the Route Optimizer page from the sidebar to start planning efficient routes for your field team.',
        icon: Route,
        tips: [
          'This feature is available on Growth plans and above',
          'Routes are optimized to save time and fuel costs',
          'You can optimize routes for any team member'
        ]
      },
      {
        title: 'Select Field Inspector',
        description: 'Choose which field inspector you want to optimize routes for from the dropdown menu.',
        icon: Users,
        tips: [
          'Each inspector can have their own optimized route',
          'View all team members assigned to field visits',
          'Filter by availability and assigned properties'
        ]
      },
      {
        title: 'Choose Date Range',
        description: 'Select the date for which you want to optimize visits. The system will load all scheduled visits for that day.',
        icon: Calendar,
        tips: [
          'You can optimize routes for today or future dates',
          'All scheduled visits for the selected date will appear',
          'Rescheduled visits are automatically included'
        ]
      },
      {
        title: 'Set Start Location',
        description: 'Enter the starting location for the route (home, office, or custom address). This helps optimize the first stop.',
        icon: MapPin,
        tips: [
          'Use the inspector\'s home as default start location',
          'You can set a custom office or meeting point',
          'The start location is saved for future optimizations'
        ]
      },
      {
        title: 'Review Visit List',
        description: 'Check all scheduled visits that will be included in the route optimization. You can see property addresses and visit types.',
        icon: ClipboardCheck,
        tips: [
          'Verify all visits are for the correct date',
          'Remove any visits that shouldn\'t be included',
          'Add time estimates for more accurate routing'
        ]
      },
      {
        title: 'Optimize the Route',
        description: 'Click "Optimize Route" to calculate the most efficient path. The system uses advanced algorithms to minimize travel time.',
        icon: Navigation,
        tips: [
          'Optimization considers traffic patterns and distances',
          'Routes are ordered for maximum efficiency',
          'The map shows the complete optimized path'
        ]
      },
      {
        title: 'Review and Export',
        description: 'Review the optimized route order and statistics. Export to Google Maps or share with your team.',
        icon: Route,
        tips: [
          'See total distance and estimated travel time',
          'Export directly to Google Maps for navigation',
          'Share the optimized route with field inspectors',
          'Routes can be adjusted manually if needed'
        ]
      }
    ]
  }
};

export const tutorialCategories = [
  {
    name: 'Getting Started',
    description: 'Essential tutorials for new users',
    tutorials: ['createClient', 'createProperty', 'createVisit']
  },
  {
    name: 'Daily Operations',
    description: 'Day-to-day task tutorials',
    tutorials: ['createVisit', 'optimizeRoute']
  }
];