import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TENANT_ID = "69c4784908cbd3c8bce515f0";
const COMPANY_ID = "69680a583d8f37520c3407ff";

const CLIENTS = [
  { first_name: "Robert", last_name: "Harrington", email: "r.harrington@gmail.com", phone: "312-555-0101", city: "Chicago", state: "IL" },
  { first_name: "Margaret", last_name: "Caldwell", email: "m.caldwell@outlook.com", phone: "617-555-0202", city: "Boston", state: "MA" },
  { first_name: "Thomas", last_name: "Weston", email: "t.weston@gmail.com", phone: "212-555-0303", city: "New York", state: "NY" },
  { first_name: "Patricia", last_name: "Oakes", email: "p.oakes@yahoo.com", phone: "404-555-0404", city: "Atlanta", state: "GA" },
  { first_name: "James", last_name: "Whitmore", email: "j.whitmore@gmail.com", phone: "216-555-0505", city: "Cleveland", state: "OH" },
  { first_name: "Eleanor", last_name: "Fontaine", email: "e.fontaine@gmail.com", phone: "502-555-0606", city: "Louisville", state: "KY" },
  { first_name: "William", last_name: "Prescott", email: "w.prescott@icloud.com", phone: "313-555-0707", city: "Detroit", state: "MI" },
  { first_name: "Susan", last_name: "Langley", email: "s.langley@outlook.com", phone: "215-555-0808", city: "Philadelphia", state: "PA" },
  { first_name: "Charles", last_name: "Drummond", email: "c.drummond@gmail.com", phone: "614-555-0909", city: "Columbus", state: "OH" },
  { first_name: "Dorothy", last_name: "Ashford", email: "d.ashford@gmail.com", phone: "317-555-1010", city: "Indianapolis", state: "IN" },
];

const PROPERTIES = [
  { name: "Gulf Breeze Cottage", address: "121 Gulf Blvd", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 1850, status: "seasonal", visit_frequency: "weekly", notes: "Large pool, hurricane shutters on all windows." },
  { name: "Palm Point Retreat", address: "45 Park Ave", property_type: "single_family", bedrooms: 4, bathrooms: 3, square_feet: 2400, status: "seasonal", visit_frequency: "bi_weekly", notes: "Gated community, call ahead for entry code." },
  { name: "Boca Bay Villa", address: "310 Boca Grande Causeway", property_type: "condo", bedrooms: 2, bathrooms: 2, square_feet: 1400, status: "seasonal", visit_frequency: "weekly", notes: "2nd floor unit. No pool on-site, community pool only." },
  { name: "The Lighthouse House", address: "88 Lighthouse Ave", property_type: "single_family", bedrooms: 5, bathrooms: 4, square_feet: 3600, status: "seasonal", visit_frequency: "weekly", notes: "Waterfront estate. Boat dock included in inspection." },
  { name: "Tarpon Haven", address: "22 Banyan St", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 2100, status: "vacant", visit_frequency: "bi_weekly", notes: "Property listed for sale. Keep exterior pristine." },
  { name: "Island Pines Bungalow", address: "57 Pine Ave", property_type: "single_family", bedrooms: 2, bathrooms: 1, square_feet: 1200, status: "seasonal", visit_frequency: "monthly", notes: "Small yard with native landscaping. Owner visits in winter." },
  { name: "Whidden's Wharf Condo", address: "100 Harbor Dr Unit 4B", property_type: "condo", bedrooms: 3, bathrooms: 2, square_feet: 1650, status: "seasonal", visit_frequency: "weekly", notes: "Marina views. Elevator access required. Front desk sign-in." },
  { name: "Sea Oats Sanctuary", address: "7 Gasparilla Rd", property_type: "single_family", bedrooms: 4, bathrooms: 3, square_feet: 2800, status: "seasonal", visit_frequency: "weekly", notes: "Electric storm shutters on lanai. Pool with salt system." },
  { name: "Pelican Perch Estate", address: "200 Wheeler Rd", property_type: "estate", bedrooms: 6, bathrooms: 5, square_feet: 5200, status: "occupied", visit_frequency: "weekly", notes: "High-value property. Full smart home system. Contact owner before any service." },
  { name: "Mangrove Mews Townhouse", address: "14 Gilchrist Ave", property_type: "townhouse", bedrooms: 3, bathrooms: 2, square_feet: 1950, status: "seasonal", visit_frequency: "bi_weekly", notes: "End unit. Shared wall on one side. HOA handles exterior lawn." },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const sr = base44.asServiceRole;
    const results = [];

    for (let i = 0; i < CLIENTS.length; i++) {
      const clientData = CLIENTS[i];
      const propData = PROPERTIES[i];

      // Create client
      const client = await sr.entities.Client.create({
        tenant_id: TENANT_ID,
        ...clientData,
        is_active: true,
        portal_access: true,
        billing_frequency: "monthly",
        billing_status: "active",
        monthly_rate: [350, 275, 425, 300, 500, 250, 375, 450, 225, 400][i],
      });

      // Create property linked to client
      const property = await sr.entities.Property.create({
        tenant_id: TENANT_ID,
        client_id: client.id,
        ...propData,
        city: "Boca Grande",
        state: "FL",
        zip: "33921",
        latitude: 26.7495 + (Math.random() - 0.5) * 0.04,
        longitude: -82.2609 + (Math.random() - 0.5) * 0.04,
        is_active: true,
      });

      results.push({ client: `${clientData.first_name} ${clientData.last_name}`, property: propData.name, client_id: client.id, property_id: property.id });
    }

    return Response.json({ success: true, count: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});