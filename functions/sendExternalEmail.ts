import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import sgMail from 'npm:@sendgrid/mail@8.1.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's company membership
        const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
        if (members.length === 0) {
            return Response.json({ error: 'No company membership found' }, { status: 403 });
        }

        // Get company
        const companies = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companies.length === 0) {
            return Response.json({ error: 'Company not found' }, { status: 404 });
        }

        const company = companies[0];

        // Email limits per subscription plan
        const emailLimits = {
            'solopreneur': 100,
            'growth': 500,
            'professional': 2000,
            'enterprise': 10000
        };

        const monthlyLimit = emailLimits[company.subscription_plan] || 100;

        // Get current month in YYYY-MM format
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get or create email usage record for this month
        const usageRecords = await base44.entities.EmailUsage.filter({
            company_id: company.id,
            month: currentMonth
        });

        let usage;
        if (usageRecords.length === 0) {
            usage = await base44.asServiceRole.entities.EmailUsage.create({
                company_id: company.id,
                month: currentMonth,
                emails_sent: 0,
                last_reset_date: now.toISOString()
            });
        } else {
            usage = usageRecords[0];
        }

        // Check if limit exceeded
        if (usage.emails_sent >= monthlyLimit) {
            return Response.json({
                error: 'Monthly email limit exceeded',
                limit: monthlyLimit,
                used: usage.emails_sent,
                plan: company.subscription_plan,
                message: `You've reached your monthly limit of ${monthlyLimit} emails. Upgrade your plan to send more.`
            }, { status: 429 });
        }

        // Parse request body
        const { to, subject, body, from_name } = await req.json();

        if (!to || !subject || !body) {
            return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
        }

        // Configure SendGrid
        const apiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'SendGrid API key not configured' }, { status: 500 });
        }

        sgMail.setApiKey(apiKey);

        // Send email
        const msg = {
            to: to,
            from: 'noreply@estatewatch365.com',
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>'),
        };

        if (from_name) {
            msg.from = { email: msg.from, name: from_name };
        } else if (company.name) {
            msg.from = { email: msg.from, name: company.name };
        }

        await sgMail.send(msg);

        // Increment email usage counter
        await base44.asServiceRole.entities.EmailUsage.update(usage.id, {
            emails_sent: usage.emails_sent + 1
        });

        return Response.json({ 
            success: true, 
            message: `Email sent successfully to ${to}`,
            from: msg.from,
            usage: {
                sent: usage.emails_sent + 1,
                limit: monthlyLimit,
                remaining: monthlyLimit - (usage.emails_sent + 1)
            }
        });

    } catch (error) {
        console.error('Error sending external email:', error);
        return Response.json({ 
            error: error.message || 'Failed to send email',
            details: error.response?.body?.errors || null
        }, { status: 500 });
    }
});