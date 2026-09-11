'use client';

import { useState } from 'react';
import { Cpu, Play, Terminal } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Spinner, Empty } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { automation } from '@/lib/core/client';

interface Workflow { id: string; name: string; enabled: boolean; trigger: string; description?: string; }
interface Execution { id: string; runId?: string; workflowId?: string; workflowName?: string; status: string; createdAt: string; results?: string[]; }

export default function AiWorkerPage() {
  const workflows = useCollection<Workflow>('workflows', {});
  const executions = useCollection<Execution>('executions', {});
  const [running, setRunning] = useState<string | null>(null);
  const [cmd, setCmd] = useState('');
  const [cmdOut, setCmdOut] = useState('');
  const [cmdBusy, setCmdBusy] = useState(false);

  const trigger = async (w: Workflow) => {
    setRunning(w.id);
    try {
      await automation.run(w.id);
      setTimeout(() => executions.reload(), 900);
    } catch (e) {
      setCmdOut(`Trigger failed: ${(e as Error).message}`);
    } finally {
      setRunning(null);
    }
  };

  const runCommand = async () => {
    const q = cmd.trim();
    if (!q || cmdBusy) return;
    setCmdBusy(true);
    setCmdOut('');
    try {
      const res = await (await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })).json();
      setCmdOut((res.data?.reply ?? 'No reply') + (res.data?.toolUsed ? `\n[tool: ${res.data.toolUsed}]` : ''));
    } catch (e) {
      setCmdOut(`Error: ${(e as Error).message}`);
    } finally {
      setCmdBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI Worker</h1>
        <p className="text-xs text-gray-500 mt-0.5">Autonomous execution agent. Trigger workflows or issue /run commands — the worker performs them on your data.</p>
      </div>

      <Card>
        <CardHeader title="Quick Command" sub="Instruct the worker using natural language or /run action syntax" right={<Terminal className="h-4 w-4 text-purple-400" />} />
        <div className="flex items-center gap-2 p-4">
          <Input value={cmd} onChange={setCmd} placeholder='/run create_task {"title":"..."}' />
          <Btn kind="solid" disabled={cmdBusy || !cmd.trim()} onClick={runCommand}>{cmdBusy ? 'Working...' : 'Run'}</Btn>
        </div>
        {cmdOut && <pre className="mx-4 mb-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0b0b12] p-3 text-xs text-emerald-300">{cmdOut}</pre>}
      </Card>

      <Card>
        <CardHeader title="Workflow Triggers" sub="Enabled workflows you can execute autonomously" right={<Cpu className="h-4 w-4 text-purple-400" />} />
        {workflows.loading ? (
          <Spinner />
        ) : workflows.rows.length === 0 ? (
          <Empty title="No workflows" hint="Create enabled workflows in Automation to give the worker tasks." />
        ) : (
          <div className="divide-y divide-white/5">
            {workflows.rows.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-100">{w.name}</p>
                  <p className="text-[11px] text-gray-500">{w.trigger}{w.description ? ` · ${w.description}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.enabled ? 'green' : 'gray'}>{w.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  <Btn small kind="solid" disabled={!w.enabled || running === w.id} onClick={() => trigger(w)}>
                    <Play className="h-3 w-3" /> {running === w.id ? 'Deploying...' : 'Deploy'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Execution Ledger" right={<Badge tone="purple">{executions.rows.length}</Badge>} />
        {executions.loading ? (
          <Spinner />
        ) : (
          <div className="divide-y divide-white/5">
            {executions.rows.slice(0, 15).map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs text-gray-300">{e.runId ?? e.id}</p>
                  {e.results?.length ? <p className="truncate text-[10px] text-gray-500">{e.results[0]}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-gray-600">{new Date(e.createdAt).toLocaleString()}</span>
                  <Badge tone={e.status === 'completed' ? 'green' : e.status === 'waiting_approval' ? 'amber' : 'blue'}>{e.status}</Badge>
                </div>
              </div>
            ))}
            {executions.rows.length === 0 && <Empty title="No executions yet" />}
          </div>
        )}
      </Card>
    </div>
  );
}