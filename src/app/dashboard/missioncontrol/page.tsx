'use client';

import { useEffect, useState } from 'react';
import {
  Bot, UserRound, Globe2, Plug, Workflow, CheckCircle2, AlertTriangle, Undo2, Activity, ListChecks, TimerReset, Cpu, ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Spinner, Empty, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection, backups, type BackupRow } from '@/lib/core/client';

interface ExecRow {
  id: string;
  workflowName?: string;
  workflowId: string;
  triggerType?: string;
  status: string;
  error?: string;
  dryRun?: boolean;
  verified?: boolean;
  startedAt: string;
  finishedAt?: string;
  endedAt?: string;
}
interface WorkflowRow { id: string; name: string; enabled: boolean; trigger: { type: string }; steps: unknown[]; }
interface Integration { id: string; name: string; connected: boolean; status: string; health?: string; kind?: string; category: string; updatedAt: string; }
interface Approval { id: string; status: string; title: string; }
interface Activity { id: string; action: string; result: string; objectLabel?: string; at: string; actorSource: string; }

const exTone = (s: string) => (s === 'completed' ? 'green' : s === 'running' ? 'blue' : s === 'failed' ? 'red' : s === 'waiting' ? 'amber' : s === 'queued' ? 'blue' : 'gray') as 'green' | 'blue' | 'red' | 'amber' | 'gray';

export default function MissionControlPage() {
  const executions = useCollection<ExecRow>('executions', {});
  const workflows = useCollection<WorkflowRow>('workflows', {});
  const integrations = useCollection<Integration>('integrations', {});
  const approvals = useCollection<Approval>('approvals', {});
  const activities = useCollection<Activity>('activities', {});
  const tasks = useCollection<{ id: string; status: string; completedAt?: string; createdAt: string }>('tasks', {});
  const [backupRows, setBackupRows] = useState<BackupRow[]>([]);
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    backups.list().then(setBackupRows).catch(() => setBackupRows([]));
  }, []);

  const restoreTo = async (id?: string) => {
    if (!confirm('Restore the workspace to this cloud snapshot? Current state will be replaced — this cannot be undone.')) return;
    setBackupBusy(true);
    try {
      const d = await backups.restore(id);
      alert(`Restored to version ${d.version} (${new Date(d.at).toLocaleString()}). ${d.sessionsPreserved} session(s) kept — re-check each account.`);
      setBackupRows([]);
      backups.list().then(setBackupRows).catch(() => setBackupRows([]));
      executions.reload(); workflows.reload(); integrations.reload(); approvals.reload(); activities.reload(); tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBackupBusy(false);
    }
  };

  useEffect(() => {
    const t = setInterval(() => {
      executions.reload(); workflows.reload(); integrations.reload(); approvals.reload(); activities.reload(); tasks.reload();
    }, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = executions.rows.filter((e) => e.status === 'running' || e.status === 'queued');
  const waiting = executions.rows.filter((e) => e.status === 'waiting');
  const failed = executions.rows.filter((e) => e.status === 'failed');
  const completedToday = executions.rows.filter((e) => e.status === 'completed' && new Date(e.endedAt ?? e.startedAt).toDateString() === new Date().toDateString());
  const pendingApprovals = approvals.rows.filter((a) => a.status === 'pending');
  const connectedApps = integrations.rows.filter((i) => i.connected || i.status === 'connected');
  const browsers = integrations.rows.filter((i) => i.kind === 'browser');
  const activeWorkflows = workflows.rows.filter((w) => w.enabled);
  const attention = pendingApprovals.length + failed.length + waiting.length;

  const verify = async (id: string) => {
    try {
      await collection.update('executions', id, { op: 'verify' });
      executions.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Mission Control</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live execution across AI agents, humans, browsers, apps and workflows — one live view.</p>
        </div>
        <Badge tone={attention > 0 ? 'amber' : 'green'}>{attention > 0 ? `${attention} need attention` : 'All clear'}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-blue-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">AI active</p></div><p className="mt-1.5 text-2xl font-bold text-white">{running.length}</p><p className="text-xs text-gray-500">{waiting.length} waiting (approval/delay)</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Browser sessions</p></div><p className="mt-1.5 text-2xl font-bold text-white">{browsers.length}</p><p className="text-xs text-gray-500">{browsers.filter((b) => b.connected).length} active</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Plug className="h-4 w-4 text-emerald-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Connected apps</p></div><p className="mt-1.5 text-2xl font-bold text-white">{connectedApps.length}</p><p className="text-xs text-gray-500">{integrations.rows.length} connectors total</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Workflow className="h-4 w-4 text-amber-300" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Live workflows</p></div><p className="mt-1.5 text-2xl font-bold text-white">{activeWorkflows.length}</p><p className="text-xs text-gray-500">{workflows.rows.length} total</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sky-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Humans working</p></div><p className="mt-1.5 text-2xl font-bold text-white">{tasks.rows.filter((t) => t.status === 'in_progress').length}</p><p className="text-xs text-gray-500">{pendingApprovals.length} approvals pending</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Completed today</p></div><p className="mt-1.5 text-2xl font-bold text-white">{completedToday.length}</p><p className="text-xs text-gray-500">{tasks.rows.filter((t) => t.status === 'completed').length} tasks done</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Dry runs</p></div><p className="mt-1.5 text-2xl font-bold text-white">{executions.rows.filter((e) => e.dryRun).length}</p><p className="text-xs text-gray-500">simulated, zero side effects</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><AlertTriangle className={`h-4 w-4 ${attention > 0 ? 'text-rose-400' : 'text-gray-500'}`} /><p className="text-[11px] uppercase tracking-wider text-gray-500">Attention</p></div><p className={`mt-1.5 text-2xl font-bold ${attention > 0 ? 'text-amber-400' : 'text-white'}`}>{attention}</p><p className="text-xs text-gray-500">{failed.length} failures</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Execution Timeline" sub="Live — refreshes every 20s" right={<Badge tone="purple">{executions.rows.length}</Badge>} />
          {executions.loading ? (
            <Spinner />
          ) : executions.rows.length === 0 ? (
            <Empty title="No executions yet" hint="Run a workflow from Automation or watch scheduled triggers fire." />
          ) : (
            <div className="divide-y divide-white/5">
              {executions.rows.slice(0, 12).map((e) => (
                <div key={e.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-100">{e.workflowName ?? e.workflowId.slice(0, 8)}</p>
                      <p className="text-[11px] text-gray-500">{e.triggerType ?? 'manual'} · {fmtDateTime(e.startedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.dryRun && <Badge tone="blue">dry-run</Badge>}
                      <Badge tone={exTone(e.status)}>{e.status}</Badge>
                      {e.verified && <Badge tone="green">verified</Badge>}
                      {e.status === 'completed' && !e.verified && (
                        <Btn kind="solid" small onClick={() => verify(e.id)}>Verify</Btn>
                      )}
                    </div>
                  </div>
                  {e.error ? <p className="mt-1 text-xs text-rose-400">{e.error}</p> : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Live Activity" right={<Activity className="h-4 w-4 text-purple-400" />} />
          {activities.loading ? (
            <Spinner />
          ) : activities.rows.length === 0 ? (
            <Empty title="No activity yet" />
          ) : (
            <div className="divide-y divide-white/5">
              {activities.rows.slice(0, 14).map((a) => (
                <div key={a.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="gray">{a.actorSource}</Badge>
                    <p className="text-xs text-gray-500">{new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-200">{a.objectLabel ?? a.action}</p>
                  <p className="text-[11px] text-gray-500">{a.result}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Commands" sub="Human oversight stays one click away" right={<ShieldCheck className="h-4 w-4 text-emerald-400" />} />
        <div className="flex flex-wrap gap-2 p-4">
          <Btn kind="outline" onClick={() => { executions.reload(); workflows.reload(); integrations.reload(); approvals.reload(); }}><ListChecks className="w-3.5 h-3.5" /> Refresh now</Btn>
          <Btn kind="ghost" disabled={backupBusy} onClick={() => restoreTo()}><Undo2 className="w-3.5 h-3.5" /> {backupBusy ? 'Restoring…' : 'Undo to last backup'}</Btn>
          <Btn kind="ghost" onClick={() => alert('Takeover: open the live browser session to hand control to a human — return to AI resumes automation.')}><TimerReset className="w-3.5 h-3.5" /> Human takeover</Btn>
        </div>
        {backupRows.length > 0 && (
          <div className="px-4 pb-4 pt-1">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">Restore points</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {backupRows.slice(0, 4).map((b) => (
                <div key={b.id ?? b.version} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">v{b.version}</p>
                    <p className="text-[11px] text-gray-500 truncate">{new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => restoreTo(b.id)}
                    disabled={backupBusy}
                    className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}