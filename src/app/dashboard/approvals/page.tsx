'use client';

import { useState } from 'react';
import { Check, X, FileText } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Empty, Spinner, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface Approval { id: string; title: string; detail?: string; kind: string; status: string; requestedById: string; requestedByName?: string; payload?: Record<string, unknown>; createdAt: string; decidedAt?: string; decidedById?: string; }

const stTone = (s: string) => (s === 'approved' ? 'green' : s === 'rejected' ? 'red' : s === 'cancelled' ? 'gray' : 'amber') as 'green' | 'red' | 'gray' | 'amber';

export default function ApprovalsPage() {
  const [filter, setFilter] = useState('pending');
  const approvals = useCollection<Approval>('approvals', { status: filter });
  const [busy, setBusy] = useState(false);

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    if (!confirm(`${decision === 'approve' ? 'Approve' : 'Reject'} this request?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Failed');
      }
      approvals.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Requests raised by people and automation steps.</p>
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{f}</button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title={`${filter === 'all' ? 'All' : filter} requests`} />
        {approvals.loading ? <Spinner /> : approvals.rows.length === 0 ? (
          <Empty title="Nothing here" hint="Request an approval through the UI or an automation step." />
        ) : (
          <div className="divide-y divide-white/5">
            {approvals.rows.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-purple-400" /> {a.title}</p>
                    {a.detail ? <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p> : null}
                    {a.payload ? <p className="text-[10px] text-gray-600 mt-0.5">Payload: {JSON.stringify(a.payload)}</p> : null}
                    <p className="text-[10px] text-gray-600 mt-0.5">{a.kind} · by {a.requestedByName ?? a.requestedById} · {fmtDateTime(a.createdAt)}{a.decidedAt ? ` · decided ${fmtDateTime(a.decidedAt)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={stTone(a.status)}>{a.status}</Badge>
                    {a.status === 'pending' && (
                      <>
                        <Btn kind="outline" small onClick={() => decide(a.id, 'approve')} disabled={busy}><Check className="w-3 h-3" /> Approve</Btn>
                        <Btn kind="danger" small onClick={() => decide(a.id, 'reject')} disabled={busy}><X className="w-3 h-3" /> Reject</Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}