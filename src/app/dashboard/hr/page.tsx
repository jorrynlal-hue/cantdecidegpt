'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner, Th, Td } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { team, type Role } from '@/lib/core/client';
import { useSession } from '@/components/platform/SessionProvider';

interface Member { id: string; name: string; email: string; role: Role; createdAt?: string; }
interface Task { id: string; assigneeId?: string; status: string; title: string; }

const roleTone = (r: string) => (r === 'owner' ? 'red' : r === 'admin' ? 'amber' : r === 'manager' ? 'purple' : r === 'viewer' ? 'gray' : 'blue') as 'red' | 'amber' | 'purple' | 'gray' | 'blue';

export default function HrPage() {
  const { me } = useSession();
  const tasks = useCollection<Task>('tasks', {});
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [eName, setEName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eRole, setERole] = useState<Role>('member');

  const load = () => {
    team.users().then(setMembers).catch(() => setMembers([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!eName.trim() || !eEmail.trim()) return;
    setBusy(true);
    try {
      await team.create({ email: eEmail.trim(), name: eName.trim(), role: eRole });
      setShow(false); setEName(''); setEEmail('');
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">HR · People Operations</h1>
          <p className="text-xs text-gray-500 mt-0.5">{members.length} members · workload distributed across the team.</p>
        </div>
        <Btn onClick={() => setShow(true)}><UserPlus className="h-3.5 w-3.5" /> Invite Member</Btn>
      </div>

      <Card>
        <CardHeader title="Team Roster" right={<Badge tone="purple">{members.length} members</Badge>} />
        {loading ? (
          <Spinner label="Loading roster..." />
        ) : members.length === 0 ? (
          <Empty title="No members" hint="Invite members to build your team." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Member</Th><Th>Role</Th><Th>Assigned tasks</Th><Th>Open load</Th></tr></thead>
            <tbody>
              {members.map((m) => {
                const assigned = tasks.rows.filter((t) => t.assigneeId === m.id);
                const openLoad = assigned.filter((t) => t.status !== 'completed').length;
                return (
                  <tr key={m.id} className="border-t border-white/5">
                    <Td><span className="font-medium text-gray-100">{m.name}</span><span className="block text-[11px] text-gray-500">{m.email}</span></Td>
                    <Td><Badge tone={roleTone(m.role)}>{m.role}</Badge></Td>
                    <Td>{assigned.length}</Td>
                    <Td><Badge tone={openLoad > 4 ? 'red' : openLoad > 0 ? 'amber' : 'green'}>{openLoad} open</Badge></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {show && (
        <Card className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-white/10 bg-[#11111a] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4"><h3 className="text-sm font-semibold">Invite Member</h3><button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">✕</button></div>
          <div className="space-y-3 p-5">
            <Field label="Name"><Input value={eName} onChange={setEName} placeholder="Full name" /></Field>
            <Field label="Email"><Input value={eEmail} onChange={setEEmail} placeholder="email@company.com" /></Field>
            <Field label="Role">
              <Select value={eRole} onChange={(v) => setERole(v as Role)} options={['owner', 'admin', 'manager', 'member', 'viewer'].map((r) => ({ value: r, label: r }))} />
            </Field>
            <Btn onClick={invite} disabled={busy}><Plus className="h-3.5 w-3.5" /> Invite</Btn>
          </div>
        </Card>
      )}

      {me && (
        <p className="text-[11px] text-gray-600">Signing in as <span className="text-gray-400">{me.user.email}</span> ({me.user.role}).</p>
      )}
    </div>
  );
}