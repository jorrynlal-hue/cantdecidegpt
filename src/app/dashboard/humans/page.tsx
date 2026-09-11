'use client';

import { useState } from 'react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Spinner, Empty, Modal } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { humans as humansApi, insights as insightsApi, HumanView, InsightView } from '@/lib/core/client';
import { Sparkles, UserPlus, Trash2, RefreshCw, Brain, MessageCirclePlus, Activity } from 'lucide-react';

const STATUS_TONE: Record<string, 'green' | 'amber' | 'gray' | 'red'> = {
  online: 'green',
  busy: 'amber',
  away: 'gray',
  offline: 'red',
};

const SOURCE_LABEL: Record<string, { label: string; tone: 'purple' | 'green' | 'blue' }> = {
  ai: { label: 'AI-generated', tone: 'purple' },
  human: { label: 'Set by human', tone: 'green' },
  co: { label: 'Co-created', tone: 'blue' },
};

export default function HumanWorkspacePage() {
  const humans = useCollection<HumanView>('humans');
  const insights = useCollection<InsightView>('insights');

  const [showAdd, setShowAdd] = useState(false);
  const [fName, setFName] = useState('');
  const [fRole, setFRole] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fFocus, setFFocus] = useState('');
  const [fSkills, setFSkills] = useState('');
  const [fAssist, setFAssist] = useState('');

  const [genBusy, setGenBusy] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genFocus, setGenFocus] = useState('');

  const [setInsight, setSetInsight] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sBody, setSBody] = useState('');

  const addHuman = async () => {
    if (!fName.trim() || !fRole.trim()) return;
    try {
      await humansApi.add({
        name: fName,
        role: fRole,
        email: fEmail || undefined,
        focus: fFocus || undefined,
        skills: fSkills.split(',').map((s) => s.trim()).filter(Boolean),
        aiAssist: fAssist.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setFName(''); setFRole(''); setFEmail(''); setFFocus(''); setFSkills(''); setFAssist('');
      setShowAdd(false);
      humans.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const cycleStatus = async (h: HumanView) => {
    const order: HumanView['status'][] = ['online', 'busy', 'away', 'offline'];
    const next = order[(order.indexOf(h.status) + 1) % order.length];
    try {
      await humansApi.update(h.id, { status: next });
      humans.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const generate = async () => {
    setGenBusy(true);
    try {
      await insightsApi.generate({ prompt: genPrompt || undefined, focus: genFocus || undefined });
      setGenPrompt(''); setGenFocus('');
      insights.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  };

  const saveInsight = async () => {
    if (!sTitle.trim() || !sBody.trim()) return;
    try {
      await insightsApi.set({ title: sTitle, body: sBody, source: 'human', tags: ['human'] });
      setSTitle(''); setSBody('');
      setSetInsight(false);
      insights.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const coCreateInsight = async () => {
    if (!sTitle.trim() || !sBody.trim()) return;
    try {
      await insightsApi.set({ title: sTitle, body: sBody, source: 'co', tags: ['co-created'] });
      setSTitle(''); setSBody('');
      setSetInsight(false);
      insights.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (api: { remove: (id: string) => Promise<unknown> }, reload: () => void, id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.remove(id);
      reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const peopleOnline = humans.rows.filter((h) => h.status === 'online').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <Activity className="h-5 w-5 text-indigo-400" /> Human Workspace
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Humans + high-tech AI, co-working. Human integrations, live presence and a generative insight board.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="green">{peopleOnline} online</Badge>
          <Badge tone="blue">{insights.rows.length} insights</Badge>
          <Btn small onClick={() => setShowAdd(true)}><UserPlus className="h-3.5 w-3.5" /> Add human</Btn>
          <Btn small onClick={() => setSetInsight(true)}><MessageCirclePlus className="h-3.5 w-3.5" /> Set insight</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Human integrations */}
        <Card>
          <CardHeader title="Human integrations" sub="Every person who works with the AI — their focus and what the AI carries for them." right={<Badge tone="purple">{humans.rows.length} humans</Badge>} />
          <div className="p-4">
            {humans.loading ? (
              <Spinner label="Loading humans..." />
            ) : humans.error ? (
              <Empty title="Could not load humans" hint={humans.error} />
            ) : humans.rows.length === 0 ? (
              <Empty title="No humans yet" hint="Add the people in your workspace to bring human integrations online." />
            ) : (
              <ul className="space-y-3">
                {humans.rows.map((h) => (
                  <li key={h.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button onClick={() => cycleStatus(h)} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 font-bold text-indigo-200 ring-1 ring-white/10">
                          {h.name.slice(0, 1).toUpperCase()}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111318] ${h.status === 'online' ? 'bg-emerald-400' : h.status === 'busy' ? 'bg-amber-400' : h.status === 'away' ? 'bg-gray-400' : 'bg-red-500'}`} />
                        </button>
                        <div>
                          <p className="text-xs font-bold text-gray-100">{h.name}</p>
                          <p className="text-[11px] text-gray-500">{h.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={STATUS_TONE[h.status] ?? 'gray'}>{h.status}</Badge>
                        <Btn small kind="ghost" onClick={() => remove(humansApi, humans.reload, h.id)}><Trash2 className="h-3 w-3" /></Btn>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] text-gray-400">
                      <span className="font-semibold text-gray-300">Focus:</span> {h.focus}
                    </p>
                    {h.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.skills.map((s) => <span key={s} className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-300">{s}</span>)}
                      </div>
                    )}
                    {h.aiAssist.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.aiAssist.map((s) => <span key={s} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-300"><Sparkles className="mr-0.5 inline h-2.5 w-2.5" />{s}</span>)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Generative insights board */}
        <Card>
          <CardHeader
            title="Generative insight board"
            sub="What the workspace is thinking — AI-generated, human-set and co-created signals, all in one live stream."
            right={<Badge tone="amber">{insights.rows.length} signals</Badge>}
          />
          <div className="p-4">
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Generate a new insight</p>
              <div className="mt-2 space-y-2">
                <Input value={genFocus} onChange={setGenFocus} placeholder="Team focus today (optional)" />
                <Input value={genPrompt} onChange={setGenPrompt} placeholder="Steer the prompt (optional)" />
              </div>
              <Btn className="mt-2 w-full" onClick={generate} disabled={genBusy}>
                {genBusy ? (<><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</>) : (<><Brain className="h-3.5 w-3.5" /> Generate insight</>)}
              </Btn>
            </div>

            <div className="mt-4 space-y-3">
              {insights.loading ? (
                <Spinner label="Loading insights..." />
              ) : insights.error ? (
                <Empty title="Could not load insights" hint={insights.error} />
              ) : insights.rows.length === 0 ? (
                <Empty title="No insights yet" hint="Generate or set the first insight for the board." />
              ) : (
                insights.rows.map((i) => {
                  const src = SOURCE_LABEL[i.source] ?? SOURCE_LABEL.human;
                  return (
                    <div key={i.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={src.tone}>{src.label}</Badge>
                        <Btn small kind="ghost" onClick={() => remove(insightsApi, insights.reload, i.id)}><Trash2 className="h-3 w-3" /></Btn>
                      </div>
                      <p className="mt-2 text-xs font-bold text-gray-100">{i.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{i.body}</p>
                      <p className="mt-2 text-[10px] text-gray-600">
                        {i.provider ? `via ${i.provider} · ` : ''}
                        {new Date(i.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Add human */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add a human to the workspace">
        <div className="space-y-3">
          <Field label="Name"><Input value={fName} onChange={setFName} placeholder="e.g. Alex Owner" /></Field>
          <Field label="Role"><Input value={fRole} onChange={setFRole} placeholder="e.g. Founder & Operator" /></Field>
          <Field label="Email (optional)"><Input value={fEmail} onChange={setFEmail} placeholder="name@nexus.local" /></Field>
          <Field label="Current focus"><Input value={fFocus} onChange={setFFocus} placeholder="What are they working on?" /></Field>
          <Field label="Skills (comma-separated)"><Input value={fSkills} onChange={setFSkills} placeholder="Strategy, Ops, Clients" /></Field>
          <Field label="What AI carries for them (comma-separated)"><Input value={fAssist} onChange={setFAssist} placeholder="Pricing, Shadow briefs, Weekly ops" /></Field>
          <Btn className="w-full" onClick={addHuman} disabled={!fName.trim() || !fRole.trim()}><UserPlus className="h-3.5 w-3.5" /> Add human integration</Btn>
        </div>
      </Modal>

      {/* Set insight */}
      <Modal open={setInsight} onClose={() => setSetInsight(false)} title="Set an insight onto the board">
        <div className="space-y-3">
          <Field label="Title"><Input value={sTitle} onChange={setSTitle} placeholder="The insight, in one line" /></Field>
          <Field label="Body"><Textarea value={sBody} onChange={setSBody} rows={3} placeholder="What you want the workspace to remember or act on…" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={saveInsight} disabled={!sTitle.trim() || !sBody.trim()}>Set as human insight</Btn>
            <Btn kind="outline" onClick={coCreateInsight} disabled={!sTitle.trim() || !sBody.trim()}>Co-create with AI</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}