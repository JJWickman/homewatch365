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

        const apiKey = Deno.env.get('API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'API key not configured' }, { status: 500 });
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
            lng: null,
            error: geocodingData.error_message || null,
            status: geocodingData.status
        };

        if (geocodingData.status === 'OK' && geocodingData.results && geocodingData.results.length > 0) {
            const result = geocodingData.results[0];
            validationResult = {
                isValid: true,
                formattedAddress: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                status: 'OK'
            };
        }

        // Test 2: Fetch Aerial View video
         let aerialViewData = null;
         if (validationResult.isValid) {
             const aerialViewUrl = `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${apiKey}&address=${encodeURIComponent(fullAddress)}`;
             
             const aerialResponse = await fetch(aerialViewUrl);
             const aerialData = await aerialResponse.json();
             
             if (aerialData.state === 'ACTIVE' || aerialData.state === 'PROCESSING') {
                 aerialViewData = {
                     state: aerialData.state,
                     uris: aerialData.uris,
                     metadata: aerialData.metadata
                 };
             } else {
                 aerialViewData = {
                     state: aerialData.state || 'NOT_AVAILABLE',
                     error: aerialData.error?.message || 'Aerial view not available for this location'
                 };
             }
         }

        return Response.json({
            success: true,
            validation: validationResult,
            aerialView: aerialViewData,
            fullAddress
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});