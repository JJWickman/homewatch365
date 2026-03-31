import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
const TRIAL_REMINDER_CONTENT = (daysLeft, tenantName) => `Hi there!

Just a friendly reminder that your Estate Watch 365 trial is ending soon.

**Trial Status:**
- Days remaining: ${daysLeft}
- Tenant: ${tenantName}

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

    // Get all active trial tenants
    const tenants = await base44.asServiceRole.entities.Tenant.filter({
      subscription_status: 'trial'
    });

    console.log(`Found ${tenants.length} trial tenants to check`);

    for (const tenant of tenants) {
      // Get tenant owner/admin to send emails to
      const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
        tenant_id: tenant.id,
        is_owner: true
      });

      if (tenantUsers.length === 0) continue;

      const owner = tenantUsers[0];

      // Look up actual user email from user_id
      const users = await base44.asServiceRole.entities.User.filter({ id: owner.user_id });
      if (users.length === 0) continue;
      const ownerEmail = users[0].email;

      const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;

      if (!trialEndsAt) continue;

      const now = new Date();
      const daysUntilExpiry = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

      // Check for existing tracking record
      let tracking = await base44.asServiceRole.entities.OnboardingEmailTracking.filter({
        tenant_id: tenant.id,
        user_email: ownerEmail
      });

      // Create tracking if doesn't exist
      if (tracking.length === 0) {
        tracking = [await base44.asServiceRole.entities.OnboardingEmailTracking.create({
          user_email: ownerEmail,
          tenant_id: tenant.id,
          trial_start_date: tenant.created_date || new Date().toISOString(),
          emails_sent: [],
          trial_reminder_sent: false,
          completed: false
        })];
      }

      const trackingRecord = tracking[0];

      // Send trial reminder if 3 days or less remaining
      if (daysUntilExpiry <= 3 && !trackingRecord.trial_reminder_sent) {
        console.log(`Sending trial reminder to ${ownerEmail} (${daysUntilExpiry} days left)`);

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Estate Watch 365',
          to: ownerEmail,
          subject: TRIAL_REMINDER_SUBJECT,
          body: TRIAL_REMINDER_CONTENT(daysUntilExpiry, tenant.name)
        });

        await base44.asServiceRole.entities.OnboardingEmailTracking.update(trackingRecord.id, {
          trial_reminder_sent: true
        });

        console.log(`Trial reminder sent to ${ownerEmail}`);
        continue;
      }

      // Skip if onboarding journey is complete
      if (trackingRecord.completed) continue;

      // Calculate days since trial started
      const trialStartDate = new Date(trackingRecord.trial_start_date);
      const daysSinceStart = Math.floor((now - trialStartDate) / (1000 * 60 * 60 * 24));

      // Determine which email to send (every other day: 1, 3, 5, 7, 9)
      const emailSchedule = [1, 3, 5, 7, 9]; // Days to send emails
      const emailsSentCount = trackingRecord.emails_sent?.length || 0;

      // Check if we should send an email today
      const nextEmailDay = emailSchedule[emailsSentCount];

      if (daysSinceStart >= nextEmailDay && emailsSentCount < EMAIL_TOPICS.length) {
        const emailToSend = EMAIL_TOPICS[emailsSentCount];

        console.log(`Sending email ${emailToSend.number} to ${ownerEmail} (day ${daysSinceStart})`);

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Estate Watch 365',
          to: ownerEmail,
          subject: emailToSend.subject,
          body: emailToSend.content
        });

        // Update tracking
        const updatedEmailsSent = [
          ...(trackingRecord.emails_sent || []),
          {
            email_number: emailToSend.number,
            topic: emailToSend.topic,
            sent_at: new Date().toISOString()
          }
        ];

        await base44.asServiceRole.entities.OnboardingEmailTracking.update(trackingRecord.id, {
          emails_sent: updatedEmailsSent,
          completed: updatedEmailsSent.length >= EMAIL_TOPICS.length
        });

        console.log(`Email ${emailToSend.number} sent to ${ownerEmail}`);

      }
    }

    return Response.json({
      success: true,
      message: 'Onboarding emails processed successfully'
    });
  } catch (error) {
    console.error('Error sending onboarding emails:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});