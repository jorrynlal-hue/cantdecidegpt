'use client';

import { useState } from 'react';
import { Plus, Trash2, Brain, Database } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Knowledge { id: string; title: string; content: string; kind: string; tags: string[]; createdAt: string; }
interface Doc { id: string; name: string; kind: string; folder?: string; size?: number; createdAt: string; }
interface Content { id: string; title: string; kind: string; createdAt: string; }

export default function MemoryPage() {
  const knowledge = useCollection<Knowledge>('knowledge', {});
  const docs = useCollection<Doc>('documents', {});
  const content = useCollection<Content>('content', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');

  const save = async () => {
    if (!fTitle.trim()) return;
    setBusy(true);
    try {
      await collection.create('knowledge', { title: fTitle, content: fContent, kind: 'note' });
      setShow(false); setFTitle(''); setFContent('');
      knowledge.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Memory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Persistent system memory: knowledge, documents and saved context.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> Save Knowledge</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2"><Brain className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Knowledge items</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{knowledge.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Documents</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{docs.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><span className="text-purple-400 text-sm font-bold">✎</span><p className="text-[11px] uppercase tracking-wider text-gray-500">Saved content</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{content.rows.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Knowledge Base" right={<Badge tone="purple">{knowledge.rows.length}</Badge>} />
          {knowledge.loading ? (
            <Spinner />
          ) : knowledge.rows.length === 0 ? (
            <Empty title="Memory is empty" hint="Save processes, notes and instructions so the system can keep context." />
          ) : (
            <div className="divide-y divide-white/5">
              {knowledge.rows.map((k) => (
                <div key={k.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100">{k.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{k.content}</p>
                    <p className="mt-1 text-[10px] text-gray-600">{fmtDate(k.createdAt)}{k.tags.length ? ` · ${k.tags.join(', ')}` : ''}</p>
                  </div>
                  <Btn small kind="danger" onClick={() => forget(k.id)}><Trash2 className="h-3 w-3" /></Btn>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Stored Documents & Context" right={<Badge tone="purple">{docs.rows.length + content.rows.length}</Badge>} />
          {docs.loading || content.loading ? (
            <Spinner />
          ) : (
            <div className="divide-y divide-white/5">
              {docs.rows.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="truncate text-sm text-gray-200">{d.name}</span>
                  <Badge tone={d.kind ? 'blue' : 'gray'}>{d.kind}</Badge>
                </div>
              ))}
              {content.rows.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="truncate text-sm text-gray-200">{c.title}</span>
                  <Badge tone="purple">{c.kind}</Badge>
                </div>
              ))}
              {docs.rows.length + content.rows.length === 0 && <Empty title="Nothing stored yet" />}
            </div>
          )}
        </Card>
      </div>

      {show && (
        <Card className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-white/10 bg-[#11111a] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4"><h3 className="text-sm font-semibold">Save to Memory</h3><button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">✕</button></div>
          <div className="space-y-3 p-5">
            <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Topic or process name" /></Field>
            <Field label="Content"><Textarea value={fContent} onChange={setFContent} placeholder="What should the system remember?" /></Field>
            <Btn onClick={save} disabled={busy}><Plus className="h-3.5 w-3.5" /> Save</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}