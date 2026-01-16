import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fromAddress, toAddress } = await req.json();
    
    if (!fromAddress || !toAddress) {
      return Response.json({ error: 'Missing addresses' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(fromAddress)}&destinations=${encodeURIComponent(toAddress)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows[0].elements[0]) {
      return Response.json({ error: 'Unable to calculate distance' }, { status: 400 });
    }

    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
      return Response.json({ error: 'Route not found' }, { status: 400 });
    }

    return Response.json({
      distance: element.distance.value, // meters
      duration: element.duration.value // seconds
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});