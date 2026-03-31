import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TENANT_ID = "69c4784908cbd3c8bce515f0";
const USER_ID = "696806e88e744d6cc803e3bc";

const CLIENTS = [
  { first_name: "Clark", last_name: "Griswold", email: "clark.griswold@gmail.com", phone: "312-555-0101", city: "Chicago", state: "IL" },
  { first_name: "Ferris", last_name: "Bueller", email: "ferris.bueller@outlook.com", phone: "312-555-0202", city: "Chicago", state: "IL" },
  { first_name: "Frank", last_name: "Drebin", email: "f.drebin@police.com", phone: "213-555-0404", city: "Los Angeles", state: "CA" },
  { first_name: "Lloyd", last_name: "Christmas", email: "lloyd.christmas@gmail.com", phone: "603-555-0606", city: "Providence", state: "RI" },
  { first_name: "Harry", last_name: "Dunne", email: "harry.dunne@icloud.com", phone: "603-555-0707", city: "Providence", state: "RI" },
  { first_name: "Phil", last_name: "Connors", email: "phil.connors@wptv.com", phone: "814-555-0808", city: "Punxsutawney", state: "PA" },
  { first_name: "Derek", last_name: "Zoolander", email: "derek@zoolander.com", phone: "212-555-0909", city: "New York", state: "NY" },
  { first_name: "Ron", last_name: "Burgundy", email: "ron.burgundy@kvwn.com", phone: "619-555-1010", city: "San Diego", state: "CA" },
  { first_name: "Navin", last_name: "Johnson", email: "navin.johnson@gmail.com", phone: "504-555-1111", city: "New Orleans", state: "LA" },
  { first_name: "Buddy", last_name: "Elf", email: "buddy.elf@northpole.com", phone: "212-555-1212", city: "New York", state: "NY" },
];

const PROPERTIES = [
  { name: "Griswold Family Getaway", address: "121 Gulf Blvd", property_type: "single_family", bedrooms: 4, bathrooms: 3, square_feet: 2800, status: "seasonal", visit_frequency: "weekly", notes: "Large pool, hurricane shutters on all windows. Owner insists on decorating for every holiday." },
  { name: "Bueller Day Off Bungalow", address: "45 Park Ave", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 1850, status: "seasonal", visit_frequency: "bi_weekly", notes: "Gated community. Owner rarely visits but wants weekly updates." },
  { name: "Drebin Detective Hideout", address: "310 Boca Grande Causeway", property_type: "condo", bedrooms: 2, bathrooms: 2, square_feet: 1400, status: "seasonal", visit_frequency: "weekly", notes: "Unit 2B. Owner may arrive unannounced and ask suspicious questions. This is normal." },
  { name: "Christmas Shack", address: "88 Lighthouse Ave", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 1600, status: "vacant", visit_frequency: "weekly", notes: "Owner is a very optimistic traveler. Property sometimes smells of exotic birds." },
  { name: "Dunne & Done Retreat", address: "22 Banyan St", property_type: "single_family", bedrooms: 2, bathrooms: 1, square_feet: 1200, status: "seasonal", visit_frequency: "bi_weekly", notes: "Owners are best friends who share the property. One may occasionally lock the other out by accident." },
  { name: "Connors Groundhog Cottage", address: "57 Pine Ave", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 2000, status: "seasonal", visit_frequency: "weekly", notes: "Owner feels like he has visited this property many, many times before." },
  { name: "Blue Steel Beach House", address: "100 Harbor Dr Unit 4B", property_type: "condo", bedrooms: 2, bathrooms: 2, square_feet: 1550, status: "seasonal", visit_frequency: "weekly", notes: "Very good looking property. Owner insists the unit be 'just really really ridiculously well kept.'" },
  { name: "Burgundy Manor", address: "7 Gasparilla Rd", property_type: "estate", bedrooms: 5, bathrooms: 4, square_feet: 4200, status: "occupied", visit_frequency: "weekly", notes: "Owner is a local celebrity. Jazz flute may be heard from neighbors. Stay classy." },
  { name: "Johnson Special Place", address: "200 Wheeler Rd", property_type: "single_family", bedrooms: 3, bathrooms: 2, square_feet: 2100, status: "seasonal", visit_frequency: "bi_weekly", notes: "Owner is excited by simple things. Phone book delivery is considered a highlight of the visit." },
  { name: "Elf on the Shelf Estate", address: "14 Gilchrist Ave", property_type: "single_family", bedrooms: 4, bathrooms: 3, square_feet: 2600, status: "seasonal", visit_frequency: "weekly", notes: "Owner only visits in December. House must be candy-cane ready by November 1st." },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin gate
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const sr = base44.asServiceRole;

    // Fix jasonwi's user data fields so RLS works going forward
    await sr.entities.User.update(USER_ID, {
      primary_tenant_id: TENANT_ID,
      onboarding_completed: true,
    });

    const results = [];

    for (let i = 0; i < CLIENTS.length; i++) {
      const clientData = CLIENTS[i];
      const propData = PROPERTIES[i];
      const rates = [350, 275, 425, 300, 500, 250, 375, 450, 225, 400];

      const client = await sr.entities.Client.create({
        tenant_id: TENANT_ID,
        ...clientData,
        is_active: true,
        portal_access: true,
        billing_frequency: "monthly",
        billing_status: "active",
        monthly_rate: rates[i],
      });

      const property = await sr.entities.Property.create({
        tenant_id: TENANT_ID,
        client_id: client.id,
        ...propData,
        city: "Boca Grande",
        state: "FL",
        zip: "33921",
        is_active: true,
      });

      results.push({
        client: `${clientData.first_name} ${clientData.last_name}`,
        property: propData.name,
        client_id: client.id,
        property_id: property.id,
      });
    }

    return Response.json({ success: true, count: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});