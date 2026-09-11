'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Campaign { id: string; name: string; audience?: string; status: string; goals: string[]; createdAt: string; }
interface Post { id: string; platform: string; text: string; status: string; campaignId?: string; channel: string; at: string; publishedAt?: string; }

const statusTone = (s: string) => (s === 'active' || s === 'published' ? 'green' : s === 'draft' ? 'gray' : s === 'archived' ? 'gray' : 'amber') as 'green' | 'gray' | 'amber';

export default function MarketingPage() {
  const [tab, setTab] = useState<'campaigns' | 'posts'>('campaigns');
  const campaigns = useCollection<Campaign>('campaigns', {});
  const posts = useCollection<Post>('posts', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [cName, setCName] = useState('');
  const [cAudience, setCAudience] = useState('');
  const [cGoals, setCGoals] = useState('');

  const [pPlatform, setPPlatform] = useState('linkedin');
  const [pText, setPText] = useState('');
  const [pCampaign, setPCampaign] = useState('');

  const create = async () => {
    setShow(false);
    setBusy(true);
    try {
      if (tab === 'campaigns') {
        await collection.create('campaigns', {
          name: cName, audience: cAudience || undefined,
          goals: cGoals.split(',').map((g) => g.trim()).filter(Boolean),
        });
        setCName(''); setCAudience(''); setCGoals('');
        campaigns.reload();
      } else {
        await collection.create('posts', { platform: pPlatform, text: pText, campaignId: pCampaign || undefined });
        setPText(''); setPCampaign('');
        posts.reload();
      }
    } catch {
      /* handled below */
    } finally {
      setBusy(false);
    }
  };

  const publish = async (id: string) => {
    if (!confirm('Publish this post through the connected channel?')) return;
    try {
      await postsApiPublish(id);
      posts.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const postsApiPublish = async (id: string) => {
    const res = await fetch(`/api/db/posts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'publish' }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d?.error ?? 'Failed to publish');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await collection.remove(tab === 'campaigns' ? 'campaigns' : 'posts', id);
      (tab === 'campaigns' ? campaigns : posts).reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Marketing</h1>
          <p className="text-xs text-gray-500 mt-0.5">Campaigns and social posts. Publishing routes through a connected integration.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['campaigns', 'posts'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'campaigns' ? 'Campaigns' : 'Posts'}
              </button>
            ))}
          </div>
          <Btn onClick={() => setShow(true)}><Plus className="w-3.5 h-3.5" /> {tab === 'campaigns' ? 'New campaign' : 'New post'}</Btn>
        </div>
      </div>

      <Card>
        {tab === 'campaigns' && (campaigns.loading ? <Spinner /> : campaigns.rows.length === 0 ? (
          <Empty title="No campaigns yet" hint="Create your first campaign or draft social posts under it." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5"><tr><Th>Campaign</Th><Th>Audience</Th><Th>Goals</Th><Th>Status</Th><Th>Posts</Th><Th>Created</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.rows.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <Td className="font-medium text-white">{c.name}</Td>
                    <Td className="text-xs">{c.audience ?? '—'}</Td>
                    <Td><div className="flex flex-wrap gap-1">{c.goals.map((g) => <Badge key={g} tone="purple">{g}</Badge>)}</div></Td>
                    <Td><Badge tone={statusTone(c.status)}>{c.status}</Badge></Td>
                    <Td className="text-xs text-gray-500">{posts.rows.filter((p) => p.campaignId === c.id).length}</Td>
                    <Td className="text-xs text-gray-500">{fmtDate(c.createdAt)}</Td>
                    <Td><button onClick={() => del(c.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {tab === 'posts' && (posts.loading ? <Spinner /> : posts.rows.length === 0 ? (
          <Empty title="No posts yet" hint="Draft a social post and publish it through your channel." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5"><tr><Th>Platform</Th><Th>Content</Th><Th>Campaign</Th><Th>Status</Th><Th>Published</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {posts.rows.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <Td><Badge tone="blue">{p.platform}</Badge></Td>
                    <Td className="text-xs text-gray-300 max-w-md truncate">{p.text}</Td>
                    <Td className="text-xs">{campaigns.rows.find((c) => c.id === p.campaignId)?.name ?? '—'}</Td>
                    <Td><Badge tone={statusTone(p.status)}>{p.status}</Badge></Td>
                    <Td className="text-xs text-gray-500">{fmtDate(p.publishedAt)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {p.status === 'draft' && (
                          <Btn kind="solid" small onClick={() => publish(p.id)} disabled={busy}>Publish</Btn>
                        )}
                        <button onClick={() => del(p.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={tab === 'campaigns' ? 'New campaign' : 'New social post'}>
        <div className="space-y-3">
          {tab === 'campaigns' ? (
            <>
              <Field label="Name"><Input value={cName} onChange={setCName} /></Field>
              <Field label="Audience"><Input value={cAudience} onChange={setCAudience} placeholder="e.g. founders in EU SaaS" /></Field>
              <Field label="Goals (comma separated)"><Input value={cGoals} onChange={setCGoals} placeholder="awareness, signups" /></Field>
            </>
          ) : (
            <>
              <Field label="Platform">
                <Select value={pPlatform} onChange={setPPlatform} options={['twitter', 'linkedin', 'instagram', 'facebook', 'slack'].map((p) => ({ label: p, value: p }))} />
              </Field>
              <Field label="Content"><Textarea value={pText} onChange={setPText} placeholder="The post text..." /></Field>
              <Field label="Campaign"><Select value={pCampaign} onChange={setPCampaign} options={[{ label: 'None', value: '' }, ...campaigns.rows.map((c) => ({ label: c.name, value: c.id }))]} /></Field>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShow(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={(tab === 'campaigns' ? !cName.trim() : !pText.trim())}>Create</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}