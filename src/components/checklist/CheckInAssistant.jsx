import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'estate_assistant';
const PERSONA_IMAGE = 'https://media.base44.com/images/public/696806e88e744d6cc803e3bb/96ac7664c_generated_image.png';

const QUICK_QUESTIONS = [
  'What should I look for here?',
  'How do I check the water heater?',
  'What counts as an issue vs. urgent?',
  'Tips for documenting a problem?',
];

export default function CheckInAssistant({ property, visit }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const initConversation = async () => {
    if (conversation) return;
    const propertyName = property?.name || property?.address || 'this property';
    const convo = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Check-In: ${propertyName}` }
    });
    // Send context-setting first message silently
    const contextMsg = `I'm currently doing a home watch visit at ${propertyName}${property?.city ? `, ${property.city}` : ''}. The property type is ${property?.property_type?.replace('_', ' ') || 'residential'}. Please help me with questions I have during this check-in.`;
    await base44.agents.addMessage(convo, { role: 'user', content: contextMsg });
    const full = await base44.agents.getConversation(convo.id);
    setConversation(full);
    // Only show assistant messages (hide the context-setting user message)
    setMessages((full.messages || []).filter(m => m.role !== 'user'));
  };

  const handleOpen = async () => {
    setOpen(true);
    await initConversation();
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
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

  const isTyping = sending || (messages.length > 0 && messages[messages.length - 1]?.role === 'user');

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-blue-900 text-white pl-3 pr-4 py-3 rounded-full shadow-2xl hover:bg-blue-800 active:scale-95 transition-all"
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-semibold">Ask AI</span>
        </button>
      )}

      {/* Slide-up Panel */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <div
          className={`relative bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: '75vh', maxHeight: '600px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <img src={PERSONA_IMAGE} alt="AI" className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-900/20" />
              <div>
                <p className="font-semibold text-slate-800 text-sm leading-tight">Check-In Assistant</p>
                <p className="text-xs text-slate-400">Ask anything about this visit</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !sending && (
              <div className="flex flex-col items-center text-center gap-3 py-6">
                <img src={PERSONA_IMAGE} alt="AI" className="h-14 w-14 rounded-full opacity-80 ring-4 ring-blue-900/10" />
                <div>
                  <p className="font-medium text-slate-700 text-sm">I'm here to help!</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ask me anything about this check-in</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs text-left px-3 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 active:bg-blue-100 transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <img src={PERSONA_IMAGE} alt="AI" className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-blue-900/10" />
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-900 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
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
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <img src={PERSONA_IMAGE} alt="AI" className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-blue-900/10" />
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1 items-center">
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-safe py-3 border-t border-slate-100 bg-white shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this check-in..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-900/30 focus:border-blue-300 transition-all min-h-[42px] max-h-28"
                style={{ fieldSizing: 'content' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-900 text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}