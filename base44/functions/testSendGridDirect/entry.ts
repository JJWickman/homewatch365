import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import sgMail from 'npm:@sendgrid/mail@8.1.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'SENDGRID_API_KEY not configured' }, { status: 500 });
        }

        sgMail.setApiKey(apiKey);

        const { to } = await req.json();
        if (!to) {
            return Response.json({ error: 'Missing "to" email address' }, { status: 400 });
        }

        const msg = {
            to: to,
            from: 'noreply@estatewatch365.app',
            subject: 'SendGrid Direct Test - ' + new Date().toISOString(),
            text: 'This is a direct SendGrid test. If you receive this, SendGrid is working correctly.',
            html: '<p>This is a <strong>direct SendGrid test</strong>. If you receive this, SendGrid is working correctly.</p>'
        };

        console.log('Sending email:', JSON.stringify(msg, null, 2));
        
        const response = await sgMail.send(msg);
        
        console.log('SendGrid response:', JSON.stringify(response, null, 2));

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            to: to,
            from: msg.from,
            statusCode: response[0]?.statusCode,
            messageId: response[0]?.headers['x-message-id'],
            fullResponse: response
        });

    } catch (error) {
        console.error('SendGrid error:', error);
        return Response.json({ 
            error: error.message,
            response: error.response?.body,
            code: error.code
        }, { status: 500 });
    }
});