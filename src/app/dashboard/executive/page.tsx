'use client';

import { useEffect, useState } from 'react';
import { Gauge, Check, X } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Spinner, Empty, money, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { analytics, approvals } from '@/lib/core/client';

interface Approval { id: string; title: string; detail?: string; kind: string; status: string; createdAt: string; }
interface Note { severity: string; text: string; }
interface Insights { pipelineTotal?: number; netTotal?: number; openTasks?: number; overdueTasks?: number; activeAutomations?: number; generationCount?: number; }

export default function ExecutivePage() {
  const approvalsList = useCollection<Approval>('approvals', {});
  const [ins, setIns] = useState<Insights | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    analytics.get().then((r) => { setIns(r.insights); setNotes(r.notes); }).catch(() => undefined);
  }, []);

  const decide = async (id: string, approved: boolean) => {
    setBusyId(id);
    try {
      await approvals.decide(id, approved);
      approvalsList.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const pending = approvalsList.rows.filter((a) => a.status !== 'approved' && a.status !== 'rejected');
  const openTaskCount = Number(ins?.openTasks ?? 0);
  const overdue = Number(ins?.overdueTasks ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Executive</h1>
        <p className="text-xs text-gray-500 mt-0.5">Decision support and high-level business overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open pipeline</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{money(Number(ins?.pipelineTotal ?? 0))}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Net income</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{money(Number(ins?.netTotal ?? 0))}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open tasks</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{openTaskCount}</p><p className="mt-1 text-xs text-rose-400">{overdue} overdue</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Automations live</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{ins?.activeAutomations ?? 0}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pending Decisions" right={<Gauge className="h-4 w-4 text-purple-400" />} />
          <div className="divide-y divide-white/5">
            {pending.length === 0 && <Empty title="No pending decisions" hint="Approvals routed to you will appear here." />}
            {pending.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100">{a.title}</p>
                  {a.detail ? <p className="mt-0.5 truncate text-xs text-gray-500">{a.detail}</p> : null}
                  <p className="mt-1 text-[10px] text-gray-600">{fmtDateTime(a.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Btn small kind="danger" disabled={busyId === a.id} onClick={() => decide(a.id, false)}><X className="h-3 w-3" /> Reject</Btn>
                  <Btn small kind="solid" disabled={busyId === a.id} onClick={() => decide(a.id, true)}><Check className="h-3 w-3" /> Approve</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Briefing" right={<Badge tone="purple">live</Badge>} />
          <div className="space-y-2 p-4">
            {notes.map((n, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge tone={n.severity === 'warn' ? 'amber' : n.severity === 'good' ? 'green' : 'blue'}>{n.severity}</Badge>
                <p className="text-xs text-gray-300">{n.text}</p>
              </div>
            ))}
            <div className="flex items-start gap-2">
              <Badge tone="purple">status</Badge>
              <p className="text-xs text-gray-300">CORE orchestration live. {ins?.activeAutomations ?? 0} automation(s) enabled, {ins?.generationCount ?? 0} content generations recorded.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Execution Radar" right={<Badge tone="purple">{pending.length} waiting</Badge>} />
        {approvalsList.loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-white/5">
            {approvalsList.rows.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-200">{a.title}</p>
                  <p className="text-[10px] text-gray-600">{a.kind ?? 'request'}</p>
                </div>
                <Badge tone={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'amber'}>{a.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}