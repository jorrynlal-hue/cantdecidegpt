'use client';

import { useState } from 'react';
import { Plus, Trash2, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface WorkflowStepForm {
  kind: 'action' | 'condition' | 'delay' | 'result';
  action?: string;
  paramsText?: string;
  approve?: boolean;
  approveTitle?: string;
  field?: string;
  op?: string;
  value?: string;
  minutes?: string;
  output?: string;
}

interface StepUi {
  id: number;
  form: WorkflowStepForm;
}

interface WorkflowRow { id: string; name: string; description?: string; enabled: boolean; trigger: { type: string; schedule?: string; filter?: Record<string, string> }; steps: { id: string; kind: string; action?: string; params?: Record<string, unknown>; condition?: { field: string; op: string; value: string }; delaySec?: number; approved?: boolean }[]; createdAt: string; }
interface Execution { id: string; workflowName: string; status: string; triggerType: string; startedAt: string; finishedAt?: string; error?: string; dryRun?: boolean; verified?: boolean; }

const ACTIONS = ['create_task', 'update_task', 'complete_task', 'delete_task', 'create_project', 'create_customer', 'create_deal', 'move_deal', 'create_campaign', 'create_post', 'publish_post', 'send_email', 'create_document', 'search_documents', 'create_knowledge', 'save_content', 'generate_content', 'generate_image', 'record_transaction', 'create_invoice', 'mark_invoice_paid', 'create_event', 'create_workflow', 'request_approval', 'get_analytics', 'search', 'notify_team'];
const TRIGGERS = ['manual', 'scheduled_time', 'new_task', 'completed_task', 'new_customer', 'new_lead', 'new_document', 'webhook'];

const exTone = (s: string) => (s === 'completed' ? 'green' : s === 'running' ? 'blue' : s === 'failed' ? 'red' : s === 'waiting' ? 'amber' : 'gray') as 'green' | 'blue' | 'red' | 'amber' | 'gray';

function stepsToPayload(steps: StepUi[]) {
  return steps.map((s) => {
    switch (s.form.kind) {
      case 'condition':
        return { kind: 'condition', condition: { field: s.form.field, op: s.form.op, value: s.form.value } };
      case 'delay':
        return { kind: 'delay', delaySec: Number(s.form.minutes) * 60 };
      case 'result':
        return { kind: 'result', params: { output: s.form.output } };
      default:
        const parsedParams = s.form.paramsText ? JSON.parse(s.form.paramsText) : {};
        return {
          kind: 'action',
          action: s.form.action,
          approved: s.form.approve,
          params: {
            ...(!s.form.approve ? parsedParams : {}),
            ...(s.form.approve ? { title: s.form.approveTitle, ...parsedParams } : {}),
          },
        };
    }
  });
}

export default function AutomationPage() {
  const [tab, setTab] = useState<'workflows' | 'executions'>('workflows');
  const workflows = useCollection<WorkflowRow>('workflows', {});
  const executions = useCollection<Execution>('executions', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [trigger, setTrigger] = useState('manual');
  const [schedule, setSchedule] = useState('');
  const [steps, setSteps] = useState<StepUi[]>(() => [{ id: 1, form: { kind: 'action', action: 'notify_team' } }]);

  const addStep = (kind: WorkflowStepForm['kind']) =>
    setSteps((s) => [...s, { id: Date.now() + Math.random(), form: { kind } as WorkflowStepForm }]);

  const patchStep = (id: number, patch: Partial<WorkflowStepForm>) =>
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, form: { ...st.form, ...patch } } : st)));

  const create = async () => {
    if (!name.trim()) return;
    let payload;
    try {
      payload = stepsToPayload(steps);
    } catch {
      alert('Step params must be valid JSON.');
      return;
    }
    setBusy(true);
    try {
      await collection.create('workflows', {
        name, description: desc || undefined, enabled: true,
        trigger: { type: trigger, ...(trigger === 'scheduled_time' && schedule ? { schedule } : {}) },
        steps: payload,
      });
      setShow(false); setName(''); setDesc(''); setSchedule(''); setSteps([{ id: Date.now(), form: { kind: 'action', action: 'sendNotification' } }]);
      workflows.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (w: WorkflowRow) => {
    try {
      await collection.update('workflows', w.id, { enabled: !w.enabled });
      workflows.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const runNow = async (id: string, dryRun = false) => {
    setBusy(true);
    try {
      const res = await fetch('/api/automation/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflowId: id, dryRun }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Run failed');
      if (dryRun) {
        const n = d?.execution?.results?.length ?? 0;
        alert(`Dry run complete — ${n} simulated step(s), no side effects. Approve or adjust, then run for real.`);
      } else {
        alert(`Execution started. ${d?.execution ? 'Status: ' + (d.execution.status ?? 'queued') : ''}`);
      }
      executions.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verifyRun = async (id: string) => {
    try {
      await collection.update('executions', id, { op: 'verify' });
      executions.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this automation?')) return;
    try {
      await collection.remove('workflows', id);
      workflows.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Automation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Workflows run Universal Actions; triggers fire on real events and schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['workflows', 'executions'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <Btn onClick={() => setShow(true)}><Plus className="w-3.5 h-3.5" /> Build workflow</Btn>
        </div>
      </div>

      {tab === 'workflows' && (
        <div className="space-y-2">
          {workflows.loading ? <Spinner label="Loading workflows..." /> : workflows.rows.length === 0 ? (
            <Empty title="No automations yet" hint="Build a workflow: a trigger, then steps like condition → delay → action (or approval)." />
          ) : workflows.rows.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{w.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Trigger: <span className="text-purple-300">{w.trigger.type}</span>{w.trigger.schedule ? ` · ${w.trigger.schedule}` : ''} · {w.steps.length} step(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.enabled ? 'green' : 'gray'}>{w.enabled ? 'enabled' : 'disabled'}</Badge>
                  <Btn kind="outline" small onClick={() => runNow(w.id)} disabled={busy}><Play className="w-3 h-3" /> Run now</Btn>
                  <Btn kind="ghost" small onClick={() => runNow(w.id, true)} disabled={busy}>Dry run</Btn>
                  <button onClick={() => toggleEnabled(w)} className="px-2 py-1.5 rounded-md border border-white/10 text-xs text-gray-300 hover:text-white hover:border-white/30">{w.enabled ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => del(w.id)} className="p-1.5 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setOpenId(openId === w.id ? null : w.id)} className="p-1.5 rounded-md text-gray-600 hover:text-white">{openId === w.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                </div>
              </div>
              {openId === w.id && (
                <>
                  <div className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[11px] text-gray-300">
                    <span className="text-purple-300 font-medium">Plan preview</span> — {w.steps.filter((s) => s.kind === 'action').length} action(s), {w.steps.filter((s) => s.approved).length} require human approval, {w.steps.filter((s) => s.kind === 'delay').length} delay(s). Estimate: ~$0 + connector costs. Always dry-run before a real run.
                  </div>
                  <ol className="mt-3 space-y-1.5 border-l border-white/10 ml-2 pl-4">
                    {w.steps.map((s, i) => (
                      <li key={s.id} className="text-xs">
                        <span className="text-purple-300 font-medium">Step {i + 1} · {s.kind}</span>{' '}
                        <span className="text-gray-400">
                          {s.kind === 'action' ? `${s.action}${s.approved ? ' (requires approval)' : ''} ${s.params ? JSON.stringify(s.params) : ''}` : s.kind === 'delay' ? `${s.delaySec}s` : s.kind === 'condition' ? `${s.condition?.field} ${s.condition?.op} ${s.condition?.value}` : String(s.params?.output ?? '')}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'executions' && (
        <Card>
          <CardHeader title="Executions" sub="Live history for every run — real, persisted" />
          {executions.loading ? <Spinner /> : executions.rows.length === 0 ? (
            <Empty title="No executions yet" hint="Run a workflow above and it appears here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/5"><tr>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Workflow</th>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Trigger</th>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Started</th>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Finished</th>
                  <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Verify</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {executions.rows.map((e) => (
                    <tr key={e.id} className="hover:bg-white/5">
                      <td className="px-4 py-2.5 text-sm text-white">{e.workflowName}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{e.triggerType}</td>
                      <td className="px-4 py-2.5"><Badge tone={exTone(e.status)}>{e.status}{e.dryRun ? ' · dry-run' : ''}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDateTime(e.startedAt)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDateTime(e.finishedAt)}</td>
                      <td className="px-4 py-2.5">
                        {e.verified ? <Badge tone="green">verified</Badge> : e.status === 'completed' ? <Btn kind="solid" small onClick={() => verifyRun(e.id)}>Verify</Btn> : <span className="text-xs text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/70" onClick={() => setShow(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#101018] p-5 my-8" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-white mb-4">Build workflow</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"><Input value={name} onChange={setName} /></Field>
                <div className="h-0" />
                <Field label="Trigger">
                  <Select value={trigger} onChange={setTrigger} options={TRIGGERS.map((t) => ({ label: t.replace('_', ' '), value: t }))} />
                </Field>
                {trigger === 'scheduled_time' ? <Field label="Schedule (cron text)"><Input value={schedule} onChange={setSchedule} placeholder="0 9 * * *" /></Field> : <div className="h-0" />}
              </div>
              <Field label="Description"><Input value={desc} onChange={setDesc} /></Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500">Steps</p>
                  <div className="flex gap-1.5">
                    {(['action', 'condition', 'delay', 'result'] as const).map((k) => (
                      <button key={k} onClick={() => addStep(k)} className="rounded border border-white/10 px-2 py-1 text-[10px] text-gray-400 hover:text-white hover:border-purple-500/40">{k}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={s.id} className="rounded-lg border border-white/8 bg-[#0b0b12] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-purple-300">Step {i + 1} · {s.form.kind}</span>
                        <button onClick={() => setSteps((x) => x.filter((st) => st.id !== s.id))} className="p-1 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {s.form.kind === 'action' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Action"><Select value={s.form.action} onChange={(v) => patchStep(s.id, { action: v })} options={ACTIONS.map((a) => ({ label: a, value: a }))} /></Field>
                          <label className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                            <input type="checkbox" checked={!!s.form.approve} onChange={(e) => patchStep(s.id, { approve: e.target.checked })} className="accent-purple-500" /> Needs approval
                          </label>
                          {s.form.approve && <Field label="Approval title"><Input value={s.form.approveTitle} onChange={(v) => patchStep(s.id, { approveTitle: v })} /></Field>}
                          <Field label="Params (JSON)"><Input value={s.form.paramsText} onChange={(v) => patchStep(s.id, { paramsText: v })} placeholder='{"title":"…"}' /></Field>
                          <p className="text-[10px] text-gray-600">{"Params are passed to the Universal Action. Variables like {{data.field}} are available."}</p>
                        </div>
                      )}
                      {s.form.kind === 'condition' && (
                        <div className="grid grid-cols-3 gap-2">
                          <Field label="Field"><Input value={s.form.field} onChange={(v) => patchStep(s.id, { field: v })} placeholder="text" /></Field>
                          <Field label="Op"><Select value={s.form.op} onChange={(v) => patchStep(s.id, { op: v })} options={['eq', 'neq', 'gt', 'lt', 'contains'].map((o) => ({ label: o, value: o }))} /></Field>
                          <Field label="Value"><Input value={s.form.value} onChange={(v) => patchStep(s.id, { value: v })} /></Field>
                        </div>
                      )}
                      {s.form.kind === 'delay' && (
                        <Field label="Minutes"><Input value={s.form.minutes} onChange={(v) => patchStep(s.id, { minutes: v })} type="number" /></Field>
                      )}
                      {s.form.kind === 'result' && (
                        <Field label="Output"><Input value={s.form.output} onChange={(v) => patchStep(s.id, { output: v })} /></Field>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Btn kind="ghost" onClick={() => setShow(false)}>Cancel</Btn>
                <Btn onClick={create} disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create workflow'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}