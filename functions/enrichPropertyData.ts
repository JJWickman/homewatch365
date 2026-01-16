import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { address, city, state, zip } = body;

    if (!address || !city || !state) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Look up property details for: ${fullAddress}
      
Search for publicly available information about this residential property including:
- Number of bedrooms (estimate from property records/listings)
- Number of bathrooms (estimate from property records/listings)
- Square footage (look up from tax records, Zillow, Redfin if available)
- Property type (single family, condo, townhouse, etc. from property records)

If you cannot find exact information, use reasonable estimates based on property age, location, and similar properties in the area.
Return only the data you can find or reasonably estimate.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          bedrooms: { type: "number", description: "Number of bedrooms" },
          bathrooms: { type: "number", description: "Number of bathrooms" },
          square_feet: { type: "number", description: "Square footage of the property" },
          property_type: { 
            type: "string",
            enum: ["single_family", "condo", "townhouse", "estate", "commercial"],
            description: "Type of property"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level of the data found"
          },
          source: {
            type: "string",
            description: "Where the data was sourced from (e.g., county records, Zillow, etc.)"
          }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error enriching property data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});