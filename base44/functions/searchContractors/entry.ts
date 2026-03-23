import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { service_type, address, radius_miles, min_rating, company_id } = body;

    if (!service_type || !address) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `Search for contractors on Google Business, Facebook Business, and Yelp matching these criteria:
- Service Type: ${service_type}
- Location: ${address}
- Search Radius: ${radius_miles || 25} miles
- Minimum Rating: ${min_rating || 3.5} stars

Return a list of contractors with their:
- Business name
- Service type/specialty
- Rating and review count
- Phone number (if available)
- Address
- Website or profile URL
- Source (Google Business, Facebook, Yelp)
- Number of reviews

Focus on top-rated, verified contractors. Return results in order of rating (highest first).`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          contractors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                business_name: { type: "string" },
                service_type: { type: "string" },
                rating: { type: "number" },
                review_count: { type: "number" },
                phone: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zip: { type: "string" },
                website: { type: "string" },
                source: { type: "string" },
                source_url: { type: "string" }
              }
            }
          },
          search_summary: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error searching contractors:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});