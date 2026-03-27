import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (open && !loaded) {
      initializeChat();
    }
  }, [open, loaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const initializeChat = async () => {
    try {
      if (!user) return;

      const conversations = await base44.agents.listConversations({
        agent_name: 'supportAgent'
      });

      let activeConversation = conversations.find(c => 
        c.metadata?.user_email === user.email && 
        !c.metadata?.closed
      );

      if (!activeConversation) {
        activeConversation = await base44.agents.createConversation({
          agent_name: 'supportAgent',
          metadata: {
            user_email: user.email,
            user_name: user.full_name,
            tenant_id: user.primary_tenant_id,
            created_at: new Date().toISOString()
          }
        });
      }

      setConversation(activeConversation);
      setMessages(activeConversation.messages || []);
      setLoaded(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
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

      const unsubscribe = base44.agents.subscribeToConversation(
        conversation.id,
        (updatedConversation) => {
          setMessages(updatedConversation.messages);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
      unsubscribe();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Chat Widget */}
      {open && (
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-white" />
              <h3 className="font-semibold text-white text-sm">Support</h3>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:bg-blue-800 rounded-lg p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Ask us anything!</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 text-sm text-black"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-slate-600 hover:bg-slate-700'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
        }`}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}