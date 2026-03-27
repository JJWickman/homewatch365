import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    const tenantId = user.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'No tenant found for user' }, { status: 403 });
    }

    // Verify user is admin in tenant
    const tenantUsers = await base44.asServiceRole.entities.TenantUser.filter({
      user_id: user.id,
      tenant_id: tenantId
    });
    if (tenantUsers.length === 0 || (tenantUsers[0].role_in_tenant !== 'admin' && !tenantUsers[0].is_owner)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get campaign
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaign_id, tenant_id: tenantId });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];

    if (campaign.status !== 'draft') {
      return Response.json({ error: 'Campaign is not in draft status' }, { status: 400 });
    }

    // Get template
    const templates = await base44.asServiceRole.entities.CommunicationTemplate.filter({ id: campaign.template_id });
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];

    // Determine recipients
    let clients = [];
    if (campaign.recipient_type === 'all_clients') {
      clients = await base44.asServiceRole.entities.Client.filter({ tenant_id: tenantId, is_active: true });
    } else if (campaign.recipient_type === 'selected_clients') {
      clients = await base44.asServiceRole.entities.Client.filter({
        tenant_id: tenantId,
        id: { $in: campaign.recipient_ids }
      });
    } else if (campaign.recipient_type === 'by_property_type') {
      const properties = await base44.asServiceRole.entities.Property.filter({
        tenant_id: tenantId,
        property_type: campaign.property_type_filter
      });
      const clientIds = [...new Set(properties.map(p => p.client_id))];
      clients = await base44.asServiceRole.entities.Client.filter({
        tenant_id: tenantId,
        id: { $in: clientIds }
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const client of clients) {
      const subject = template.subject ? template.subject.replace('{{client_name}}', client.first_name) : '';
      const message = template.content
        .replace('{{client_name}}', client.first_name)
        .replace('{{company_name}}', '')
        .replace('{{property_name}}', '');

      try {
        if (template.type === 'email' || campaign.type === 'email' || campaign.type === 'both') {
          if (client.email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: client.email,
              subject,
              body: message
            });
            await base44.asServiceRole.entities.CommunicationLog.create({
              tenant_id: tenantId,
              campaign_id,
              client_id: client.id,
              client_email: client.email,
              type: 'email',
              subject,
              message,
              status: 'sent',
              sent_at: new Date().toISOString()
            });
            sentCount++;
          }
        }

        if (template.type === 'sms' || campaign.type === 'sms' || campaign.type === 'both') {
          if (client.phone) {
            await base44.asServiceRole.entities.CommunicationLog.create({
              tenant_id: tenantId,
              campaign_id,
              client_id: client.id,
              client_phone: client.phone,
              type: 'sms',
              message,
              status: 'sent',
              sent_at: new Date().toISOString()
            });
            sentCount++;
          }
        }
      } catch (error) {
        failedCount++;
        await base44.asServiceRole.entities.CommunicationLog.create({
          tenant_id: tenantId,
          campaign_id,
          client_id: client.id,
          client_email: client.email,
          client_phone: client.phone,
          type: template.type,
          message,
          status: 'failed',
          error_message: error.message
        });
      }
    }

    await base44.asServiceRole.entities.Campaign.update(campaign_id, {
      status: 'sent',
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString()
    });

    return Response.json({ success: true, sent_count: sentCount, failed_count: failedCount });
  } catch (error) {
    console.error('Campaign send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});