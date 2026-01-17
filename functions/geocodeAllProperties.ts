import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all properties without coordinates
    const allProperties = await base44.asServiceRole.entities.Property.filter({});
    const propertiesNeedingGeocode = allProperties.filter(p => !p.latitude || !p.longitude);

    console.log(`Found ${propertiesNeedingGeocode.length} properties needing geocoding`);

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const results = {
      total: propertiesNeedingGeocode.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Geocode each property
    for (const property of propertiesNeedingGeocode) {
      if (!property.address || !property.city || !property.state) {
        results.failed++;
        results.errors.push({
          propertyId: property.id,
          name: property.name || property.address,
          error: 'Missing address fields'
        });
        continue;
      }

      try {
        const address = `${property.address}, ${property.city}, ${property.state} ${property.zip || ''}`;
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          
          // Update property with coordinates
          await base44.asServiceRole.entities.Property.update(property.id, {
            latitude: location.lat,
            longitude: location.lng
          });

          results.success++;
          console.log(`✓ Geocoded: ${property.name || property.address}`);
        } else {
          results.failed++;
          results.errors.push({
            propertyId: property.id,
            name: property.name || property.address,
            error: `Geocoding failed: ${data.status}`
          });
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.errors.push({
          propertyId: property.id,
          name: property.name || property.address,
          error: error.message
        });
      }
    }

    return Response.json({
      message: 'Geocoding complete',
      results
    });

  } catch (error) {
    console.error('Error geocoding properties:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});