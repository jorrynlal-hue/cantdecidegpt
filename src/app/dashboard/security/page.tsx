'use client';

import { useEffect, useState } from 'react';
import { KeyRound, ScrollText, Lock } from 'lucide-react';
import { Card, CardHeader, Badge, Spinner, Empty } from '@/components/platform/ui';
import { useSession } from '@/components/platform/SessionProvider';

interface Audit { id: string; action?: string; actorId?: string; actorSource?: string; result?: string; objectType?: string; at: string; }

const RULES: { role: string; access: string }[] = [
  { role: 'owner', access: 'Full control — users, governance, providers, all collections' },
  { role: 'admin', access: 'Everything except workspaces & platform users' },
  { role: 'manager', access: 'Create/edit business records, run automations' },
  { role: 'member', access: 'Standard read/write on scoped collections' },
  { role: 'viewer', access: 'Read-only access across the workspace' },
];

export default function SecurityPage() {
  const { me } = useSession();
  const [ledger, setLedger] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/uiol/audit', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setLedger((j.data?.items ?? j.data ?? []) as Audit[]))
      .catch(() => setLedger([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Security</h1>
        <p className="text-xs text-gray-500 mt-0.5">Authentication, permissions and audit integrity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Active session</p></div>
          <p className="mt-2 text-sm font-medium text-gray-100">{me?.user.email}</p>
          <Badge tone={me?.user.role === 'owner' ? 'red' : 'purple'}>{me?.user.role ?? '?'}</Badge>
          <p className="mt-2 text-[10px] text-gray-600">Signed in · session cookie-bound · role enforced server-side</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Workspace memberships</p></div>
          <p className="mt-2 text-sm font-medium text-gray-100">{me?.workspaces.length ?? 0}</p>
          <p className="mt-2 text-[10px] text-gray-600">Access scoped per workspace on every API call.</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Ledger entries</p></div>
          <p className="mt-2 text-2xl font-bold text-purple-400">{ledger.length}</p>
          <p className="mt-1 text-[10px] text-gray-600">actions recorded in the audit ledger</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Role Permissions" sub="Server-enforced capability matrix" right={<Badge tone="purple">{RULES.length} roles</Badge>} />
        <div className="divide-y divide-white/5">
          {RULES.map((r) => (
            <div key={r.role} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <Badge tone={r.role === 'owner' ? 'red' : r.role === 'admin' ? 'amber' : 'blue'}>{r.role}</Badge>
              <p className="flex-1 text-right text-xs text-gray-400">{r.access}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Audit Ledger" right={<Badge tone="purple">{ledger.length}</Badge>} />
        {loading ? (
          <Spinner />
        ) : ledger.length === 0 ? (
          <Empty title="Ledger is empty" hint="System actions are recorded here as they happen." />
        ) : (
          <div className="max-h-96 divide-y divide-white/5 overflow-y-auto">
            {ledger.slice(0, 40).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-purple-300">{a.action ?? 'event'}</span>
                  <p className="mt-0.5 truncate text-xs text-gray-300">{a.result}</p>
                </div>
                <span className="shrink-0 text-[10px] text-gray-600">{new Date(a.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}