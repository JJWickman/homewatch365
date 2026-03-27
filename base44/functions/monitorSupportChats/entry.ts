import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger this
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all conversations for the support agent
    const conversations = await base44.agents.listConversations({
      agent_name: 'supportAgent'
    });

    // Filter for active conversations (not closed, has messages in last 30 min)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeConversations = conversations.filter(conv => {
      if (conv.metadata?.closed) return false;
      const lastMessage = conv.messages?.[conv.messages.length - 1];
      if (!lastMessage) return false;
      const lastMessageTime = new Date(lastMessage.created_at || conv.created_date);
      return lastMessageTime > thirtyMinutesAgo;
    });

    if (activeConversations.length === 0) {
      return Response.json({ active: [], sent: false });
    }

    // Get tenant info for email
    const tenant = await base44.entities.Tenant.list();
    const tenantData = tenant[0];
    const billingEmail = tenantData?.billing_email || user.email;

    // Format conversation summary
    const conversationsSummary = activeConversations.map(conv => {
      const userEmail = conv.metadata?.user_email || 'Unknown';
      const lastMessage = conv.messages?.[conv.messages.length - 1];
      const messagePreview = lastMessage?.content?.substring(0, 100) || 'No messages';
      return `- ${userEmail}: "${messagePreview}..."`;
    }).join('\n');

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: billingEmail,
      subject: `[Support Alert] ${activeConversations.length} Active Chat(s)`,
      body: `You have ${activeConversations.length} active support conversations:\n\n${conversationsSummary}\n\nLog in to view and respond.`
    });

    return Response.json({
      active: activeConversations.map(c => ({
        id: c.id,
        userEmail: c.metadata?.user_email,
        userName: c.metadata?.user_name,
        messageCount: c.messages?.length || 0,
        lastMessage: c.messages?.[c.messages.length - 1]?.content?.substring(0, 100)
      })),
      sent: true,
      notifiedTo: billingEmail
    });
  } catch (error) {
    console.error('Error monitoring support chats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});