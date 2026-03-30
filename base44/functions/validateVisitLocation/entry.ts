import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { propertyId, userLat, userLon } = await req.json();

    if (!propertyId || userLat == null || userLon == null) {
      return Response.json({ error: 'Missing propertyId, userLat, or userLon' }, { status: 400 });
    }

    // Load property
    const properties = await base44.entities.Property.filter({ id: propertyId });
    if (!properties.length) return Response.json({ error: 'Property not found' }, { status: 404 });
    const property = properties[0];

    if (!property.latitude || !property.longitude) {
      return Response.json({ valid: false, message: 'Property has no GPS coordinates. Contact admin to geocode the address.' }, { status: 400 });
    }

    // Load tenant geofencing settings
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: property.tenant_id });
    const tenant = tenants[0];
    const maxRadius = tenant?.geofencing_radius_meters || 150;

    const distance = haversineDistance(userLat, userLon, property.latitude, property.longitude);
    const valid = distance <= maxRadius;

    return Response.json({
      valid,
      distance_meters: Math.round(distance),
      max_radius_meters: maxRadius,
      message: valid
        ? `You are ${Math.round(distance)}m from the property. Check passed.`
        : `You are ${Math.round(distance)}m from the property. You must be within ${maxRadius}m to record a visit.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});