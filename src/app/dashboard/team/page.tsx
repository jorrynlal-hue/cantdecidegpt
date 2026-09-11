'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { useSession } from '@/components/platform/SessionProvider';

interface TeamRow { id: string; name: string; memberIds: string[]; createdAt: string; }

const roleTone = (r: string) => (r === 'owner' || r === 'admin' ? 'red' : r === 'manager' ? 'amber' : r === 'member' ? 'blue' : 'gray') as 'red' | 'amber' | 'blue' | 'gray';

export default function TeamPage() {
  const { me, refresh } = useSession();
  const [tab, setTab] = useState<'members' | 'teams'>('members');
  const teams = useCollection<TeamRow>('teams', {});
  const [showTeam, setShowTeam] = useState(false);
  const [tName, setTName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const members = (me?.members ?? []) as { id: string; name: string; email: string; role: string }[];

  const changeRole = async (userId: string, role: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/team/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Failed');
      }
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createTeam = async () => {
    if (!tName.trim()) return;
    try {
      await fetch('/api/db/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tName, memberIds: picked }),
      });
      setShowTeam(false); setTName(''); setPicked([]);
      teams.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Team</h1>
          <p className="text-xs text-gray-500 mt-0.5">Members and roles. Changing roles takes effect immediately via the API.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['members', 'teams'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          {tab === 'teams' && <Btn onClick={() => setShowTeam(true)}><Plus className="w-3.5 h-3.5" /> New team</Btn>}
        </div>
      </div>

      {tab === 'members' ? (
        <Card>
          <CardHeader title={`Members (${members.length})`} sub="Roles gate features: manager+ can build automations, admin+ manages integrations." />
          <div className="divide-y divide-white/5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{m.name}{m.email === me?.user?.email ? ' (you)' : ''}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={roleTone(m.role)}>{m.role}</Badge>
                  {(m.email?.includes('local') ?? false) && m.email !== me?.user?.email ? (
                    <Select value={m.role} onChange={(v) => changeRole(m.id, v)} className="!w-28" options={['viewer', 'member', 'manager', 'admin'].map((r) => ({ label: r, value: r }))} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {teams.loading ? <Spinner /> : teams.rows.length === 0 ? (
            <Empty title="No teams yet" hint="Group members into teams for structured access." />
          ) : teams.rows.map((t) => (
            <Card key={t.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.memberIds.length} member(s): {t.memberIds.map((id) => members.find((m) => m.id === id)?.name).filter(Boolean).join(', ') || '—'}</p>
              </div>
              <button onClick={async () => { await fetch(`/api/db/teams/${t.id}`, { method: 'DELETE' }); teams.reload(); }} className="p-1.5 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </Card>
          ))}
        </div>
      )}

      {showTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowTeam(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#101018] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-white mb-4">New team</p>
            <div className="space-y-3">
              <Field label="Name"><Input value={tName} onChange={setTName} /></Field>
              <Field label="Members">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-gray-300">
                      <input type="checkbox" checked={picked.includes(m.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, m.id] : p.filter((x) => x !== m.id)))} className="accent-purple-500" />
                      {m.name}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Btn kind="ghost" onClick={() => setShowTeam(false)}>Cancel</Btn>
                <Btn onClick={createTeam} disabled={!tName.trim()}>Create</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}