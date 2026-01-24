import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_name, user_email, user_name } = await req.json();

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const welcomeSubject = '🎉 Welcome to Estate Watch 365 - Let\'s Transform Your Business!';
    const welcomeContent = `Hi ${user_name || 'there'}!

🎉 **Welcome to Estate Watch 365!** 🎉

We are absolutely THRILLED to have ${company_name || 'you'} join our community! Your decision to modernize your property watch business is the first step toward incredible growth, and we couldn't be more excited to be part of your journey.

**You're About to Experience Something Amazing:**

✨ **Freedom from Paperwork** - Say goodbye to clipboards and messy spreadsheets. Everything you need is now in one beautiful, easy-to-use platform.

🚀 **Work Smarter, Not Harder** - Our route optimization, automated scheduling, and instant reporting will give you HOURS back every week.

💰 **Get Paid Faster** - Automated invoicing and online payments mean more money in your pocket, sooner.

📱 **Mobile-First Design** - Complete inspections from your phone, even offline. Your team will love it!

**Your 14-Day Trial Starts NOW!**

We've given you FULL access to every feature. No limits. No restrictions. Just pure potential.

Here's what we recommend you do first:
1. Add your first client (takes 2 minutes)
2. Create a property (another 2 minutes)
3. Schedule an inspection (you're basically done!)

Over the next few days, we'll send you helpful tips to get the most out of Estate Watch 365. But honestly? The platform is so intuitive, you'll probably figure it out before we email you! 😊

**We're Here For You - Always**

Got questions? Hit a snag? Just want to chat about growing your business? Reach out to us directly:
• Jason: jason@estatewatch365.com
• Alex: alex@estatewatch365.com

We're real people who genuinely care about your success, and we personally read and respond to every email.

Your business is about to level up in ways you never imagined. We can't wait to see what you accomplish!

Let's do this! 💪

To your success,
Jason & Alex
The Estate Watch 365 Team

P.S. Seriously, if you need ANYTHING - we're just an email away. Your success is our success, and we're invested in making you wildly successful!

---
Login to your dashboard: https://estatewatch365.app`;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: user_email }]
        }],
        from: {
          email: 'noreply@estatewatch365.app',
          name: 'Estate Watch 365'
        },
        subject: welcomeSubject,
        content: [{
          type: 'text/plain',
          value: welcomeContent
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    console.log(`Welcome email sent to ${user_email} for ${company_name}`);

    return Response.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});