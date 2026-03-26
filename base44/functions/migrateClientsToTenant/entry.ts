import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.primary_tenant_id) {
      return Response.json({ error: 'Unauthorized or no tenant' }, { status: 401 });
    }

    // Find all Clients with missing or null tenant_id
    const allClients = await base44.asServiceRole.entities.Client.list('-created_date', 1000);
    const clientsToMigrate = allClients.filter(c => !c.tenant_id);

    if (clientsToMigrate.length === 0) {
      return Response.json({ success: true, migrated: 0, message: 'No clients to migrate' });
    }

    // Update each client to have the current user's tenant_id
    let migrated = 0;
    for (const client of clientsToMigrate) {
      try {
        await base44.asServiceRole.entities.Client.update(client.id, {
          tenant_id: user.primary_tenant_id
        });
        migrated++;
      } catch (e) {
        console.error(`Failed to migrate client ${client.id}:`, e);
      }
    }

    return Response.json({
      success: true,
      migrated,
      total: clientsToMigrate.length,
      message: `Migrated ${migrated} client(s) to tenant ${user.primary_tenant_id}`
    });

  } catch (error) {
    console.error('Error migrating clients:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});