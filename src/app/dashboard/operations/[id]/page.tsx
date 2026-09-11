'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Bot, Check, Copy, FileCheck2, Flag, Loader2, Lock, Mic2,
  RefreshCw, ScrollText, ShieldCheck, Sparkles, ThumbsUp, User, X,
} from 'lucide-react';
import { api, fmtDate, fmtTime, CURRENT_ACTOR, WorkItem, eventItem, ExecutionMode, DecisionReceipt } from '@/lib/uiol/client';
import { ActorLabel, ControlModeBadge, RiskBadge, StageBadge } from '@/components/uiol/badges';
import StageStepper from '@/components/uiol/stepper';
import ExecutionControl from '@/components/uiol/executionControl';
import DecisionReceiptCard from '@/components/uiol/decisionReceipt';
import { STAGE_LABELS, Stage, ControlMode, FinalOutcome } from '@/lib/uiol/types';
import { EXECUTION_MODE_LABELS } from '@/lib/uiol/layer';
import { stageHelpText } from '@/lib/uiol/lifecycle';

export default function WorkItemDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [item, setItem] = useState<WorkItem | null>(null);
  const [audit, setAudit] = useState<eventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [note, setNote] = useState('');
  const [verdict, setVerdict] = useState<Array<{ policy_id: string; decision: string; reason: string }> | null>(null);
  const [outcome, setOutcome] = useState<FinalOutcome>('success');
  const [followUps, setFollowUps] = useState('');
  const [execMode, setExecMode] = useState<ExecutionMode>('auto');
  const [receipt, setReceipt] = useState<DecisionReceipt | null>(null);

  const load = useCallback(async () => {
    const [wi, au] = await Promise.all([api.workitem(id), api.audit({ workitem_id: id, limit: 300 })]);
    setItem(wi.workitem);
    setAudit(au.events);
    if (wi.workitem?.execution_mode) setExecMode(wi.workitem.execution_mode);
    if (wi.workitem?.final_outcome !== 'in_progress') {
      const rc = await api.receipt(id);
      setReceipt(rc.receipt);
    } else {
      setReceipt(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [wi, au] = await Promise.all([api.workitem(id), api.audit({ workitem_id: id, limit: 300 })]);
        if (!active) return;
        setItem(wi.workitem);
        setAudit(au.events);
      } catch (e) {
        if (active) setMsg({ kind: 'err', text: (e as Error).message });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const act = async (stage: Stage, action: string, payload: Record<string, unknown> = {}) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.stageAction(id, stage, action, payload as { note?: string; decision?: 'approved' | 'rejected'; approval_id?: string; follow_ups?: string[]; outcome?: FinalOutcome }, CURRENT_ACTOR);
      if (res.decisions) setVerdict(res.decisions);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error || 'Action failed.' });
      } else {
        setMsg({ kind: 'ok', text: 'Stage updated. Audit appended.' });
      }
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const approve = async (approvalId: string, decision: 'approved' | 'rejected') => {
    setBusy(true);
    setMsg(null);
    try {
      await api.actApproval({ workitem_id: id, approval_id: approvalId, decision, note }, CURRENT_ACTOR);
      setMsg({ kind: 'ok', text: `Approval ${decision}.` });
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const copyEvidence = async () => {
    if (!item) return;
    const text = item.evidence.map((e) => `[${e.kind}] ${e.label}\n${e.content}\n— ${e.recorded_by.display} @ ${fmtTime(e.recorded_at)}\n`).join('\n');
    await navigator.clipboard.writeText(`# UIOL WorkItem ${item.id}\n\n${text}`);
    setMsg({ kind: 'ok', text: 'Evidence copied to clipboard (portable trust record).' });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading work item…</div>;
  }
  if (!item) {
    return <div className="py-24 text-center text-gray-400">Work item not found. <button onClick={() => router.push('/dashboard/operations')} className="text-purple-400 underline">Back to queue</button></div>;
  }

  const pendingApprovals = item.approvals.filter((a) => a.status === 'pending');
  const isBlocked = item.stage_status.check === 'blocked';
  const canEditMode = item.stage === 'capture' || item.stage === 'understand' || item.stage === 'plan';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/dashboard/operations')} className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Work Queue
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-500">{item.id}</span>
              <StageBadge stage={item.stage} status={item.stage_status[item.stage]} />
              <ControlModeBadge mode={item.control_mode} />
              <RiskBadge risk={item.risk_classification} />
              {item.final_outcome !== 'in_progress' && (
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  item.final_outcome === 'success' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                  : item.final_outcome === 'partial' ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                  : 'border-red-400/30 bg-red-500/15 text-red-300'
                }`}>{item.final_outcome}</span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">{item.title}</h1>
            <p className="mt-1 text-sm text-gray-400">{item.objective}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div>
              <p>Requester</p>
              <ActorLabel actor={item.requester} />
            </div>
            <div>
              <p>Owner</p>
              <p className="text-gray-300">{item.accountable_owner}</p>
            </div>
            <div>
              <p>Created</p>
              <p className="text-gray-300">{fmtDate(item.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm ${msg.kind === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Lifecycle stepper */}
      <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nine-stage lifecycle</p>
          <p className="text-[11px] text-gray-500">{STAGE_LABELS[item.stage]} — {stageHelpText[item.stage]}</p>
        </div>
        <StageStepper stage={item.stage} stageStatus={item.stage_status} readOnly />
      </div>

      {isBlocked && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <Flag className="h-4 w-4" /> This item is blocked by policy. Resolve the exception in Check before continuing.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: stage actions */}
        <div className="space-y-4 lg:col-span-2">
          {/* Execution Control */}
          <Panel title="Execution Control — who does the work?" icon={<Lock className="h-4 w-4" />}>
            <p className="mb-2 text-xs text-gray-500">
              {canEditMode ? 'Choose who runs this job — AI, a human, or both. Auto (★) lets the system decide per step.' : 'Locked after the approval stage begins.'}
            </p>
            <ExecutionControl
              value={execMode}
              disabled={!canEditMode}
              showRecommended
              onChange={async (m) => {
                setExecMode(m);
                try {
                  await api.updateWorkitem(id, { execution_mode: m }, CURRENT_ACTOR);
                  setMsg({ kind: 'ok', text: `Execution mode set to ${m}. Control dial updated.` });
                  load();
                } catch (e) {
                  setMsg({ kind: 'err', text: (e as Error).message });
                }
              }}
            />
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-500">Underlying control dial</p>
              <div className="flex flex-wrap gap-2">
                {(['human_only', 'ai_suggests', 'ai_prepares', 'human_approves', 'supervised', 'bounded_autonomy'] as ControlMode[]).map((m) => (
                  <button
                    key={m}
                    disabled={!canEditMode}
                    onClick={async () => {
                      await api.updateWorkitem(id, { control_mode: m }, CURRENT_ACTOR);
                      setMsg({ kind: 'ok', text: 'Control mode updated.' });
                      load();
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${item.control_mode === m ? 'border-purple-400/50 bg-purple-500/15 text-purple-300' : 'border-white/10 text-gray-400 hover:bg-white/5'} ${!canEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {/* Plan */}
          {item.proposed_plan.length > 0 && (
            <Panel title="Proposed plan (untrusted until validated)" icon={<Sparkles className="h-4 w-4" />}>
              <ol className="space-y-2">
                {item.proposed_plan.map((s, i) => (
                  <li key={s.id} className={`flex items-start gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3 ${s.executed ? 'opacity-60' : ''}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-xs font-semibold text-purple-300">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200">{s.summary}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">capability: <span className="font-mono text-gray-400">{s.capability}</span>{s.executed ? ' · executed' : ' · draft'}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          {/* Approvals */}
          {item.approvals.length > 0 && (
            <Panel title="Approval gates" icon={<ThumbsUp className="h-4 w-4" />}>
              <div className="space-y-2">
                {item.approvals.map((a) => (
                  <div key={a.id} className={`rounded-lg border p-3 ${a.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/5' : a.status === 'rejected' ? 'border-red-500/20 bg-red-500/5' : a.status === 'skipped' ? 'border-white/5 bg-white/5 opacity-60' : 'border-amber-500/20 bg-amber-500/5'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-200">{a.title}</p>
                        <p className="text-[11px] text-gray-500">required roles: {a.required_roles.join(', ') || 'none'}</p>
                        {a.decided_by && <p className="mt-0.5 text-[11px] text-gray-400"><ActorLabel actor={a.decided_by} /> · {fmtTime(a.decided_at)}</p>}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        a.status === 'approved' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                        : a.status === 'rejected' ? 'border-red-400/30 bg-red-500/15 text-red-300'
                        : a.status === 'pending' ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                        : 'border-white/10 bg-white/5 text-gray-500'
                      }`}>{a.status}</span>
                    </div>
                    {a.note && <p className="mt-1 text-xs italic text-gray-400">“{a.note}”</p>}
                    {a.status === 'pending' && a.required_roles.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => approve(a.id, 'approved')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => approve(a.id, 'rejected')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50">
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Execution steps */}
          {item.execution_steps.length > 0 && (
            <Panel title="Execution steps" icon={<Bot className="h-4 w-4" />}>
              <div className="space-y-2">
                {item.execution_steps.map((st, i) => (
                  <div key={st.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${st.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : st.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-purple-500/20 text-purple-300'}`}>
                      {st.status === 'completed' ? '✓' : st.status === 'failed' ? '!' : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-200">{st.action}</p>
                      <p className="text-[11px] text-gray-500">via <span className="font-mono">{st.tool}</span>{st.performed_by && <> · <ActorLabel actor={st.performed_by} /></>} · {st.status}{st.detail ? ` — ${st.detail}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Policy check verdict */}
          {verdict && verdict.length > 0 && (
            <Panel title="Policy evaluation result" icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="space-y-2">
                {verdict.map((d) => (
                  <div key={d.policy_id} className={`rounded-lg border p-3 text-sm ${d.decision === 'deny' ? 'border-red-500/20 bg-red-500/5 text-red-300' : d.decision === 'escalate' ? 'border-amber-500/20 bg-amber-500/5 text-amber-300' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'}`}>
                    <p className="font-medium">{d.policy_id} · {d.decision}</p>
                    <p className="mt-0.5 text-xs opacity-80">{d.reason}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Stage action panel */}
          <Panel title="Stage actions" icon={<FileCheck2 className="h-4 w-4" />}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Current stage: <span className="font-medium text-gray-300">{STAGE_LABELS[item.stage]}</span> — {stageHelpText[item.stage]}</p>

              {item.stage === 'capture' && (
                <ActionBtn onClick={() => act('capture', 'ack')} label="Confirm capture" sub="Acknowledge the objective and lock it in." />
              )}
              {item.stage === 'understand' && (
                <ActionBtn onClick={() => act('understand', 'resolve')} label="Run understanding" sub="Resolve entities, retrieve context, classify risk." />
              )}
              {item.stage === 'plan' && (
                <div className="space-y-2">
                  <ActionBtn onClick={() => act('plan', 'propose', { note })} label="Request AI proposal" sub="Generate a structured draft proposal. Untrusted until validated." icon={<Sparkles className="h-4 w-4" />} />
                  {item.proposed_plan.length > 0 && (
                    <ActionBtn onClick={() => act('plan', 'accept')} label="Accept plan as draft" sub="Move to policy Check stage." icon={<Check className="h-4 w-4" />} />
                  )}
                </div>
              )}
              {item.stage === 'check' && (
                <ActionBtn onClick={() => act('check', 'run-check')} label="Run policy checks" sub="Evaluate permissions, policy, conflict, and safety. Log every decision." icon={<RefreshCw className="h-4 w-4" />} />
              )}
              {item.stage === 'approve' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">{pendingApprovals.length ? `${pendingApprovals.length} pending approval(s) above must be resolved first.` : 'All gates satisfied. Proceed to execution.'}</p>
                  <ActionBtn onClick={() => act('approve', 'enter-execute')} label={pendingApprovals.length ? 'Enter execution (once approved)' : 'Enter execution'} sub="Advance into the Execute stage." icon={<Bot className="h-4 w-4" />} disabled={pendingApprovals.length > 0} />
                </div>
              )}
              {item.stage === 'execute' && (
                <div className="space-y-2">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Execution note (optional) — e.g., 'Idempotency key IP-2026-01 applied'." className="w-full resize-none rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50" rows={2} />
                  <ActionBtn onClick={() => act('execute', 'execute-plan', { note })} label="Execute validated plan (draft mode)" sub="Runs inside the control plane with idempotency + policy checks. Every step recorded." icon={<Bot className="h-4 w-4" />} />
                  <div className={`grid gap-2 ${item.control_mode === 'human_only' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
                    {item.control_mode !== 'human_only' && (
                      <ActionBtn
                        onClick={async () => {
                          try {
                            await api.takeover(id, CURRENT_ACTOR);
                            setMsg({ kind: 'ok', text: 'You now control this work item. AI becomes your assistant.' });
                            load();
                          } catch (e) {
                            setMsg({ kind: 'err', text: (e as Error).message });
                          }
                        }}
                        label="Take over this work"
                        sub="Human takes control now. Context, plan and evidence stay with you."
                        icon={<User className="h-4 w-4" />}
                      />
                    )}
                    {item.control_mode === 'human_only' && (
                      <ActionBtn
                        onClick={async () => {
                          try {
                            await api.giveback(id, execMode, CURRENT_ACTOR);
                            setMsg({ kind: 'ok', text: `AI re-engaged under ${execMode}.` });
                            load();
                          } catch (e) {
                            setMsg({ kind: 'err', text: (e as Error).message });
                          }
                        }}
                        label="Give this back to AI"
                        sub={`AI takes over again under ${execMode === 'auto' ? 'Auto' : EXECUTION_MODE_LABELS[execMode]}.`}
                        icon={<Bot className="h-4 w-4" />}
                      />
                    )}
                  </div>
                </div>
              )}
              {item.stage === 'verify' && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs text-gray-400">Outcome to record</p>
                    <div className="flex flex-wrap gap-2">
                      {(['success', 'partial', 'failed'] as FinalOutcome[]).map((o) => (
                        <button key={o} onClick={() => setOutcome(o)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${outcome === o ? 'border-purple-400/50 bg-purple-500/15 text-purple-300' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>{o}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#0d0d12] p-3 text-xs">
                    <p className="font-medium text-gray-300">Expected outcome</p>
                    <p className="mt-1 text-gray-400">{item.expected_outcome}</p>
                  </div>
                  <ActionBtn onClick={() => act('verify', 'verify', { outcome })} label="Record verification" sub="Compare actual to expected; capture evidence. Advances to Record." icon={<ThumbsUp className="h-4 w-4" />} />
                </div>
              )}
              {item.stage === 'record' && (
                <ActionBtn onClick={() => act('record', 'seal')} label="Seal record" sub="Store decision, evidence, and actors durably. Advances to Learn." icon={<ScrollText className="h-4 w-4" />} />
              )}
              {item.stage === 'learn' && (
                <div className="space-y-2">
                  <textarea value={followUps} onChange={(e) => setFollowUps(e.target.value)} placeholder="Follow-up tasks, comma-separated (e.g., 'Update vendor record, Schedule renewal review')" className="w-full resize-none rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50" rows={2} />
                  <ActionBtn onClick={() => act('learn', 'complete', { follow_ups: followUps.split(',').map((s) => s.trim()).filter(Boolean) })} label="Complete work item" sub="Register follow-ups and seal the immutable audit trail." icon={<Check className="h-4 w-4" />} />
                </div>
              )}

              {item.final_outcome !== 'in_progress' && item.stage === 'learn' && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  Item finalized as <strong>{item.final_outcome}</strong> — evidence and audit are sealed and exportable.
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right column: receipt + evidence + audit */}
        <div className="space-y-4">
          {receipt && <DecisionReceiptCard receipt={receipt} />}

          <Panel title="Evidence" icon={<Mic2 className="h-4 w-4" />} action={
            <button onClick={copyEvidence} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"><Copy className="h-3.5 w-3.5" /> Export</button>
          }>
            <ol className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {item.evidence.length === 0 && <li className="text-sm text-gray-500">No evidence recorded yet.</li>}
              {item.evidence.slice().reverse().map((e) => (
                <li key={e.id} className="rounded-lg border border-white/5 bg-[#0d0d12] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-gray-300">{e.label}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-gray-500">{e.kind}</span>
                  </div>
                  <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-400">{e.content}</pre>
                  <p className="mt-1.5 text-[10px] text-gray-600"><ActorLabel actor={e.recorded_by} short /> · {fmtTime(e.recorded_at)}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title={`Audit history (${audit.length})`} icon={<ScrollText className="h-4 w-4" />}>
            <p className="mb-2 text-[11px] text-gray-500">Append-only. No event can be edited or deleted.</p>
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {audit.slice(0, 60).map((ev) => (
                <div key={ev.id} className="flex gap-2 rounded-md bg-white/5 px-2.5 py-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400/70" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300">{ev.action}{ev.to ? ` → ${ev.to}` : ''}</p>
                    <p className="truncate text-[10px] text-gray-600">{ev.details}</p>
                    <p className="text-[10px] text-gray-600"><ActorLabel actor={ev.actor} short /> · {fmtTime(ev.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">{icon}{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, label, sub, icon, disabled }: { onClick: () => void; label: string; sub: string; icon?: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-left transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon || <Check className="h-4 w-4 text-purple-300" />}
      <div>
        <p className="text-sm font-medium text-purple-200">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </button>
  );
}