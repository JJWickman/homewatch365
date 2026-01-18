import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stops } = await req.json();
    
    if (!stops || stops.length === 0) {
      return Response.json({ error: 'No stops provided' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Filter valid stops
    const validStops = stops.filter(s => {
      const lat = parseFloat(s.lat || s.latitude);
      const lng = parseFloat(s.lng || s.longitude);
      return !isNaN(lat) && !isNaN(lng);
    });

    if (validStops.length === 0) {
      return Response.json({ error: 'No valid stops with coordinates' }, { status: 400 });
    }

    // Build markers for static map
    const markers = validStops
      .map((stop, idx) => {
        const lat = parseFloat(stop.lat || stop.latitude);
        const lng = parseFloat(stop.lng || stop.longitude);
        const label = stop.label || String(stop.order || idx + 1);
        const color = stop.color || '0x64748b';
        return `color:${color}|label:${label}|${lat},${lng}`;
      })
      .join('&markers=');

    // Calculate center and zoom based on bounds
    const lats = validStops.map(s => parseFloat(s.lat || s.latitude));
    const lngs = validStops.map(s => parseFloat(s.lng || s.longitude));
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    // Use higher zoom for single location to show cross-roads
    const zoom = validStops.length === 1 ? 17 : 11;

    // Build the static map URL
    const url = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${centerLat},${centerLng}` +
      `&zoom=${zoom}` +
      `&size=1200x500` +
      `&scale=2` +
      `&markers=${markers}` +
      `&style=feature:poi|element:labels|visibility:off` +
      `&key=${apiKey}`;

    return Response.json({ mapUrl: url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});