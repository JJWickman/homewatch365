import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Received body:', JSON.stringify(body, null, 2));
        
        const { address, city, state, zip } = body || {};
        
        if (!address || !city || !state) {
            return Response.json({ error: 'Address, city, and state are required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'API key not configured' }, { status: 500 });
        }

        const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;

        // Validate address using Geocoding API
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
        const geocodingRes = await fetch(geocodingUrl);
        const geocodingData = await geocodingRes.json();

        let validationResult = {
            isValid: false,
            formattedAddress: null,
            error: geocodingData.error_message || null,
            status: geocodingData.status
        };

        if (geocodingData.status === 'OK' && geocodingData.results && geocodingData.results.length > 0) {
            const result = geocodingData.results[0];
            validationResult = {
                isValid: true,
                formattedAddress: result.formatted_address,
                status: 'OK'
            };
        }

        // Get place photos using Places API
        let placePhotoUrl = null;
        if (validationResult.isValid) {
            // Find place using Places API
            const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(fullAddress)}&inputtype=textquery&fields=photos&key=${apiKey}`;
            const placesRes = await fetch(placesUrl);
            const placesData = await placesRes.json();

            console.log('Places API Response:', JSON.stringify(placesData, null, 2));

            if (placesData.status === 'OK' && placesData.candidates?.[0]?.photos?.[0]) {
                const photoReference = placesData.candidates[0].photos[0].photo_reference;
                placePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${apiKey}`;
            }
        }

        return Response.json({
            success: true,
            validation: validationResult,
            placePhotoUrl,
            fullAddress
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});