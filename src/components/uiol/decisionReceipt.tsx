'use client';

import { CheckCircle2, ShieldCheck, User, Bot, AlertTriangle } from 'lucide-react';
import { DecisionReceipt } from '@/lib/uiol/layer';

// Decision Receipt (strategy §): a durable, human-readable receipt for completed work.
export default function DecisionReceiptCard({ receipt }: { receipt: DecisionReceipt }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Decision Receipt
        </h3>
        <span className="font-mono text-[10px] text-gray-500">{receipt.receipt_id}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Action taken</p>
          <p className="mt-0.5 text-sm text-gray-200">{receipt.action_taken}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Why</p>
          <p className="mt-0.5 text-sm text-gray-400">{receipt.why}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Information used</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {receipt.information_used.map((i) => (
            <span key={i} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">{i}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Confidence</p>
          <p className={`mt-0.5 text-sm font-semibold ${
            receipt.confidence === 'high' ? 'text-emerald-300' : receipt.confidence === 'medium' ? 'text-amber-300' : 'text-rose-300'
          }`}>{receipt.confidence}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Executed by</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-200">
            {receipt.executed_by.toLowerCase().includes('ai') || receipt.executed_by === 'AI' ? <Bot className="h-3.5 w-3.5 text-purple-300" /> : <User className="h-3.5 w-3.5 text-emerald-300" />}
            {receipt.executed_by}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Human approval</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-200">
            <ShieldCheck className={`h-3.5 w-3.5 ${receipt.human_approval.granted ? 'text-emerald-300' : 'text-gray-500'}`} />
            {receipt.human_approval.required ? (receipt.human_approval.granted ? `by ${receipt.human_approval.approver || 'approved'}` : 'required, not granted') : 'not required'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Risk class</p>
          <p className={`mt-0.5 text-sm font-semibold ${
            receipt.risk_class === 'critical' || receipt.risk_class === 'high' ? 'text-rose-300' : receipt.risk_class === 'medium' ? 'text-amber-300' : 'text-emerald-300'
          }`}>{receipt.risk_class}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Controls applied</p>
        <div className="mt-1 space-y-1">
          {receipt.controls.map((c) => (
            <p key={c.policy_id} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                c.decision === 'deny' ? 'bg-rose-500/20 text-rose-300' : c.decision === 'escalate' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>{c.decision}</span>
              <span className="font-mono">{c.policy_id}</span> — {c.reason}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-600">Sealed {new Date(receipt.sealed_at).toLocaleString()}. {receipt.workitem_id} · proof of work.</p>
      {!receipt.human_approval.granted && receipt.human_approval.required && (
        <p className="mt-2 flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" /> Recommended human review is outstanding on this item.
        </p>
      )}
    </div>
  );
}