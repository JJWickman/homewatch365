import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import twilio from 'npm:twilio@5.3.4';

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

        // SMS limits per subscription plan
        const smsLimits = {
            'solopreneur': 100,
            'growth': 500,
            'professional': 2000,
            'enterprise': 10000
        };

        const monthlyLimit = smsLimits[company.subscription_plan] || 100;

        // Get current month in YYYY-MM format
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get or create SMS usage record for this month
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

        // Check if limit exceeded (using emails_sent field for now - can be refactored later)
        if (usage.emails_sent >= monthlyLimit) {
            return Response.json({
                error: 'Monthly SMS limit exceeded',
                limit: monthlyLimit,
                used: usage.emails_sent,
                plan: company.subscription_plan,
                message: `You've reached your monthly limit of ${monthlyLimit} SMS messages. Upgrade your plan to send more.`
            }, { status: 429 });
        }

        // Parse request body
        const { to, message } = await req.json();

        if (!to || !message) {
            return Response.json({ error: 'Missing required fields: to, message' }, { status: 400 });
        }

        // Configure Twilio
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (!accountSid || !authToken || !twilioPhoneNumber) {
            return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
        }

        const client = twilio(accountSid, authToken);

        // Send SMS
        const smsResult = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to
        });

        console.log('Twilio response:', JSON.stringify(smsResult));

        // Increment usage counter
        await base44.asServiceRole.entities.EmailUsage.update(usage.id, {
            emails_sent: usage.emails_sent + 1
        });

        return Response.json({ 
            success: true, 
            message: `SMS sent successfully to ${to}`,
            twilioMessageSid: smsResult.sid,
            status: smsResult.status,
            usage: {
                sent: usage.emails_sent + 1,
                limit: monthlyLimit,
                remaining: monthlyLimit - (usage.emails_sent + 1)
            }
        });

    } catch (error) {
        console.error('Error sending SMS:', error);
        return Response.json({ 
            error: error.message || 'Failed to send SMS',
            details: error.code || null
        }, { status: 500 });
    }
});