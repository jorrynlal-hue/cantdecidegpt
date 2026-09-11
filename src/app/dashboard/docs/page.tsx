'use client';

import { useState } from 'react';
import { Upload, FileText, Trash2, Search, Plus } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface Doc { id: string; name: string; size: number; contentType: string; createdAt: string; }
interface Knowledge { id: string; title: string; content: string; tags: string[]; createdAt: string; }
interface Hit { id: string; type: string; title: string; snippet: string; }

export default function DocsPage() {
  const [tab, setTab] = useState<'files' | 'knowledge'>('files');
  const docs = useCollection<Doc>('documents', {});
  const knowledge = useCollection<Knowledge>('knowledge', {});
  const [uploading, setUploading] = useState(false);
  const [kShown, setKShown] = useState(false);
  const [kTitle, setKTitle] = useState('');
  const [kContent, setKContent] = useState('');
  const [kTags, setKTags] = useState('');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Upload failed');
      docs.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const saveKnowledge = async () => {
    if (!kTitle.trim()) return;
    try {
      await fetch('/api/db/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: kTitle, content: kContent, tags: kTags.split(',').map((t) => t.trim()).filter(Boolean) }),
      });
      setKShown(false);
      setKTitle('');
      setKContent('');
      setKTags('');
      knowledge.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      const all = (d.hits as Hit[]) ?? [];
      setHits(all.filter((h) => h.type === 'document' || h.type === 'knowledge'));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Documents & Knowledge</h1>
          <p className="text-xs text-gray-500 mt-0.5">Files, knowledge entries, and AI search across both.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['files', 'knowledge'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t === 'files' ? 'Files' : 'Knowledge'}</button>
            ))}
          </div>
          {tab === 'files' ? (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-medium text-white">
              {uploading ? <Spinner /> : <Upload className="w-3.5 h-3.5" />} Upload
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          ) : (
            <Btn onClick={() => setKShown(true)}><Plus className="w-3.5 h-3.5" /> Add entry</Btn>
          )}
        </div>
      </div>

      <Card>
        <div className="p-3 flex items-center gap-2 border-b border-white/5 max-w-lg">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Search files + knowledge…" className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none" />
          <Btn kind="ghost" small onClick={search} disabled={searching}>{searching ? <Spinner /> : 'Go'}</Btn>
        </div>
        {hits !== null && (
          <div className="p-3 space-y-2">
            {hits.length === 0 ? <p className="text-xs text-gray-600">No matches.</p> : hits.map((h) => (
              <p key={`${h.type}-${h.id}`} className="text-xs text-gray-300"><Badge tone={h.type === 'knowledge' ? 'purple' : 'blue'}>{h.type}</Badge> <span className="font-medium text-white">{h.title}</span> — {h.snippet}</p>
            ))}
          </div>
        )}
      </Card>

      {tab === 'files' && (
        <div className="grid gap-2">
          {docs.loading ? <Spinner /> : docs.rows.length === 0 ? (
            <Empty title="No documents yet" hint="Upload a file — text is extracted and becomes searchable." />
          ) : docs.rows.map((d) => (
            <Card key={d.id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{d.name}</p>
                  <p className="text-[10px] text-gray-600">{d.contentType} · {(d.size / 1024).toFixed(1)} KB · {fmtDate(d.createdAt)}</p>
                </div>
              </div>
              <button onClick={async () => { await fetch(`/api/db/documents/${d.id}`, { method: 'DELETE' }); docs.reload(); }} className="p-1 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'knowledge' && (
        <div className="space-y-2">
          {knowledge.loading ? <Spinner /> : knowledge.rows.length === 0 ? (
            <Empty title="No knowledge entries yet" hint="Add documentation, onboarding notes, or internal knowledge." />
          ) : knowledge.rows.map((k) => (
            <Card key={k.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{k.title}</p>
                  <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap line-clamp-3">{k.content}</p>
                  <div className="flex flex-wrap gap-1 mt-2">{k.tags.map((t) => <Badge key={t} tone="gray">{t}</Badge>)}</div>
                </div>
                <button onClick={async () => { await fetch(`/api/db/knowledge/${k.id}`, { method: 'DELETE' }); knowledge.reload(); }} className="p-1 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {kShown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setKShown(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#101018] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-white mb-4">Add knowledge entry</p>
            <div className="space-y-3">
              <Field label="Title"><Input value={kTitle} onChange={setKTitle} /></Field>
              <Field label="Content"><Textarea value={kContent} onChange={setKContent} rows={6} /></Field>
              <Field label="Tags (comma separated)"><Input value={kTags} onChange={setKTags} /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <Btn kind="ghost" onClick={() => setKShown(false)}>Cancel</Btn>
                <Btn onClick={saveKnowledge} disabled={!kTitle.trim()}>Save</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}