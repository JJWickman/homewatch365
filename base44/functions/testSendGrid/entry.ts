import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await req.json();
        const testEmail = email || user.email;

        // Send test email using Core integration
        await base44.integrations.Core.SendEmail({
            from_name: 'EstateWatch365 Test',
            to: testEmail,
            subject: 'SendGrid API Test - Success!',
            body: `
                <h2>🎉 SendGrid API Test Successful!</h2>
                <p>This is a test email to confirm your SendGrid API is properly configured.</p>
                <p><strong>Sent to:</strong> ${testEmail}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p>Your email integration is working correctly!</p>
            `
        });

        return Response.json({ 
            success: true, 
            message: `Test email sent successfully to ${testEmail}` 
        });
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});