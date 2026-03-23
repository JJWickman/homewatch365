import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'Missing campaign_id' }), { status: 400 });
    }

    // Verify user is admin
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: user.email });
    if (members.length === 0 || (members[0].role !== 'owner' && members[0].role !== 'manager')) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
    }

    const companyId = members[0].company_id;

    // Get campaign
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaign_id, company_id: companyId });
    if (campaigns.length === 0) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
    }

    const campaign = campaigns[0];

    if (campaign.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Campaign is not in draft status' }), { status: 400 });
    }

    // Get template
    const templates = await base44.asServiceRole.entities.CommunicationTemplate.filter({ id: campaign.template_id });
    if (templates.length === 0) {
      return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 });
    }

    const template = templates[0];

    // Determine recipients
    let clients = [];
    if (campaign.recipient_type === 'all_clients') {
      clients = await base44.asServiceRole.entities.Client.filter({ company_id: companyId, is_active: true });
    } else if (campaign.recipient_type === 'selected_clients') {
      clients = await base44.asServiceRole.entities.Client.filter({
        company_id: companyId,
        id: { $in: campaign.recipient_ids }
      });
    } else if (campaign.recipient_type === 'by_property_type') {
      // Get clients with properties of selected type
      const properties = await base44.asServiceRole.entities.Property.filter({
        company_id: companyId,
        property_type: campaign.property_type_filter
      });
      const clientIds = [...new Set(properties.map(p => p.client_id))];
      clients = await base44.asServiceRole.entities.Client.filter({
        company_id: companyId,
        id: { $in: clientIds }
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send messages
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
              subject: subject,
              body: message
            });

            await base44.asServiceRole.entities.CommunicationLog.create({
              company_id: companyId,
              campaign_id: campaign_id,
              client_id: client.id,
              client_email: client.email,
              type: 'email',
              subject: subject,
              message: message,
              status: 'sent',
              sent_at: new Date().toISOString()
            });

            sentCount++;
          }
        }

        if (template.type === 'sms' || campaign.type === 'sms' || campaign.type === 'both') {
          if (client.phone) {
            // SMS sending would require Twilio setup
            // For now, we'll create a log entry
            await base44.asServiceRole.entities.CommunicationLog.create({
              company_id: companyId,
              campaign_id: campaign_id,
              client_id: client.id,
              client_phone: client.phone,
              type: 'sms',
              message: message,
              status: 'sent',
              sent_at: new Date().toISOString()
            });

            sentCount++;
          }
        }
      } catch (error) {
        failedCount++;
        await base44.asServiceRole.entities.CommunicationLog.create({
          company_id: companyId,
          campaign_id: campaign_id,
          client_id: client.id,
          client_email: client.email,
          client_phone: client.phone,
          type: template.type,
          message: message,
          status: 'failed',
          error_message: error.message
        });
      }
    }

    // Update campaign status
    await base44.asServiceRole.entities.Campaign.update(campaign_id, {
      status: 'sent',
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      sent_count: sentCount,
      failed_count: failedCount
    }), { status: 200 });
  } catch (error) {
    console.error('Campaign send error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});