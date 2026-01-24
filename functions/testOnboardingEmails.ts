import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EMAIL_TOPICS = [
  {
    number: 1,
    topic: 'Adding Your First Client',
    subject: '🚀 Getting Started: Add Your First Client',
    content: `Hi there!

Welcome to Estate Watch 365! We're excited to have you on board.

Let's get started with the basics. Today, we'll show you how to add your first client to your account.

**Why Add Clients?**
Clients are at the heart of your property management business. Each client can have multiple properties, and you'll be able to track all their inspections, reports, and billing in one place.

**How to Add a Client:**
1. Go to the "Clients" page from your dashboard
2. Click the "Add Client" button
3. Fill in their contact information (name, email, phone, address)
4. Save, and you're done!

**Pro Tip:** Make sure to add their email address - this allows them to access the client portal and receive inspection reports automatically.

Ready to add your first client? Log in now and give it a try!

Best regards,
The Estate Watch 365 Team`
  },
  {
    number: 2,
    topic: 'Adding Your First Property',
    subject: '🏠 Next Step: Add Your First Property',
    content: `Hi again!

Now that you've set up your clients (or are ready to), let's move on to adding properties.

**Why Add Properties?**
Properties are the locations you'll be inspecting and managing. Each property is linked to a client and will be the focus of your inspection visits.

**How to Add a Property:**
1. Go to the "Properties" page
2. Click "Add Property"
3. Select the client who owns this property
4. Enter the property address and details (type, access instructions, etc.)
5. Save it!

**Pro Tip:** Add detailed access instructions and gate codes in the property notes. Your field inspectors will thank you when they arrive on-site!

The system will automatically geocode the address for route optimization.

Ready to add your first property? Jump in now!

Best regards,
The Estate Watch 365 Team`
  },
  {
    number: 3,
    topic: 'Scheduling Your First Inspection',
    subject: '📋 Let\'s Schedule: Your First Inspection',
    content: `Great progress!

You've added clients and properties - now let's schedule your first inspection visit.

**Why Schedule Inspections?**
Regular inspections are the backbone of property watch services. With Estate Watch 365, you can schedule routine inspections, pre-storm checks, follow-ups, and more.

**How to Schedule an Inspection:**
1. Go to the "Schedule" page
2. Click "Add Visit"
3. Choose the property and visit type (inspection, follow-up, etc.)
4. Assign it to a team member
5. Set the date and time
6. Save!

**Pro Tip:** Use the calendar view to see your entire schedule at a glance. You can also set up recurring inspections for properties that need regular checks.

Ready to schedule your first visit? Let's do it!

Best regards,
The Estate Watch 365 Team`
  },
  {
    number: 4,
    topic: 'Setting Up Billing & Invoicing',
    subject: '💰 Get Paid: Set Up Your Billing',
    content: `Hi there!

Let's talk money - specifically, how to get paid for your amazing property watch services.

**Why Set Up Billing?**
Estate Watch 365 includes a complete billing system so you can manage subscriptions, send invoices, and track payments all in one place.

**How to Set Up Billing:**
1. Go to Settings → Admin
2. Set up your billing email under "Invoice Sender Email"
3. Go to Settings → Products & Services
4. Create your subscription plans (Weekly, Bi-weekly, Monthly)
5. Add any one-time services or add-ons

**Sending Invoices:**
Once set up, go to the "Billing" page to:
- View all client statements
- Generate and send monthly invoices
- Track payments and outstanding balances

**Pro Tip:** You can connect Stripe to accept online payments directly from invoices!

Ready to set up your billing? Get started now!

Best regards,
The Estate Watch 365 Team`
  },
  {
    number: 5,
    topic: 'Route Optimization & Advanced Features',
    subject: '🗺️ Work Smarter: Route Optimization & More',
    content: `You're doing great!

Let's explore some powerful features that will help you work more efficiently.

**Route Optimization**
Stop wasting time and fuel! The Route Optimizer helps you plan the most efficient routes for your field inspectors.

How to use it:
1. Go to "Route Optimizer"
2. Select the visits for the day
3. Choose your start location (HQ or home)
4. Click "Optimize Route" - done!

The system will calculate the best order to visit properties and show you the route on a map.

**Other Features to Explore:**
- **Client Portal:** Clients can log in to view inspection reports and invoices
- **Inspection Templates:** Create custom checklists for different property types
- **Team Management:** Add field inspectors and assign them to specific properties
- **Calendar Sync:** Subscribe to your schedule in Google Calendar, Outlook, or Apple Calendar

**Pro Tip:** Set up your home and HQ addresses in Settings → Profile so route optimization works perfectly for you.

You're now ready to use Estate Watch 365 like a pro! If you have any questions, just reply to this email.

Best regards,
The Estate Watch 365 Team`
  }
];

const TRIAL_REMINDER_SUBJECT = '⏰ Trial Ending Soon - Subscribe Now';
const TRIAL_REMINDER_CONTENT = `Hi there!

Just a friendly reminder that your Estate Watch 365 trial is ending soon.

**Trial Status:**
- Days remaining: 3
- Company: Test Company

You've been exploring our property watch management platform, and we hope you're loving it! Don't lose access to all your data and features.

**What happens when the trial ends?**
- You'll lose access to your account
- Your data will be preserved, but you won't be able to access it
- Your clients won't be able to access the portal

**Ready to Subscribe?**
1. Go to Settings → Subscription
2. Choose the plan that's right for you
3. Complete checkout - it takes less than 2 minutes!

**Plans start at just $99/month** with no long-term contracts. Cancel anytime.

Questions? Just reply to this email or contact our support team.

Don't let your trial expire - subscribe today!

Best regards,
The Estate Watch 365 Team`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const testEmail = 'jason@biglynx.com';

    console.log(`Sending all onboarding emails to ${testEmail}...`);

    // Send all 5 onboarding emails
    for (const email of EMAIL_TOPICS) {
      await base44.integrations.Core.SendEmail({
        from_name: 'Estate Watch 365',
        to: testEmail,
        subject: `[TEST ${email.number}/5] ${email.subject}`,
        body: email.content
      });
      console.log(`Sent email ${email.number}: ${email.topic}`);
    }

    // Send trial reminder
    await base44.integrations.Core.SendEmail({
      from_name: 'Estate Watch 365',
      to: testEmail,
      subject: `[TEST TRIAL REMINDER] ${TRIAL_REMINDER_SUBJECT}`,
      body: TRIAL_REMINDER_CONTENT
    });
    console.log('Sent trial reminder email');

    return Response.json({
      success: true,
      message: `All 6 test emails sent to ${testEmail}`,
      emails_sent: [
        ...EMAIL_TOPICS.map(e => e.subject),
        TRIAL_REMINDER_SUBJECT
      ]
    });
  } catch (error) {
    console.error('Error sending test emails:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});