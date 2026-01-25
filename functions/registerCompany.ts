import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { companyName, fullName, email, phone } = await req.json();

    // Validate required fields
    if (!companyName || !fullName || !email) {
      return Response.json({ 
        success: false, 
        message: 'Company name, full name, and email are required' 
      }, { status: 400 });
    }

    // Check if user already has a company
    const existingMembers = await base44.asServiceRole.entities.CompanyMember.filter({ 
      user_email: email 
    });

    if (existingMembers.length > 0) {
      return Response.json({ 
        success: false, 
        message: 'This email is already registered. Please sign in instead.' 
      }, { status: 400 });
    }

    // Create company slug
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: companyName,
      metadata: {
        company_name: companyName
      }
    });

    // Create company with 14-day trial
    const company = await base44.asServiceRole.entities.Company.create({
      name: companyName,
      slug: slug + '-' + Date.now().toString(36),
      phone: phone || '',
      logo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696806e88e744d6cc803e3bb/7e2dc0976_EstateIQFavIcon.png',
      subscription_plan: 'solopreneur',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_customer_id: stripeCustomer.id,
      is_active: true
    });

    // Create company member (owner)
    await base44.asServiceRole.entities.CompanyMember.create({
      company_id: company.id,
      user_email: email,
      user_name: fullName,
      role: 'administrator',
      is_owner: true,
      is_active: true
    });

    // Create default inspection template
    await base44.asServiceRole.entities.InspectionTemplate.create({
      company_id: company.id,
      name: 'Standard Weekly Inspection',
      description: 'Default template for routine property inspections',
      type: 'routine',
      is_default: true,
      is_active: true,
      sections: [
        {
          name: 'Exterior',
          order: 1,
          items: [
            { name: 'Front entrance & doors', check_type: 'pass_fail', requires_photo: true, order: 1 },
            { name: 'Windows & screens', check_type: 'pass_fail', requires_photo: false, order: 2 },
            { name: 'Landscaping condition', check_type: 'pass_fail', requires_photo: true, order: 3 },
            { name: 'Pool/spa (if applicable)', check_type: 'pass_fail', requires_photo: true, order: 4 },
            { name: 'Gutters & drainage', check_type: 'pass_fail', requires_photo: false, order: 5 }
          ]
        },
        {
          name: 'Interior - Main Areas',
          order: 2,
          items: [
            { name: 'Foyer/entry', check_type: 'pass_fail', requires_photo: true, order: 1 },
            { name: 'Living areas', check_type: 'pass_fail', requires_photo: true, order: 2 },
            { name: 'Kitchen appliances', check_type: 'yes_no', requires_photo: false, order: 3 },
            { name: 'Refrigerator/freezer', check_type: 'pass_fail', requires_photo: false, order: 4 },
            { name: 'Pest inspection', check_type: 'yes_no', requires_photo: false, order: 5 }
          ]
        },
        {
          name: 'Systems & Utilities',
          order: 3,
          items: [
            { name: 'HVAC operation', check_type: 'pass_fail', requires_photo: false, order: 1 },
            { name: 'Thermostat setting', check_type: 'text', requires_photo: false, order: 2 },
            { name: 'Water heater', check_type: 'pass_fail', requires_photo: false, order: 3 },
            { name: 'Plumbing - no leaks', check_type: 'yes_no', requires_photo: false, order: 4 },
            { name: 'Smoke/CO detectors', check_type: 'pass_fail', requires_photo: false, order: 5 }
          ]
        }
      ]
    });

    // Invite user via Base44's built-in user invitation system
    await base44.asServiceRole.users.inviteUser(email, 'user');

    // Send welcome email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Estate Watch',
      to: email,
      subject: 'Welcome to Estate Watch - Complete Your Registration',
      body: `
Hello ${fullName},

Welcome to Estate Watch! Your company "${companyName}" has been created and your 14-day free trial has started.

We've sent you a separate invitation email with a link to complete your registration and create your password.

Once you've completed registration, you can:
✓ Add clients and properties
✓ Schedule inspections
✓ Manage your team
✓ And much more!

Your trial includes full access to all features. No credit card required.

If you have any questions, just reply to this email.

Best regards,
The Estate Watch Team
      `.trim()
    });

    return Response.json({ 
      success: true,
      message: 'Registration successful! Please check your email to complete setup.',
      company_id: company.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ 
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    }, { status: 500 });
  }
});