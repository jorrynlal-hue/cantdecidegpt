'use client';

import { useEffect, useState } from 'react';
import {
  Zap, Send, Copy, Check, Save, RefreshCw, Trash2, Bookmark, Workflow,
  FileText, Sparkles, Database, MessageSquare, ChevronRight, Link2, Info,
} from 'lucide-react';
import Link from 'next/link';
import type { KnowledgeView, PostResult, LibraryPost, GenerateInput } from '@/lib/postmaker/types';
import { FlowCaptions, VIEW_W as FLOW_W, NODE_H, COL_TOP, ROW_H, MAX_ROWS } from '@/lib/postmaker/flowchart';

const NODE_W = 190;
const VIEW_H = COL_TOP + MAX_ROWS * ROW_H + 44;

function lsGet(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable; ignore */
  }
}

async function apiJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: { message?: string } };
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message ?? 'Request failed');
  }
  return json.data as T;
}

function firstLines(s: string, max: number, count: number): string[] {
  const words = s.split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) {
        out.push(cur.trim());
        cur = w;
        if (out.length >= count) break;
      } else {
        out.push(w);
        break;
      }
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur && out.length < count) out.push(cur.trim());
  return out;
}

function docHint(d: KnowledgeView['docs'][number]): string {
  if (d.status === 'unsupported') return 'Unsupported type — export to PDF, DOCX or TXT.';
  if (d.status === 'empty') return 'No text found inside this file.';
  if (d.status === 'low') {
    return d.ext === '.pdf'
      ? 'Looks like a scanned or image-only PDF — the text could not be read. Re-export it as DOCX, or paste the text in. The post engine does not use this file.'
      : 'Only partially readable — the post engine does not use it.';
  }
  return d.excerpt;
}

export default function PostMakerPage() {
  const [tab, setTab] = useState<'maker' | 'knowledge' | 'flow' | 'library'>('maker');
  const [kb, setKb] = useState<KnowledgeView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState<GenerateInput>({ brief: lsGet('lpm_brief', '') });
  const [result, setResult] = useState<PostResult | null>(null);
  const [hooks, setHooks] = useState<PostResult | null>(null);
  const [copied, setCopied] = useState('');
  const [library, setLibrary] = useState<LibraryPost[]>([]);
  const [savedFlash, setSavedFlash] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const view = await apiJSON<KnowledgeView>('/api/postmaker/knowledge');
        setKb(view);
      } catch (e) {
        setError((e as Error).message);
      }
      try {
        const lib = await apiJSON<{ posts: LibraryPost[] }>('/api/postmaker/library');
        setLibrary(lib.posts);
      } catch {
        /* library optional */
      }
    };
    void load();
  }, []);

  const persistBrief = (value: string) => {
    setInput({ brief: value });
    lsSet('lpm_brief', value);
  };

  const generate = async (kind: 'post' | 'hooks') => {
    setBusy(true);
    setError('');
    setCopied('');
    try {
      const res = await apiJSON<PostResult>('/api/postmaker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, brief: input.brief }),
      });
      if (kind === 'hooks') setHooks(res);
      else setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setError('Could not copy — your browser blocked the clipboard.');
    }
  };

  const savePost = async () => {
    if (!result) return;
    try {
      const res = await apiJSON<{ posts: LibraryPost[] }>('/api/postmaker/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: result.text,
          product: input.brief.slice(0, 24) || 'product',
          tone: 'formula',
          hook: 'formula',
          length: 'medium',
        }),
      });
      setLibrary(res.posts);
      setSavedFlash('Saved to the post library.');
      setTimeout(() => setSavedFlash(''), 2500);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const reload = async () => {
    setBusy(true);
    setError('');
    try {
      await apiJSON('/api/postmaker/rescan', { method: 'POST' });
      const view = await apiJSON<KnowledgeView>('/api/postmaker/knowledge');
      setKb(view);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeLib = async (id: string) => {
    try {
      const res = await apiJSON<{ posts: LibraryPost[] }>(`/api/postmaker/library?id=${id}`, { method: 'DELETE' });
      setLibrary(res.posts);
    } catch {
      /* ignore */
    }
  };

  const byId = new Map((kb?.flow.nodes ?? []).map((n) => [n.id, n]));
  const nodeCenter = (id: string) => {
    const n = byId.get(id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">LOCAL POST MAKER</h1>
              <p className="text-sm text-gray-400">your one paragraph → trained-from-your-documents LinkedIn post · everything stays on this computer</p>
            </div>
          </div>
          <Link href="/" className="rounded-xl border border-white/20 px-3 py-2 text-sm text-gray-400 transition hover:border-white/40 hover:text-white">Back to home</Link>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {([
            ['maker', 'Post maker', MessageSquare],
            ['knowledge', 'Knowledge', Database],
            ['flow', 'Flowchart', Workflow],
            ['library', 'Post library', Bookmark],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === id ? 'bg-white text-black' : 'border border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-black">
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6">
          {tab === 'maker' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-white p-5 text-black">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <h2 className="font-semibold">Chatbox — your one instructive paragraph</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Paste one short paragraph about your product: what it is, who it helps, how it works, what it changes. The system automatically adds the knowledge from your documents.
                </p>

                <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-gray-500">Your product paragraph</label>
                <textarea
                  value={input.brief}
                  onChange={(e) => persistBrief(e.target.value)}
                  rows={7}
                  placeholder="Example: We build a context-aware AI workspace that reads your email, calendar, tasks, documents and messages, then tells you what actually needs your attention. It is for founders and small teams drowning in disconnected tools who want to start each day already knowing what matters..."
                  className="mt-1.5 w-full resize-y rounded-2xl border border-neutral-300 bg-white p-3.5 text-sm text-black placeholder-neutral-400 outline-none focus:border-black"
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => generate('post')}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Generate post
                  </button>
                  <button
                    onClick={() => generate('hooks')}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4" />
                    5 opening hooks
                  </button>
                </div>

                {savedFlash && <p className="mt-3 text-sm font-medium text-emerald-700">{savedFlash}</p>}
              </section>

              <section className="space-y-6">
                {result && (
                  <div className="rounded-3xl bg-white p-5 text-black">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <FileText className="h-4 w-4" /> Your post
                      </h3>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                        {result.provider} · {result.words} words · {result.chars} characters
                      </span>
                    </div>
                    <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f6f6f7] p-4 text-[15px] leading-relaxed text-neutral-900">
                      {result.text}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => copyText(result.text, 'post')} className="flex items-center gap-2 rounded-xl bg-black px-3.5 py-2 text-sm text-white transition hover:opacity-80">
                        {copied === 'post' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied === 'post' ? 'Copied' : 'Copy post'}
                      </button>
                      <button onClick={savePost} className="flex items-center gap-2 rounded-xl border border-neutral-300 px-3.5 py-2 text-sm text-black transition hover:bg-neutral-100">
                        <Save className="h-4 w-4" /> Save to library
                      </button>
                      <a href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-neutral-300 px-3.5 py-2 text-sm text-black transition hover:bg-neutral-100">
                        <Link2 className="h-4 w-4" /> Open LinkedIn
                      </a>
                    </div>
                  </div>
                )}

                {hooks && (
                  <div className="rounded-3xl bg-white p-5 text-black">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4" /> 5 opening hooks
                      </h3>
                      <button onClick={() => copyText(hooks.text, 'hooks')} className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs text-black transition hover:bg-neutral-100">
                        {copied === 'hooks' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        copy all
                      </button>
                    </div>
                    <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f6f6f7] p-4 text-sm leading-relaxed text-neutral-900">
                      {hooks.text}
                    </div>
                  </div>
                )}

                {!result && !hooks && (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-white p-8 text-center">
                    <MessageSquare className="h-8 w-8 text-neutral-400" />
                    <p className="mt-3 max-w-sm text-sm text-gray-500">
                      Your finished posts appear here — ready to copy and paste into LinkedIn, or saved to the library.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'knowledge' && (
            <section className="rounded-3xl bg-white p-6 text-black">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Database className="h-4 w-4" /> Document knowledge
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Everything is read on this computer only. Nothing is uploaded.</p>
                </div>
                <button
                  onClick={reload}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                >
                  <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Reload knowledge
                </button>
              </div>

              <p className="mt-3 rounded-2xl bg-[#f6f6f7] px-4 py-3 text-sm text-neutral-700">
                Drop your PDF, DOCX, TXT or MD files into <code className="rounded bg-white px-1.5 py-0.5 text-xs border border-neutral-300">postmaker-docs/</code> on this machine, then press Reload.
              </p>

              {kb?.summary && <p className="mt-4 text-sm font-medium text-black">{kb.summary}</p>}

              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  ['Documents', String(kb?.stats.totalDocs ?? 0)],
                  ['Characters read', kb ? `${Math.round(kb.stats.totalChars / 1000)}k` : '0'],
                  ['Need attention', String(kb?.stats.lowConfidence ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f6f6f7] px-4 py-3">
                    <p className="text-lg font-bold text-black">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {kb?.facts && kb.facts.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-black">Top themes detected and used in your posts</h3>
                  <ul className="mt-2 space-y-2">
                    {kb.facts.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-xl bg-[#f6f6f7] px-3 py-2 text-sm text-neutral-800">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(kb?.docs ?? []).map((d) => (
                  <div key={d.name} className="rounded-2xl bg-[#f6f6f7] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-black">
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="break-all">{d.name}</span>
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          d.status === 'ok' ? 'bg-black text-white' : d.status === 'low' ? 'border border-black text-black' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {d.status === 'ok' ? 'loaded' : d.status === 'low' ? 'needs attention' : d.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {Math.round((d.size || 0) / 1024)} KB · {d.chars.toLocaleString()} characters
                    </p>
                    {d.status !== 'unsupported' && (
                      <p className="mt-2 line-clamp-3 text-xs text-neutral-600">{docHint(d)}</p>
                    )}
                  </div>
                ))}
                {(kb?.docs ?? []).length === 0 && (
                  <p className="text-sm text-gray-500">No documents yet. Drop files into postmaker-docs/ and reload.</p>
                )}
              </div>
            </section>
          )}

          {tab === 'flow' && (
            <section className="rounded-3xl bg-white p-6 text-black">
              <h2 className="flex items-center gap-2 font-semibold">
                <Workflow className="h-4 w-4" /> The master system — saved from your documents
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                The buyer’s journey, stage by stage. Every box is a question to answer plus a tiny instruction on what to do next — ending in the 20-post distribution machine.
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-4">
                <svg viewBox={`0 0 ${FLOW_W} ${VIEW_H}`} className="h-auto w-full min-w-[1000px]" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa" />
                    </marker>
                  </defs>

                  {FlowCaptions.map((c, i) => (
                    <text key={c} x={46 + i * (NODE_W + 46) + NODE_W / 2} y={COL_TOP - 20} fill="#a1a1aa" fontSize="11" fontWeight="700" textAnchor="middle">
                      {c}
                    </text>
                  ))}

                  {kb?.flow.edges.map((e, i) => {
                    const a = nodeCenter(e.from);
                    const b = nodeCenter(e.to);
                    const mx = (a.x + b.x) / 2;
                    return (
                      <path
                        key={i}
                        d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                        fill="none"
                        stroke="#a1a1aa"
                        strokeWidth="1.4"
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}

                  {kb?.flow.nodes.map((n) => {
                    const qLines = firstLines(n.q, 32, 2);
                    const dLines = firstLines(n.detail, 30, 4);
                    return (
                      <g key={n.id}>
                        <rect
                          x={n.x}
                          y={n.y}
                          width={NODE_W}
                          height={NODE_H}
                          rx={12}
                          fill="#0a0a0a"
                          stroke="#d4d4d8"
                          strokeWidth="1"
                        />
                        <text x={n.x + 12} y={n.y + 18} fill="#ffffff" fontSize="11.5" fontWeight="700" fontFamily="inherit">
                          {n.label}
                        </text>
                        {qLines.map((ln, li) => (
                          <text key={`q${li}`} x={n.x + 12} y={n.y + 35 + li * 12} fill="#b6b6bd" fontSize="10" fontFamily="inherit">
                            {li === 0 ? `? ${ln}` : ln}
                          </text>
                        ))}
                        {dLines.map((ln, li) => (
                          <text key={`d${li}`} x={n.x + 12} y={n.y + 35 + qLines.length * 12 + 2 + li * 13} fill="#e7e7e9" fontSize="10" fontFamily="inherit">
                            {li === 0 ? `→ ${ln}` : ln}
                          </text>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FlowCaptions.map((c) => (
                  <span key={c} className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                    {c}
                  </span>
                ))}
                <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-gray-500">
                  ? = question to answer · → = what to do
                </span>
              </div>
            </section>
          )}

          {tab === 'library' && (
            <section className="rounded-3xl bg-white p-6 text-black">
              <h2 className="flex items-center gap-2 font-semibold">
                <Bookmark className="h-4 w-4" /> Post library
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Saved posts, ready for LinkedIn. Copy → paste into the composer → done.
              </p>

              {library.length === 0 && (
                <p className="mt-6 text-sm text-gray-500">Nothing saved yet. Generate a post and press “Save to library”.</p>
              )}

              <div className="mt-5 space-y-4">
                {library.map((p) => (
                  <div key={p.id} className="rounded-2xl bg-[#f6f6f7] p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-black px-2.5 py-0.5 text-xs text-white">{p.meta.product || 'product'}</span>
                      <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs text-neutral-700">{p.meta.tone} · {p.meta.hook} · {p.meta.length}</span>
                      <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-neutral-800">{p.text.slice(0, 500)}{p.text.length > 500 ? '…' : ''}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => copyText(p.text, p.id)} className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs text-white transition hover:opacity-80">
                        {copied === p.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        copy
                      </button>
                      <button onClick={() => removeLib(p.id)} className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 transition hover:bg-neutral-100">
                        <Trash2 className="h-3.5 w-3.5" /> remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="mt-10 rounded-2xl border border-white/10 px-5 py-4 text-sm text-gray-400">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              LinkedIn retired the open API for third-party posting, so LOCAL POST MAKER prepares every post on-device and copies it to your clipboard — paste it straight into the LinkedIn composer, add an image or document if you want, and it is live. Repeat at a steady rhythm and reply to every comment within the day.
            </span>
          </p>
        </footer>
      </div>
    </main>
  );
}