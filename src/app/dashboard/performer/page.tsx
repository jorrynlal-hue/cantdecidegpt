'use client';

import { useState } from 'react';
import { Zap, Play } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Spinner, Empty } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { automation } from '@/lib/core/client';

interface Task { id: string; status: string; createdAt: string; }
interface Campaign { id: string; metrics: { sent: number; revenue: number }; }
interface Workflow { id: string; name: string; enabled: boolean; trigger: string; }
interface Execution { id: string; workflowId?: string; status: string; runId?: string; createdAt: string; results?: string[]; }

export default function PerformerPage() {
  const tasks = useCollection<Task>('tasks', {});
  const campaigns = useCollection<Campaign>('campaigns', {});
  const workflows = useCollection<Workflow>('workflows', {});
  const executions = useCollection<Execution>('executions', {});
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const done = tasks.rows.filter((t) => t.status === 'completed').length;
  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const completion = tasks.rows.length ? Math.round((done / tasks.rows.length) * 100) : 0;
  const sent = campaigns.rows.reduce((a, c) => a + c.metrics.sent, 0);
  const revenue = campaigns.rows.reduce((a, c) => a + c.metrics.revenue, 0);
  const succeeded = executions.rows.filter((e) => e.status === 'completed').length;

  const trigger = async (w: Workflow) => {
    setRunning(w.id);
    setMsg('');
    try {
      await automation.run(w.id);
      scheduleReload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setRunning(null);
    }
  };
  const scheduleReload = () => setTimeout(() => executions.reload(), 900);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Performer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Performance and optimization intelligence across the whole system.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Task completion</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{completion}%</p><p className="mt-1 text-xs text-gray-500">{done} of {tasks.rows.length} · {open} open</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Automation success</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{succeeded}/{executions.rows.length || 0}</p><p className="mt-1 text-xs text-gray-500">executions completed</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Campaign volume</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{sent.toLocaleString()}</p><p className="mt-1 text-xs text-gray-500">delivered</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Campaign revenue</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">${revenue.toLocaleString()}</p><p className="mt-1 text-xs text-gray-500">generated</p></Card>
      </div>

      {msg && <p className="text-xs text-rose-400">{msg}</p>}

      <Card>
        <CardHeader
          title="Run Optimization"
          sub="Trigger enabled workflows to execute autonomous performance actions"
          right={<Zap className="h-4 w-4 text-purple-400" />}
        />
        {workflows.loading ? (
          <Spinner />
        ) : workflows.rows.length === 0 ? (
          <Empty title="No workflows yet" hint="Create a workflow in Automation and it becomes available to run here." />
        ) : (
          <div className="divide-y divide-white/5">
            {workflows.rows.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-100">{w.name}</p>
                  <p className="text-[11px] text-gray-500">trigger: {w.trigger}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.enabled ? 'green' : 'gray'}>{w.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  <Btn small kind="solid" disabled={!w.enabled || running === w.id} onClick={() => trigger(w)}>
                    <Play className="h-3 w-3" /> {running === w.id ? 'Running...' : 'Run'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent Executions" right={<Badge tone="purple">{executions.rows.length}</Badge>} />
        {executions.loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-white/5">
            {executions.rows.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-300">{e.runId ?? e.id.slice(0, 8)}</span>
                <Badge tone={e.status === 'completed' ? 'green' : e.status === 'waiting_approval' ? 'amber' : 'blue'}>{e.status}</Badge>
              </div>
            ))}
            {executions.rows.length === 0 && <Empty title="No executions yet" />}
          </div>
        )}
      </Card>
    </div>
  );
}