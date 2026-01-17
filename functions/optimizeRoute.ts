import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stops, startAddress } = await req.json();
    
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Build waypoints for Routes API
    const waypoints = stops.map(stop => ({
      location: {
        latLng: {
          latitude: stop.lat,
          longitude: stop.lng
        }
      }
    }));

    // Call Google Maps Routes API (Compute Routes)
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs'
      },
      body: JSON.stringify({
        origin: {
          address: startAddress
        },
        destination: waypoints[waypoints.length - 1].location,
        intermediates: waypoints.slice(0, -1),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: 'en-US',
        units: 'IMPERIAL'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Routes API error:', errorText);
      return Response.json({ error: 'Failed to compute route' }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return Response.json({ error: 'No route found' }, { status: 404 });
    }

    const route = data.routes[0];
    
    // Build optimized stops from route legs
    const optimizedStops = [];
    let cumulativeTime = 0;
    
    route.legs.forEach((leg, index) => {
      const stop = stops[index];
      const driveMinutes = Math.round(parseInt(leg.duration?.replace('s', '') || 0) / 60);
      const distanceMiles = (leg.distanceMeters / 1609.34).toFixed(1);
      
      cumulativeTime += driveMinutes;
      const eta = new Date();
      eta.setMinutes(eta.getMinutes() + cumulativeTime);
      
      optimizedStops.push({
        original_index: index + 1,
        order: index + 1,
        name: stop.name,
        address: stop.address,
        lat: stop.lat,
        lng: stop.lng,
        inspection_id: stop.id,
        estimated_arrival: eta.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        drive_time_minutes: driveMinutes,
        distance_miles: parseFloat(distanceMiles)
      });
    });

    const totalDuration = Math.round(parseInt(route.duration?.replace('s', '') || 0) / 60);
    const totalDistance = (route.distanceMeters / 1609.34).toFixed(1);

    return Response.json({
      optimized_stops: optimizedStops,
      total_distance_miles: parseFloat(totalDistance),
      total_drive_time_minutes: totalDuration,
      polyline: route.polyline?.encodedPolyline,
      traffic_notes: 'Route optimized for current traffic conditions',
      recommendations: 'Follow the route in order for best efficiency'
    });

  } catch (error) {
    console.error('Error in optimizeRoute:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});