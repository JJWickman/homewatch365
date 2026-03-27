import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function SupportChat() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load or create conversation
      const conversations = await base44.agents.listConversations({
        agent_name: 'supportAgent'
      });

      let activeConversation = conversations.find(c => 
        c.metadata?.user_email === currentUser.email && 
        !c.metadata?.closed
      );

      if (!activeConversation) {
        activeConversation = await base44.agents.createConversation({
          agent_name: 'supportAgent',
          metadata: {
            user_email: currentUser.email,
            user_name: currentUser.full_name,
            tenant_id: currentUser.primary_tenant_id,
            created_at: new Date().toISOString()
          }
        });
      }

      setConversation(activeConversation);
      setMessages(activeConversation.messages || []);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !conversation) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });

      // Subscribe to updates while agent responds
      const unsubscribe = base44.agents.subscribeToConversation(
        conversation.id,
        (updatedConversation) => {
          setMessages(updatedConversation.messages);
        }
      );

      // Wait a bit for agent to start processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      unsubscribe();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">Support Assistant</h1>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              Online 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Start a conversation with our support team</p>
              <p className="text-sm text-slate-400 mt-1">Ask about troubleshooting, billing, features, or anything else</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mt-2 text-xs opacity-70 border-t border-current pt-2">
                    <p className="font-medium">Actions taken:</p>
                    {msg.tool_calls.map((tc, i) => (
                      <p key={i}>• {tc.name}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question or describe your issue..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 text-black"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}