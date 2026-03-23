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

    // Build waypoints for Directions API with optimization
    const waypoints = stops.map(stop => `${stop.lat},${stop.lng}`).join('|');

    // Call Google Directions API with waypoint optimization
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', startAddress);
    url.searchParams.set('destination', startAddress);
    url.searchParams.set('waypoints', `optimize:true|${waypoints}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Directions API error:', errorText);
      return Response.json({ 
        error: 'Failed to optimize route', 
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.error('API Response:', data);
      return Response.json({ 
        error: 'No route found', 
        details: data.error_message || data.status 
      }, { status: 404 });
    }

    const route = data.routes[0];
    const waypointOrder = route.waypoint_order || [];
    
    // Build optimized stops using waypoint order
    const optimizedStops = [];
    let cumulativeTime = 0;
    
    waypointOrder.forEach((waypointIndex, order) => {
      const stop = stops[waypointIndex];
      const leg = route.legs[order];
      
      const driveMinutes = Math.round(leg.duration.value / 60);
      const distanceMiles = (leg.distance.value / 1609.34).toFixed(1);
      
      cumulativeTime += driveMinutes;
      const eta = new Date();
      eta.setMinutes(eta.getMinutes() + cumulativeTime);
      
      optimizedStops.push({
        original_index: waypointIndex + 1,
        order: order + 1,
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

    // Calculate totals
    const totalDuration = route.legs.reduce((sum, leg) => sum + Math.round(leg.duration.value / 60), 0);
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1609.34;

    return Response.json({
      optimized_stops: optimizedStops,
      total_distance_miles: parseFloat(totalDistance.toFixed(1)),
      total_drive_time_minutes: totalDuration,
      polyline: route.overview_polyline?.points,
      traffic_notes: 'Route optimized for shortest distance',
      recommendations: 'Follow the optimized order for best efficiency'
    });

  } catch (error) {
    console.error('Error in optimizeRoute:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});