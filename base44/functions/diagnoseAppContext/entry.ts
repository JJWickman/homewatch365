import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const appId = Deno.env.get('BASE44_APP_ID');
    
    console.log('=== diagnoseAppContext ===');
    
    // Log request headers
    const headers = {};
    for (const [key, value] of req.headers) {
      headers[key] = value;
    }
    
    console.log('Request Headers:', {
      host: headers['host'],
      origin: headers['origin'],
      referer: headers['referer'],
      'base44-app-id': headers['base44-app-id'],
      authorization: headers['authorization'] ? 'Present' : 'Missing',
      'user-agent': headers['user-agent']
    });
    
    console.log('Environment:', {
      BASE44_APP_ID: appId,
      NODE_ENV: Deno.env.get('NODE_ENV')
    });
    
    // Try to init Base44 client
    try {
      const base44 = createClientFromRequest(req);
      console.log('Base44 client initialized successfully');
      
      const user = await base44.auth.me();
      console.log('Authenticated user:', user?.email || 'No user');
    } catch (e) {
      console.error('Base44 client initialization error:', e.message);
    }
    
    return Response.json({
      status: 'ok',
      appId,
      requestHost: headers['host'],
      requestOrigin: headers['origin'],
      hasBase44Header: !!headers['base44-app-id'],
      hasAuthHeader: !!headers['authorization']
    });
  } catch (error) {
    console.error('diagnoseAppContext error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});