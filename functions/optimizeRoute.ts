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

    // Build shipments for Route Optimization API
    const shipments = stops.map((stop, index) => ({
      deliveries: [{
        arrivalLocation: {
          latitude: stop.lat,
          longitude: stop.lng
        },
        duration: '600s' // 10 minutes per stop
      }],
      label: stop.name
    }));

    // Call Google Route Optimization API
    const response = await fetch('https://routeoptimization.googleapis.com/v1:optimizeTours', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify({
        parent: 'projects/YOUR_PROJECT',
        model: {
          shipments,
          vehicles: [{
            startLocation: {
              latitude: null, // Will be geocoded from address
              longitude: null
            },
            endLocation: {
              latitude: null,
              longitude: null
            },
            startAddress: startAddress,
            endAddress: startAddress
          }],
          globalStartTime: new Date().toISOString(),
          globalEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Route Optimization API error:', errorText);
      return Response.json({ 
        error: 'Failed to optimize route', 
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return Response.json({ error: 'No optimized route found' }, { status: 404 });
    }

    const optimizedRoute = data.routes[0];
    const visits = optimizedRoute.visits || [];
    
    // Build optimized stops from visits
    const optimizedStops = [];
    let cumulativeTime = 0;
    
    visits.forEach((visit, index) => {
      if (!visit.shipmentIndex && visit.shipmentIndex !== 0) return;
      
      const stop = stops[visit.shipmentIndex];
      const startTimeSecs = parseInt(visit.startTime?.seconds || 0);
      const eta = new Date(startTimeSecs * 1000);
      
      // Calculate drive time from transitions
      const transition = optimizedRoute.transitions?.[index];
      const driveMinutes = transition ? Math.round(parseInt(transition.travelDuration?.replace('s', '') || 0) / 60) : 0;
      const distanceMiles = transition ? (transition.travelDistanceMeters / 1609.34).toFixed(1) : '0.0';
      
      optimizedStops.push({
        original_index: visit.shipmentIndex + 1,
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

    // Calculate total metrics
    const metrics = optimizedRoute.metrics || {};
    const totalDuration = Math.round(parseInt(metrics.totalDuration?.replace('s', '') || 0) / 60);
    const totalDistance = ((metrics.travelDistanceMeters || 0) / 1609.34).toFixed(1);

    return Response.json({
      optimized_stops: optimizedStops,
      total_distance_miles: parseFloat(totalDistance),
      total_drive_time_minutes: totalDuration,
      traffic_notes: 'Route optimized for efficiency',
      recommendations: 'Follow the optimized order for best results'
    });

  } catch (error) {
    console.error('Error in optimizeRoute:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});