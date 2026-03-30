import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send, Plus, MessageSquare, Trash2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'estate_assistant';
const PERSONA_IMAGE = 'https://media.base44.com/images/public/696806e88e744d6cc803e3bb/96ac7664c_generated_image.png';

export default function AIAssistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [user, setUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setTenantId(currentUser?.primary_tenant_id);
    };
    initUser();
  }, []);

  useEffect(() => {
    if (tenantId) loadConversations();
  }, [tenantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation?.id) return;
    try {
      const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return unsub;
    } catch (e) {
      console.warn('Subscription error:', e);
    }
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    try {
      const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      // Filter by tenant isolation and exclude archived chats
      const filtered = (convos || []).filter(conv => 
        conv.metadata?.tenant_id === tenantId && 
        !conv.metadata?.archived
      );
      setConversations(filtered);
      if (filtered?.length > 0) {
        selectConversation(filtered[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvos(false);
    }
  };

  const selectConversation = async (convo) => {
    try {
      const full = await base44.agents.getConversation(convo.id);
      setActiveConversation(full);
      setMessages(full.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewConversation = async () => {
    try {
      const convo = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Chat ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, tenant_id: tenantId }
      });
      setConversations(prev => [convo, ...prev]);
      setActiveConversation(convo);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    let convo = activeConversation;
    if (!convo) {
     convo = await base44.agents.createConversation({
       agent_name: AGENT_NAME,
       metadata: { name: `Chat ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, tenant_id: tenantId }
     });
      setConversations(prev => [convo, ...prev]);
      setActiveConversation(convo);
    }

    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      await base44.agents.addMessage(convo, { role: 'user', content: text });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isTyping = sending || messages[messages.length - 1]?.role === 'user';

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-2 shrink-0">
        {/* Agent persona card */}
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/40 shadow p-4 flex flex-col items-center gap-2 text-center">
          <img
            src={PERSONA_IMAGE}
            alt="My Home Watch Advocate"
            className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-900/20 shadow-lg"
          />
          <div>
            <p className="font-semibold text-slate-800 text-sm">My Home Watch Advocate</p>

          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-full px-2 py-0.5 border border-green-200">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Online
          </div>
        </div>

        {/* New Chat */}
        <Button onClick={startNewConversation} className="w-full gap-2 bg-blue-900 hover:bg-blue-800 text-white">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingConvos ? (
            <div className="text-center text-xs text-slate-400 py-4">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-4">No conversations yet</div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => selectConversation(convo)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 truncate ${
                  activeConversation?.id === convo.id
                    ? 'bg-blue-900/15 text-blue-900 font-medium'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{convo.metadata?.name || 'Chat'}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white/70 backdrop-blur rounded-xl border border-white/40 shadow overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100/60 bg-white/60 shrink-0">
          <img src={PERSONA_IMAGE} alt="EW365" className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-900/20" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">My Home Watch Advocate</p>
            <p className="text-xs text-slate-400">Ask about properties, visits, clients & more</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <img src={PERSONA_IMAGE} alt="EW365" className="h-20 w-20 rounded-full opacity-70 ring-4 ring-blue-900/10" />
              <div>
                <p className="text-slate-600 font-medium">How can I help you today?</p>
                <p className="text-sm text-slate-400 mt-1">Ask me about properties, visits, clients, or contractors.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full mt-2">
                {[
                  'Show me upcoming visits',
                  'List properties needing attention',
                  'Which contractors are active?',
                  'Summarize recent check-ins'
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="text-xs text-left px-3 py-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <img src={PERSONA_IMAGE} alt="EW365" className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-blue-900/10" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-900 text-white rounded-br-sm'
                    : 'bg-slate-100/80 text-slate-800 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="my-1">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3 justify-start">
              <img src={PERSONA_IMAGE} alt="EW365" className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-blue-900/10" />
              <div className="bg-slate-100/80 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100/60 bg-white/60 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your properties, visits, clients..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-900/30 focus:border-blue-300 transition-all min-h-[42px] max-h-32"
              style={{ fieldSizing: 'content' }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="h-10 w-10 p-0 rounded-xl bg-blue-900 hover:bg-blue-800 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}