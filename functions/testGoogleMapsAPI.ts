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

        // Generate Aerial View using Static Maps API with satellite imagery
        let aerialViewUrl = null;
        let coordinates = null;
        let aerialVideoData = null;
        if (validationResult.isValid && geocodingData.results?.[0]?.geometry?.location) {
            const location = geocodingData.results[0].geometry.location;
            coordinates = {
                lat: location.lat,
                lng: location.lng
            };
            
            // Use Static Maps API with satellite maptype for aerial view
            aerialViewUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=19&size=800x600&maptype=satellite&key=${apiKey}`;
            
            // Check for Aerial View API video availability
            const aerialViewApiUrl = `https://aerialview.googleapis.com/v1/videos:lookupVideoMetadata?key=${apiKey}`;
            const aerialViewBody = {
                address: fullAddress
            };
            
            try {
                const aerialViewRes = await fetch(aerialViewApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aerialViewBody)
                });
                const aerialViewData = await aerialViewRes.json();
                
                console.log('Aerial View API Response:', JSON.stringify(aerialViewData, null, 2));
                
                if (aerialViewData.state === 'PROCESSING_COMPLETE' && aerialViewData.videoId) {
                    aerialVideoData = {
                        videoId: aerialViewData.videoId,
                        state: aerialViewData.state,
                        metadata: aerialViewData
                    };
                } else {
                    aerialVideoData = {
                        videoId: null,
                        state: aerialViewData.state || aerialViewData.error?.status || 'NOT_AVAILABLE',
                        error: aerialViewData.error
                    };
                }
            } catch (aerialError) {
                console.error('Aerial View API Error:', aerialError);
                aerialVideoData = {
                    videoId: null,
                    state: 'ERROR',
                    error: aerialError.message
                };
            }
        }

        return Response.json({
            success: true,
            validation: validationResult,
            aerialViewUrl,
            aerialVideoData,
            coordinates,
            fullAddress
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});