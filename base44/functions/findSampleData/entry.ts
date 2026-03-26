import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Search for Chevy Chase across all tenants
    const allClients = await base44.asServiceRole.entities.Client.list();
    const chevyClients = allClients.filter(c => c.first_name === 'Chevy');
    
    if (chevyClients.length > 0) {
      const sampleTenant = chevyClients[0].tenant_id;
      const clientsInTenant = allClients.filter(c => c.tenant_id === sampleTenant);
      const propertiesInTenant = await base44.asServiceRole.entities.Property.filter({ tenant_id: sampleTenant });
      
      return Response.json({
        found: true,
        sample_data_tenant_id: sampleTenant,
        clients_count: clientsInTenant.length,
        properties_count: propertiesInTenant.length,
        sample_clients: clientsInTenant.map(c => `${c.first_name} ${c.last_name}`),
        sample_properties: propertiesInTenant.map(p => `${p.name} (${p.city})`)
      });
    }

    return Response.json({ found: false, message: 'No sample data found' });

  } catch (error) {
    console.error('Error in findSampleData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});