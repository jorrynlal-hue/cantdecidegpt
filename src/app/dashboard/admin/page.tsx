'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Plug, Activity } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Spinner, Empty, Th, Td } from '@/components/platform/ui';
import { team, type Role } from '@/lib/core/client';
import { useCollection } from '@/components/platform/data';

interface Member { id: string; name: string; email: string; role: Role; createdAt?: string; }
interface Integration { id: string; name: string; category?: string; connected: boolean; }

const roleTone = (r: string) => (r === 'owner' ? 'red' : r === 'admin' ? 'amber' : r === 'manager' ? 'purple' : r === 'viewer' ? 'gray' : 'blue') as 'red' | 'amber' | 'purple' | 'gray' | 'blue';

export default function AdminPage() {
  const integrations = useCollection<Integration>('integrations', {});
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<{ hasKey: boolean; kinds: { kind: string; usesBaseline: boolean }[] } | null>(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nName, setNName] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nRole, setNRole] = useState<Role>('member');

  const load = () => {
    team.users().then(setMembers).catch(() => setMembers([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    fetch('/api/providers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setProviders(j.data))
      .catch(() => setProviders(null));
  }, []);

  const createUser = async () => {
    if (!nName.trim() || !nEmail.trim()) return;
    setBusy(true);
    try {
      await team.create({ email: nEmail.trim(), name: nName.trim(), role: nRole });
      setShow(false); setNName(''); setNEmail(''); setNRole('member');
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const roleCounts = (r: Role, list: Member[]) => list.filter((m) => m.role === r).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Admin</h1>
          <p className="text-xs text-gray-500 mt-0.5">System administration and governance.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> Create User</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Users</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{members.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Owners</p><p className="mt-1.5 text-2xl font-bold text-rose-400">{roleCounts('owner', members)}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Plug className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Connections</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{integrations.rows.filter((i) => i.connected).length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">AI provider</p></div><p className="mt-1.5 text-2xl font-bold text-green-400">{providers?.hasKey ? 'Live' : 'Baseline'}</p></Card>
      </div>

      <Card>
        <CardHeader title="User Administration" right={<Badge tone="purple">{members.length} members</Badge>} />
        {loading ? (
          <Spinner label="Loading users..." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>User</Th><Th>Role</Th><Th>Access</Th><Th>Created</Th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{m.name}</span><span className="block text-[11px] text-gray-500">{m.email}</span></Td>
                  <Td><Badge tone={roleTone(m.role)}>{m.role}</Badge></Td>
                  <Td>{m.role === 'owner' || m.role === 'admin' ? <Badge tone="green">Full</Badge> : m.role === 'viewer' ? <Badge tone="gray">Read</Badge> : <Badge tone="blue">Write</Badge>}</Td>
                  <Td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader title="Integration Registry" right={<Badge tone="purple">{integrations.rows.length}</Badge>} />
        {integrations.loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-white/5">
            {integrations.rows.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-200">{i.name}</span>
                <div className="flex items-center gap-2">
                  {i.category ? <Badge tone="blue">{i.category}</Badge> : null}
                  <Badge tone={i.connected ? 'green' : 'gray'}>{i.connected ? 'Connected' : 'Disconnected'}</Badge>
                </div>
              </div>
            ))}
            {integrations.rows.length === 0 && <Empty title="No integrations registered" />}
          </div>
        )}
      </Card>

      {show && (
        <Card className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-white/10 bg-[#11111a] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4"><h3 className="text-sm font-semibold">Create User</h3><button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">✕</button></div>
          <div className="space-y-3 p-5">
            <Field label="Name"><Input value={nName} onChange={setNName} placeholder="Full name" /></Field>
            <Field label="Email"><Input value={nEmail} onChange={setNEmail} placeholder="email@company.com" /></Field>
            <Field label="Role">
              <Select value={nRole} onChange={(v) => setNRole(v as Role)} options={['owner', 'admin', 'manager', 'member', 'viewer'].map((r) => ({ value: r, label: r }))} />
            </Field>
            <Btn onClick={createUser} disabled={busy}><Plus className="h-3.5 w-3.5" /> Create</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}