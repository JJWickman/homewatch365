import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.primary_tenant_id;

    // Get all clients and properties
    const [allClients, allProperties] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Property.list()
    ]);

    // Keep only first 6 clients
    const clientsToKeep = allClients.slice(0, 6);
    const clientsToDelete = allClients.slice(6);

    // Keep only properties on Boca Grande, first 6
    const bocaGrandeProps = allProperties.filter(p => p.city === 'Boca Grande').slice(0, 6);
    const propertiesToDelete = allProperties.filter(p => 
      !bocaGrandeProps.find(bg => bg.id === p.id)
    );

    // Delete extra clients
    let deletedClients = 0;
    for (const client of clientsToDelete) {
      await base44.entities.Client.update(client.id, { is_active: false });
      deletedClients++;
    }

    // Delete extra properties
    let deletedProperties = 0;
    for (const property of propertiesToDelete) {
      await base44.entities.Property.update(property.id, { is_active: false });
      deletedProperties++;
    }

    return Response.json({
      success: true,
      kept_clients: clientsToKeep.length,
      deleted_clients: deletedClients,
      kept_properties: bocaGrandeProps.length,
      deleted_properties: deletedProperties
    });
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});