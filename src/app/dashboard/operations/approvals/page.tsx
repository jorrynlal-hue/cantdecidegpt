'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, Check, X, Loader2, Inbox, GitPullRequest } from 'lucide-react';
import { api, CURRENT_ACTOR, fmtDate } from '@/lib/uiol/client';
import { ControlModeBadge, RiskBadge, StageBadge } from '@/components/uiol/badges';
import { useCollection } from '@/components/platform/data';

interface ApprovalRow {
  workitem: { id: string; title: string; objective: string; stage: string; control_mode: import('@/lib/uiol/types').ControlMode; risk_classification: import('@/lib/uiol/types').RiskClass; stage_status: Record<string, string>; updated_at: string };
  approval: { id: string; title: string; required_roles: string[]; status: string; note?: string };
}

interface AutoApproval {
  id: string;
  title: string;
  detail?: string;
  kind: string;
  status: string;
  requestedById: string;
  requestedByName?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  decidedAt?: string;
  decidedById?: string;
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const autoApprovals = useCollection<AutoApproval>('approvals', { status: pendingOnly ? 'pending' : 'all' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.approvals(pendingOnly);
        if (!active) return;
        setRows(res.approvals as ApprovalRow[]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pendingOnly]);

  const act = async (wi: string, ap: string, decision: 'approved' | 'rejected') => {
    setBusyId(ap);
    setMsg(null);
    try {
      await api.actApproval({ workitem_id: wi, approval_id: ap, decision }, CURRENT_ACTOR);
      setBusyId(null);
      const res = await api.approvals(pendingOnly);
      setRows(res.approvals as ApprovalRow[]);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => r.approval.status === 'pending').length;
  const autoPending = autoApprovals.rows.filter((r) => r.status === 'pending').length;

  const decideAuto = async (id: string, decision: 'approve' | 'reject') => {
    if (!confirm(`${decision === 'approve' ? 'Approve' : 'Reject'} this request?`)) return;
    setBusyId(`auto-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error?.message ?? d?.error ?? 'Failed');
      }
      autoApprovals.reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CheckSquare className="h-6 w-6 text-purple-400" /> Approval Center</h1>
          <p className="mt-1 text-sm text-gray-400">{pending + autoPending} approval(s) awaiting your decision — work items and automation steps.</p>
        </div>
        <div className="flex rounded-lg border border-white/10 p-0.5">
          <button onClick={() => setPendingOnly(true)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${pendingOnly ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'}`}>Pending</button>
          <button onClick={() => setPendingOnly(false)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${!pendingOnly ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'}`}>History</button>
        </div>
      </div>

      {msg && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{msg}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading approvals…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <Inbox className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-sm text-gray-400">No approvals here. Decisions you make on any work item will appear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ workitem, approval }) => (
            <div key={approval.id} className={`rounded-xl border p-4 ${approval.status === 'pending' ? 'border-amber-500/20 bg-[#14131a]' : approval.status === 'approved' ? 'border-emerald-500/15 bg-[#12121a]' : 'border-red-500/15 bg-[#12121a]'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/operations/${workitem.id}`} className="font-mono text-xs text-purple-400 hover:underline">{workitem.id}</Link>
                <StageBadge stage={workitem.stage} status={workitem.stage_status[workitem.stage]} />
                <ControlModeBadge mode={workitem.control_mode} />
                <RiskBadge risk={workitem.risk_classification} />
                <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  approval.status === 'pending' ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                  : approval.status === 'approved' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                  : 'border-red-400/30 bg-red-500/15 text-red-300'
                }`}>{approval.status}</span>
              </div>
              <Link href={`/dashboard/operations/${workitem.id}`} className="mt-2 block font-medium text-white hover:text-purple-300">{workitem.title}</Link>
              <p className="mt-0.5 text-sm text-gray-400 line-clamp-1">{workitem.objective}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
                <div>
                  <p className="text-sm text-gray-200">{approval.title}</p>
                  <p className="text-[11px] text-gray-500">required: {approval.required_roles.join(', ') || 'none'} · updated {fmtDate(workitem.updated_at)}</p>
                </div>
                {approval.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => act(workitem.id, approval.id, 'approved')} disabled={busyId === approval.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => act(workitem.id, approval.id, 'rejected')} disabled={busyId === approval.id} className="inline-flex items-center gap-1 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">{approval.note || 'Decision recorded'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    {autoApprovals.rows.length > 0 && (
        <div className="pt-2">
          <div className="mb-3 flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Automation approvals</h2>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-gray-400">{autoApprovals.rows.length}</span>
          </div>
          <div className="space-y-3">
            {autoApprovals.rows.map((a) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.status === 'pending' ? 'border-sky-500/20 bg-[#0f1220]' : a.status === 'approved' ? 'border-emerald-500/15 bg-[#12121a]' : 'border-red-500/15 bg-[#12121a]'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-sky-400">{a.id}</span>
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">{a.kind}</span>
                  <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    a.status === 'pending' ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                    : a.status === 'approved' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                    : 'border-red-400/30 bg-red-500/15 text-red-300'
                  }`}>{a.status}</span>
                </div>
                <p className="mt-2 font-medium text-white">{a.title}</p>
                {a.detail ? <p className="mt-0.5 text-sm text-gray-400">{a.detail}</p> : null}
                {a.payload ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-white/5 p-2 text-[10px] text-gray-400">{JSON.stringify(a.payload, null, 2)}</pre>
                ) : null}
                <p className="mt-2 text-[11px] text-gray-500">
                  raised by {a.requestedByName ?? a.requestedById} · {fmtDate(a.createdAt)}
                  {a.decidedAt ? ` · decided ${fmtDate(a.decidedAt)}` : ''}
                </p>
                {a.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => decideAuto(a.id, 'approve')} disabled={busyId === `auto-${a.id}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => decideAuto(a.id, 'reject')} disabled={busyId === `auto-${a.id}`} className="inline-flex items-center gap-1 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="mt-3 inline-block text-xs text-gray-500">Decision recorded</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}