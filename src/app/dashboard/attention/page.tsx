'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellOff, CheckCheck, Clock, Eye, Inbox, PlayCircle, X } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Spinner, Empty } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { approvals as approvalsClient } from '@/lib/core/client';
import { playTing } from '@/lib/ting';

interface Approval { id: string; title: string; detail?: string; kind: string; status: string; createdAt: string; }
interface Execution { id: string; trigger: string; status: string; payload: string; startedAt: string; }
interface Task { id: string; title: string; status: string; dueDate?: string; priority: string; }

const ACK_KEY = 'cdg.attention.acked';
type Ack = Record<string, number>;

const readAck = (): Ack => {
  try { const raw = localStorage.getItem(ACK_KEY); return raw ? (JSON.parse(raw) as Ack) : {}; } catch { return {}; }
};
const writeAck = (a: Ack) => { try { localStorage.setItem(ACK_KEY, JSON.stringify(a)); } catch { /* ignore */ } };

interface Attn { id: string; index: string; kind: string; title: string; detail?: string; link: string; tone: 'amber' | 'rose' | 'blue'; }

export default function AttentionPage() {
  const approvals = useCollection<Approval>('approvals', {});
  const executions = useCollection<Execution>('executions', {});
  const tasks = useCollection<Task>('tasks', {});
  const [ack, setAck] = useState<Ack>(() => (typeof window === 'undefined' ? {} : readAck()));
  const [deciding, setDeciding] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 500);
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  const list = useMemo<Attn[]>(() => {
    const items: Attn[] = [];
    for (const a of approvals.rows) {
      if (a.status && a.status !== 'approved' && a.status !== 'rejected') {
        items.push({ id: `approval-${a.id}`, index: `approval-${a.id}`, kind: 'Approval', title: a.title, detail: a.detail, link: '/dashboard/executive', tone: 'amber' });
      }
    }
    for (const e of executions.rows) {
      if (e.status === 'failed') {
        items.push({ id: `exec-${e.id}`, index: `exec-${e.id}`, kind: 'Failed run', title: `${e.trigger ?? 'Automation run'} failed`, detail: e.payload, link: '/dashboard/aiworker', tone: 'rose' });
      } else if (e.status === 'queued' || e.status === 'waiting' || e.status === 'running') {
        items.push({ id: `exec-${e.id}`, index: `running-${e.id}`, kind: 'Running', title: e.trigger ?? 'Automation run', detail: 'In progress', link: '/dashboard/aiworker', tone: 'blue' });
      }
    }
    for (const t of tasks.rows) {
      const open = t.status !== 'completed' && t.status !== 'cancelled';
      const overdue = t.dueDate && new Date(t.dueDate).getTime() < now - 86400000;
      if (open && overdue) {
        items.push({ id: `task-${t.id}`, index: `task-${t.id}`, kind: 'Overdue task', title: t.title, detail: t.priority ? `priority ${t.priority} · due ${t.dueDate}` : `due ${t.dueDate}`, link: '/dashboard/tasks', tone: 'amber' });
      }
    }
    return items;
  }, [approvals.rows, executions.rows, tasks.rows, now]);

  const unseen = useMemo(() => {
    return list.filter((i) => {
      const until = ack[i.index];
      return !(until !== undefined && (until === 0 || until > now));
    });
  }, [list, ack, now]);

  const sync = (fn: (a: Ack) => Ack) => {
    setAck((prev) => {
      const next = fn(prev);
      writeAck(next);
      return next;
    });
  };

  const acknowledge = (index: string) => sync((a) => ({ ...a, [index]: 0 }));
  const snooze = (index: string) => sync((a) => ({ ...a, [index]: Date.now() + 60 * 60 * 1000 }));
  const dismiss = (index: string) => sync((a) => ({ ...a, [index]: 0 }));
  const acknowledgeAll = () => sync(() => Object.fromEntries(list.map((i) => [i.index, 0])));

  const onResolveTask = async (id: string) => {
    await fetch('/api/db/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'update', id, value: { status: 'completed' } }) });
    tasks.reload();
  };

  const onDecide = async (id: string, approved: boolean) => {
    setDeciding(id);
    try { await approvalsClient.decide(id, approved); } finally { setDeciding(null); approvals.reload(); }
  };

  const testSound = useCallback(() => playTing({ volume: 60 }), []);

  const load = approvals.loading || executions.loading || tasks.loading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Attention Required</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Real items from your workspace — approvals, failed or running executions, and overdue tasks.
            Acknowledge stops the yellow blink (and the &quot;ting&nbsp;·&nbsp;ting&nbsp;·&nbsp;ting&quot; sound);
            snooze re-flags it in an hour.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn small onClick={testSound}><PlayCircle className="h-3.5 w-3.5" /> Test sound</Btn>
          <Btn small onClick={acknowledgeAll} disabled={unseen.length === 0}><CheckCheck className="h-3.5 w-3.5" /> Acknowledge all ({unseen.length})</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BadgePill label="Approvals waiting" count={approvals.rows.filter((a) => a.status !== 'approved' && a.status !== 'rejected').length} tone="border-amber-400/40 text-amber-300" />
        <BadgePill label="Failed runs" count={executions.rows.filter((e) => e.status === 'failed').length} tone="border-rose-500/40 text-rose-300" />
        <BadgePill label="Running / queued" count={executions.rows.filter((e) => ['queued', 'waiting', 'running'].includes(e.status)).length} tone="border-blue-400/40 text-blue-300" />
        <BadgePill label="Overdue tasks" count={list.filter((i) => i.kind === 'Overdue task').length} tone="border-amber-400/40 text-amber-300" />
      </div>

      <Card>
        <CardHeader
          title="Queue"
          right={<Badge tone="amber">{unseen.length} unseen</Badge>}
          sub="Amber cards blink until acknowledged, resolved, snoozed or dismissed — sound follows the same rule."
        />
        {load ? (
          <div className="p-8"><Spinner label="Reading approvals, runs and tasks..." /></div>
        ) : list.length === 0 ? (
          <Empty title="Nothing needs attention" hint="New approvals, failed runs or overdue tasks will land here automatically." />
        ) : (
          <div className="space-y-2 p-4">
            {list.map((i) => {
              const until = ack[i.index];
              const isSnoozed = until !== undefined && until > now;
              const isDismissed = until === 0;
              const blinking = !isSnoozed && !isDismissed;
              const tone = i.tone === 'rose' ? 'border-rose-500/30 bg-rose-500/[0.06]' : i.tone === 'blue' ? 'border-blue-400/30 bg-blue-400/[0.06]' : 'border-amber-400/30 bg-[#241c05]/50';
              return (
                <div
                  key={i.index}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 ${tone} ${blinking ? 'shadow-[0_0_14px_rgba(245,158,11,0.14)]' : 'opacity-70'}`}
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {blinking && (
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${i.tone === 'rose' ? 'bg-rose-400' : i.tone === 'blue' ? 'bg-blue-400' : 'bg-amber-400'} opacity-70`} />
                    )}
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${i.tone === 'rose' ? 'bg-rose-400' : i.tone === 'blue' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-gray-100">{i.title}</p>
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-gray-500">{i.kind}</span>
                      {isSnoozed && <Badge tone="blue">snoozed</Badge>}
                      {isDismissed && <Badge tone="gray">dismissed</Badge>}
                    </div>
                    {i.detail ? <p className="mt-0.5 truncate text-[10px] text-gray-500">{i.detail}</p> : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {i.id.startsWith('task-') && (
                      <button onClick={() => onResolveTask(i.id.slice('task-'.length))} className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-400/20" title="Mark the task completed — this is a real update">
                        <CheckCheck className="h-3 w-3" /> Resolve task
                      </button>
                    )}
                    {i.id.startsWith('approval-') && (
                      <>
                        <button onClick={() => onDecide(i.id.slice('approval-'.length), true)} disabled={deciding === i.id} className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-400/20">
                          Approve
                        </button>
                        <button onClick={() => onDecide(i.id.slice('approval-'.length), false)} disabled={deciding === i.id} className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-medium text-rose-300 hover:bg-rose-500/20">
                          Reject
                        </button>
                      </>
                    )}
                    <Link href={i.link} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-gray-300 hover:bg-white/5">
                      <Eye className="h-3 w-3" /> Open
                    </Link>
                    <button onClick={() => acknowledge(i.index)} className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-emerald-300" title="Acknowledge — stop blink and sound">
                      <CheckCheck className="h-3 w-3" />
                    </button>
                    <button onClick={() => snooze(i.index)} className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-amber-300" title="Snooze for 1 hour">
                      <Clock className="h-3 w-3" />
                    </button>
                    <button onClick={() => dismiss(i.index)} className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-gray-200" title="Dismiss">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="rounded-xl border border-white/5 bg-[#11151C] px-4 py-3 text-[10px] leading-relaxed text-gray-500">
        <span className="flex items-center gap-1.5 font-semibold text-amber-300"><BellOff className="h-3.5 w-3.5" /> Sound rules</span>
        The three-tone alert only plays after you first interact with the page, respects mute / volume /
        quiet hours (Settings &gt; Audio &amp; Notifications), never repeats for the same item set, and stops as
        soon as items are resolved or acknowledged. The amber visual stays even when sound is muted.
      </div>
    </div>
  );
}

function BadgePill({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border bg-[#11151C] px-3 py-2.5 ${tone}`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-lg font-bold leading-tight">{count}</p>
      </div>
      <Inbox className="ml-auto h-3 w-3 opacity-40" />
    </div>
  );
}