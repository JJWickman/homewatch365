import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, city, state, zip } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      return Response.json({ valid: false, error: 'Address validation service not configured' }, { status: 500 });
    }

    const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: {
          addressLines: [address],
          administrativeArea: state,
          locality: city,
          postalCode: zip,
          regionCode: 'US'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.result;

    if (result?.verdict?.validationGranularity === 'PREMISE' ||
        result?.verdict?.validationGranularity === 'STREET_ADDRESS') {
      const geocode = result.geocode;
      const formattedAddress = result.address?.formattedAddress;

      return Response.json({
        valid: true,
        formattedAddress: formattedAddress || `${address}, ${city}, ${state} ${zip}`,
        latitude: geocode?.location?.latitude,
        longitude: geocode?.location?.longitude,
        addressComponents: {
          postalCode: result.address?.postalCode,
          administrativeArea: result.address?.administrativeArea,
          locality: result.address?.locality
        }
      });
    } else {
      return Response.json({
        valid: false,
        error: 'Address could not be fully validated. Please check the address and try again.',
        validationGranularity: result?.verdict?.validationGranularity
      });
    }
  } catch (error) {
    return Response.json({ valid: false, error: `Address validation error: ${error.message}` }, { status: 500 });
  }
});