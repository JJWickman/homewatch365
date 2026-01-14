import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { address, city, state, zip } = await req.json();
        
        if (!address || !city || !state) {
            return Response.json({ error: 'Address, city, and state are required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
        }

        const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;

        // Test 1: Address Validation using Geocoding API
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
        const geocodingRes = await fetch(geocodingUrl);
        const geocodingData = await geocodingRes.json();

        let validationResult = {
            isValid: false,
            formattedAddress: null,
            lat: null,
            lng: null
        };

        if (geocodingData.results && geocodingData.results.length > 0) {
            const result = geocodingData.results[0];
            validationResult = {
                isValid: true,
                formattedAddress: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            };
        }

        // Test 2: Street View image (if valid address)
        let streetViewUrl = null;
        if (validationResult.isValid) {
            streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=1200x400&location=${validationResult.lat},${validationResult.lng}&heading=0&pitch=10&key=${apiKey}`;
        }

        // Test 3: Static map with marker
        let staticMapUrl = null;
        if (validationResult.isValid) {
            staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${validationResult.lat},${validationResult.lng}&zoom=17&size=600x400&markers=color:red%7C${validationResult.lat},${validationResult.lng}&key=${apiKey}`;
        }

        return Response.json({
            success: true,
            validation: validationResult,
            streetViewUrl,
            staticMapUrl,
            fullAddress
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});