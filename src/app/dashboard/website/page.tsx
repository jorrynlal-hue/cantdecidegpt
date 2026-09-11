'use client';

import { useState } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Content { id: string; title: string; body?: string; kind: string; tone?: string; createdAt: string; }
interface Campaign { id: string; name: string; channel: string; status: string; metrics: { sent: number; revenue: number }; }

export default function WebsitePage() {
  const content = useCollection<Content>('content', {});
  const campaigns = useCollection<Campaign>('campaigns', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fBody, setFBody] = useState('');
  const [fKind, setFKind] = useState('page');

  const publish = async () => {
    if (!fTitle.trim()) return;
    setBusy(true);
    try {
      await collection.create('content', { title: fTitle, body: fBody, kind: fKind, tone: 'professional' });
      setShow(false); setFTitle(''); setFBody(''); setFKind('page');
      content.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await collection.remove('content', id);
      content.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Website</h1>
        <p className="text-xs text-gray-500 mt-0.5">Web presence: pages, posts and publishing channels.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Published pages</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{content.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Channels active</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{campaigns.rows.filter((c) => c.status !== 'paused').length}</p><p className="mt-1 text-xs text-gray-500">{campaigns.rows.length} total campaigns</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Published Content"
          right={
            <div className="flex items-center gap-2">
              <select value={fKind} onChange={(e) => setFKind(e.target.value)} className="rounded-lg border border-white/10 bg-[#0b0b12] px-2 py-1 text-xs text-white outline-none">
                {['page', 'blog', 'post', 'landing'].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> New Item</Btn>
            </div>
          }
        />
        {content.loading ? (
          <Spinner />
        ) : content.rows.length === 0 ? (
          <Empty title="Nothing published yet" hint="Create pages, posts and announcements for your web presence." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Title</Th><Th>Kind</Th><Th>Tone</Th><Th>Created</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {content.rows.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{c.title}</span></Td>
                  <Td><Badge tone="blue">{c.kind}</Badge></Td>
                  <Td>{c.tone ?? '—'}</Td>
                  <Td>{fmtDate(c.createdAt)}</Td>
                  <Td className="text-right"><Btn small kind="danger" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /></Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader title="Publishing Channels" right={<Badge tone="purple">{campaigns.rows.length}</Badge>} />
        {campaigns.loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-white/5">
            {campaigns.rows.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-100">{c.name}</p>
                  <p className="text-[11px] text-gray-500">channel: {c.channel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.status === 'active' ? 'green' : c.status === 'paused' ? 'amber' : 'gray'}>{c.status}</Badge>
                  <span className="text-[11px] text-gray-500">{c.metrics.sent} sent · ${c.metrics.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {campaigns.rows.length === 0 && <Empty title="No channels yet" />}
          </div>
        )}
      </Card>

      {show && (
        <Card className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-white/10 bg-[#11111a] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4"><h3 className="text-sm font-semibold">New Content Item</h3><button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">✕</button></div>
          <div className="space-y-3 p-5">
            <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Page title" /></Field>
            <Field label="Body"><Textarea value={fBody} onChange={setFBody} placeholder="Content body" rows={4} /></Field>
            <Btn onClick={publish} disabled={busy}><Plus className="h-3.5 w-3.5" /> Save</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}