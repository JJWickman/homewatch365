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

        // Fetch Aerial View video
         let aerialViewData = null;
         if (validationResult.isValid) {
             const aerialViewUrl = `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${apiKey}`;
             
             const aerialResponse = await fetch(aerialViewUrl, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                     address: fullAddress
                 })
             });
             const aerialData = await aerialResponse.json();
             
             console.log('Aerial View API Response:', JSON.stringify(aerialData, null, 2));
             
             if (aerialData.error) {
                 aerialViewData = {
                     state: 'ERROR',
                     error: aerialData.error.message || 'API Error',
                     errorDetails: aerialData.error
                 };
             } else if (aerialData.state === 'ACTIVE' || aerialData.state === 'PROCESSING') {
                 aerialViewData = {
                     state: aerialData.state,
                     uris: aerialData.uris,
                     metadata: aerialData.metadata
                 };
             } else {
                 aerialViewData = {
                     state: aerialData.state || 'NOT_AVAILABLE',
                     error: 'Aerial view not available for this location'
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