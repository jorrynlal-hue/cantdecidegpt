'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'Explain quantum computing',
  'Write a Python function',
  'Help me write an email',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.content || data.message || 'No response received.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-[var(--text)]">How can I help you today?</h2>
              <p className="text-[var(--text-muted)]">Ask me anything or pick a suggestion below.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)] hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-purple-500" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-purple-500" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-[var(--surface)] border border-[var(--border)]">
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg)] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
