'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, Check, X, Loader2, Inbox } from 'lucide-react';
import { api, CURRENT_ACTOR, fmtDate } from '@/lib/uiol/client';
import { ControlModeBadge, RiskBadge, StageBadge } from '@/components/uiol/badges';

interface ApprovalRow {
  workitem: { id: string; title: string; objective: string; stage: string; control_mode: import('@/lib/uiol/types').ControlMode; risk_classification: import('@/lib/uiol/types').RiskClass; stage_status: Record<string, string>; updated_at: string };
  approval: { id: string; title: string; required_roles: string[]; status: string; note?: string };
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CheckSquare className="h-6 w-6 text-purple-400" /> Approval Center</h1>
          <p className="mt-1 text-sm text-gray-400">{pending} approval(s) awaiting your decision across all work items.</p>
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
    </div>
  );
}