import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;

  try {
    const agentName = 'supportAgent'; // or whichever agent handles AI chats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // List all conversations for the agent
    const conversations = await base44.agents.listConversations({ agent_name: agentName });

    let archivedCount = 0;

    // Filter and archive conversations older than 1 day
    for (const conv of conversations) {
      const createdDate = new Date(conv.created_date);
      if (createdDate < new Date(oneDayAgo)) {
        try {
          await base44.agents.updateConversation(conv.id, {
            metadata: {
              ...conv.metadata,
              archived: true,
              archived_date: new Date().toISOString(),
            },
          });
          archivedCount++;
        } catch (err) {
          console.error(`Failed to archive conversation ${conv.id}:`, err.message);
        }
      }
    }

    return Response.json({
      success: true,
      archivedCount,
      message: `Archived ${archivedCount} conversations older than 1 day`,
    });
  } catch (error) {
    console.error('Archive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});