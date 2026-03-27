import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActiveChatsWidget() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const conversations = await base44.agents.listConversations({
        agent_name: 'supportAgent'
      });

      // Filter for active conversations (has messages in last 30 min)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const activeChats = conversations
        .filter(conv => {
          if (conv.metadata?.closed) return false;
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          if (!lastMessage) return false;
          const lastMessageTime = new Date(lastMessage.created_at || conv.created_date);
          return lastMessageTime > thirtyMinutesAgo;
        })
        .map(conv => ({
          id: conv.id,
          userEmail: conv.metadata?.user_email || 'Unknown',
          userName: conv.metadata?.user_name || 'Guest',
          messageCount: conv.messages?.length || 0,
          lastMessage: conv.messages?.[conv.messages.length - 1]?.content?.substring(0, 80),
          lastMessageTime: conv.messages?.[conv.messages.length - 1]?.created_at || conv.created_date
        }))
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setChats(activeChats);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Active Support Chats</CardTitle>
          {chats.length > 0 && (
            <Badge variant="default" className="bg-red-600 ml-2">
              {chats.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadChats}
          disabled={loading}
          className="gap-1"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">No active chats</p>
            {lastCheck && (
              <p className="text-xs text-slate-400 mt-1">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {chat.userName || chat.userEmail}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {chat.userEmail}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {getTimeAgo(chat.lastMessageTime)}
                  </span>
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    "{chat.lastMessage}..."
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {chat.messageCount} messages
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}