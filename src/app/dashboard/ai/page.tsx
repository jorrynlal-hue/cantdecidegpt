'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Sparkles, Save, Trash2, Wand2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { ai } from '@/lib/core/client';

interface ContentRow { id: string; title: string; prompt: string; content: string; createdAt: string; }
interface Msg { id: number; role: 'user' | 'assistant'; text: string; }

const tips = ['Summarize my latest document', 'Create a task: website copy review', 'What does my analytics say?', 'Search my workspace for invoices', 'Help me pick a marketing goal'];

export function AiStudioInner() {
  const params = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [tab, setTab] = useState<'assistant' | 'generate' | 'content'>(initialQ ? 'assistant' : 'assistant');
  const [msgs, setMsgs] = useState<Msg[]>(() => initialQ ? [{ id: Date.now(), role: 'user', text: initialQ }] : []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const content = useCollection<ContentRow>('content', {});

  const [genKind, setGenKind] = useState('content');
  const [genPrompt, setGenPrompt] = useState('');
  const [genResult, setGenResult] = useState<{ text: string; provider: string; kind: string } | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genSaved, setGenSaved] = useState(false);

  const ask = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    const userMsg: Msg = { id: Date.now(), role: 'user', text: q };
    setMsgs((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const res = await ai.assistantChat(q);
      setMsgs((m) => [...m, { id: Date.now(), role: 'assistant', text: res.reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { id: Date.now(), role: 'assistant', text: `Error: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenBusy(true);
    setGenSaved(false);
    try {
      const res = await ai.generate(genKind, genPrompt);
      setGenResult({ text: res.outcome.output, provider: res.outcome.provider, kind: genKind });
    } catch (e) {
      setGenResult({ text: `Error: ${(e as Error).message}`, provider: 'none', kind: genKind });
    } finally {
      setGenBusy(false);
    }
  };

  const saveContent = async () => {
    if (!genResult) return;
    try {
      await fetch('/api/db/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: genPrompt.slice(0, 80), prompt: genPrompt, content: genResult.text, kind: genKind }),
      });
      setGenSaved(true);
      content.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, busy]);

  useEffect(() => {
    if (initialQ) ask(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">AI Studio</h1>
          <p className="text-xs text-gray-500 mt-0.5">Assistant + Universal Actions, generation suite, and saved content.</p>
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(['assistant', 'generate', 'content'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'assistant' && (
        <Card className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-center text-[11px] text-gray-600">The assistant can run Universal Actions (create task, customer, invoice, campaign, content…) and answer from search + analytics.</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {tips.map((t) => (
                <button key={t} onClick={() => ask(t)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-gray-400 hover:text-white hover:border-purple-500/40">{t}</button>
              ))}
            </div>
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-[#17171f] text-gray-200 border border-white/5'}`}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><p className="rounded-xl bg-[#17171f] border border-white/5 px-3 py-2 text-xs text-gray-400">Thinking…</p></div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-white/5 p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="Type a message or tool call like /run create_task {...}"
              className="flex-1 rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
            />
            <Btn onClick={() => ask()} disabled={busy || !input.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Btn>
          </div>
        </Card>
      )}

      {tab === 'generate' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Generate" sub="Prompt-based generation through your configured providers" />
            <div className="p-4 space-y-3">
              <Field label="Output type">
                <Select value={genKind} onChange={setGenKind} options={['content', 'image', 'video', 'code', 'voice', 'transcription', 'speech', 'narrative', 'poetry', 'email'].map((k) => ({ label: k, value: k }))} />
              </Field>
              <Field label="Prompt"><Textarea value={genPrompt} onChange={setGenPrompt} rows={5} placeholder="Describe what you want..." /></Field>
              <Btn onClick={runGenerate} disabled={genBusy || !genPrompt.trim()}>
                {genBusy ? <Spinner /> : <Wand2 className="w-3.5 h-3.5" />} {genBusy ? 'Generating…' : 'Generate'}
              </Btn>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Result"
              sub={genResult ? `via ${genResult.provider} (${genResult.kind})` : 'Nothing yet'}
              right={genResult && !genSaved ? <Btn kind="outline" small onClick={saveContent}><Save className="w-3.5 h-3.5" /> Save to content</Btn> : genSaved ? <Badge tone="green">saved</Badge> : undefined}
            />
            <div className="p-4">
              {genResult ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 max-h-[60vh] overflow-y-auto">{genResult.text}</pre>
              ) : (
                <Empty title="No output yet" hint={genBusy ? 'Generating…' : 'Write a prompt, pick a type, and generate.'} />
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'content' && (
        <Card>
          <CardHeader title="Saved content" sub="Anything saved from Generate or created via actions" />
          {content.loading ? <Spinner /> : content.rows.length === 0 ? (
            <Empty title="No saved content yet" hint="Generate something and save it, or have the assistant create content." />
          ) : (
            <div className="space-y-2 p-4">
              {content.rows.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/8 bg-[#0b0b12] p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.content}</p>
                  </div>
                  <button onClick={async () => { await fetch(`/api/db/content/${c.id}`, { method: 'DELETE' }); content.reload(); }} className="p-1 rounded text-gray-600 hover:text-rose-400 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function AiStudioPage() {
  return (
    <Suspense fallback={<Spinner label="Loading AI Studio..." />}>
      <AiStudioInner />
    </Suspense>
  );
}