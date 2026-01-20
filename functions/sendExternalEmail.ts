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

        // Check subscription plan - only professional and enterprise can send external emails
        const allowedPlans = ['professional', 'enterprise'];
        if (!allowedPlans.includes(company.subscription_plan)) {
            return Response.json({ 
                error: 'External email sending requires Professional or Enterprise subscription',
                current_plan: company.subscription_plan 
            }, { status: 403 });
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
            from: company.email || 'noreply@estatewatch365.com',
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

        return Response.json({ 
            success: true, 
            message: `Email sent successfully to ${to}`,
            from: msg.from
        });

    } catch (error) {
        console.error('Error sending external email:', error);
        return Response.json({ 
            error: error.message || 'Failed to send email',
            details: error.response?.body?.errors || null
        }, { status: 500 });
    }
});