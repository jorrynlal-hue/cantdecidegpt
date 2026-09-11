'use client';

import { useState } from 'react';
import { Plus, Trash2, Brain, Sparkles, GraduationCap } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { api } from '@/lib/uiol/client';
import { MEMORY_CATEGORIES, MEMORY_CATEGORY_KIND, MemoryCategory, TEACH_SCOPES, TeachScope } from '@/lib/uiol/layer';

interface Knowledge { id: string; title: string; content: string; kind: string; tags: string[]; createdAt: string; }

export default function MemoryPage() {
  const knowledge = useCollection<Knowledge>('knowledge', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');
  const [cat, setCat] = useState<MemoryCategory>('knowledge');
  const [scope, setScope] = useState<TeachScope>('always');
  const [teachBusy, setTeachBusy] = useState(false);
  const [teachNote, setTeachNote] = useState<string | null>(null);
  const [fTeach, setFTeach] = useState('');
  const [teachCat, setTeachCat] = useState<MemoryCategory>('preferences');

  const save = async () => {
    if (!fTitle.trim()) return;
    setBusy(true);
    try {
      await collection.create('knowledge', {
        title: fTitle,
        content: fContent,
        kind: MEMORY_CATEGORY_KIND[cat],
        tags: ['memory', cat, scope],
      });
      setShow(false); setFTitle(''); setFContent(''); setCat('knowledge'); setScope('always');
      knowledge.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const teach = async () => {
    if (!fTeach.trim()) return;
    setTeachBusy(true);
    setTeachNote(null);
    try {
      const res = await api.teach({ statement: fTeach.trim(), scope, category: teachCat });
      setTeachNote(res.note);
      setFTeach('');
      knowledge.reload();
    } catch (e) {
      setTeachNote((e as Error).message);
    } finally {
      setTeachBusy(false);
    }
  };

  const forget = async (id: string) => {
    try {
      await collection.remove('knowledge', id);
      knowledge.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const countsByCat = MEMORY_CATEGORIES.map((c) => ({
    ...c,
    count: knowledge.rows.filter((k) => k.tags.includes(c.id) || k.kind === MEMORY_CATEGORY_KIND[c.id]).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Work Memory</h1>
          <p className="text-xs text-gray-500 mt-0.5">People, decisions, preferences, projects, knowledge, rules and patterns — the AI&apos;s long-term context.</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> Save Knowledge</Btn>
          <Btn kind="outline" onClick={teach} disabled={teachBusy || !fTeach.trim()}>
            <GraduationCap className="h-3.5 w-3.5" /> {teachBusy ? 'Teaching…' : 'Teach AI'}
          </Btn>
        </div>
      </div>

      {/* Teach AI quick bar */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-[#12121a] p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-300" />
          <p className="text-xs font-semibold text-white">Teach the AI how you want things done</p>
        </div>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row">
          <Input value={fTeach} onChange={setFTeach} placeholder="e.g., Always confirm before publishing anything to social media" />
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={teachCat}
              onChange={(e) => setTeachCat(e.target.value as MemoryCategory)}
              className="rounded-lg border border-white/10 bg-[#0b0b12] px-2 py-2 text-xs text-white outline-none"
            >
              {MEMORY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as TeachScope)}
              className="rounded-lg border border-white/10 bg-[#0b0b12] px-2 py-2 text-xs text-white outline-none"
            >
              {TEACH_SCOPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        {teachNote && <p className="mt-2 text-xs text-emerald-300">{teachNote}</p>}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-7">
        {countsByCat.map((c) => (
          <Card key={c.id} className="p-3">
            <Brain className="h-4 w-4 text-purple-400" />
            <p className="mt-1.5 text-sm font-bold text-white">{c.count}</p>
            <p className="text-[11px] text-gray-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Memory by category" right={<Badge tone="purple">{knowledge.rows.length}</Badge>} />
          {knowledge.loading ? (
            <Spinner />
          ) : knowledge.rows.length === 0 ? (
            <Empty title="Memory is empty" hint="Save processes, preferences, rules and notes so the network keeps context." />
          ) : (
            <div className="divide-y divide-white/5">
              {knowledge.rows.map((k) => {
                const catMatch = countsByCat.find((c) => k.tags.includes(c.id) || k.kind === MEMORY_CATEGORY_KIND[c.id]);
                return (
                  <div key={k.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-100">{k.title}</p>
                        {catMatch && <Badge tone="blue">{catMatch.label}</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{k.content}</p>
                      <p className="mt-1 text-[10px] text-gray-600">{fmtDate(k.createdAt)}{k.tags.length ? ` · ${k.tags.join(', ')}` : ''}</p>
                    </div>
                    <Btn small kind="danger" onClick={() => forget(k.id)}><Trash2 className="h-3 w-3" /></Btn>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Stored context types" right={<Badge tone="purple">7</Badge>} />
          <div className="space-y-2 p-4">
            {MEMORY_CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-300">
                  {c.label[0]}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-200">{c.label}</p>
                  <p className="text-[11px] text-gray-500">{c.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#11111a] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Save to Work Memory</h3>
              <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <Field label="Category">
                <select value={cat} onChange={(e) => setCat(e.target.value as MemoryCategory)} className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white outline-none">
                  {MEMORY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Topic or process name" /></Field>
              <Field label="Content"><Textarea value={fContent} onChange={setFContent} placeholder="What should the system remember?" /></Field>
              <Field label="Scope">
                <select value={scope} onChange={(e) => setScope(e.target.value as TeachScope)} className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white outline-none">
                  {TEACH_SCOPES.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
                </select>
              </Field>
              <Btn onClick={save} disabled={busy}><Plus className="h-3.5 w-3.5" /> Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}