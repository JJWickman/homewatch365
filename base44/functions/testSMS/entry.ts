import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to } = await req.json();
        if (!to) {
            return Response.json({ error: 'Missing "to" phone number' }, { status: 400 });
        }

        const result = await base44.functions.invoke('sendSMS', {
            to: to,
            message: 'Test SMS from EstateWatch365 - ' + new Date().toLocaleString()
        });

        return Response.json(result.data);

    } catch (error) {
        console.error('Error testing SMS:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});