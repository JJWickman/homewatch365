import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Skip if already has coordinates
    if (data.latitude && data.longitude) {
      return Response.json({ skipped: true, reason: 'Property already has coordinates' });
    }

    // Skip if missing address fields
    if (!data.address || !data.city || !data.state) {
      return Response.json({ error: 'Missing address fields, cannot geocode' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const address = `${data.address}, ${data.city}, ${data.state} ${data.zip || ''}`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    const geoData = await response.json();

    if (geoData.status === 'OK' && geoData.results && geoData.results.length > 0) {
      const location = geoData.results[0].geometry.location;
      
      // Update property with coordinates
      await base44.asServiceRole.entities.Property.update(data.id, {
        latitude: location.lat,
        longitude: location.lng
      });

      return Response.json({
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        address: geoData.results[0].formatted_address
      });
    } else {
      return Response.json({
        error: `Geocoding failed: ${geoData.status}`,
        message: `Could not find coordinates for: ${address}`
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});