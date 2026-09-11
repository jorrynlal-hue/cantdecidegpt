'use client';

import { useEffect, useState } from 'react';
import { Activity, Loader2, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react';
import { api, statsShape } from '@/lib/uiol/client';

export default function MetricsPage() {
  const [stats, setStats] = useState<statsShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.stats();
        if (!active) return;
        setStats(res.stats);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !stats) {
    return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Computing measurements…</div>;
  }

  const m = stats.measurement;
  const maxFunnel = Math.max(...stats.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Activity className="h-6 w-6 text-purple-400" /> Measure & Learn</h1>
        <p className="mt-1 text-sm text-gray-400">Volume of AI interactions is never the metric. Only reliable customer outcomes count.</p>
        <p className="mt-3 rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-xs text-gray-400"><span className="font-medium text-purple-300">{stats.org.name}</span> — {stats.org.context}</p>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-200">Lifecycle completion funnel</h3>
        <div className="space-y-1.5">
          {stats.funnel.map((f) => (
            <div key={f.stage} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-gray-400">{f.stage}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                <div className="h-full rounded bg-gradient-to-r from-purple-600/70 to-purple-400/70" style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-xs text-gray-300">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Dash title="Customer outcomes" icon={<TrendingUp className="h-4 w-4" />} rows={[
          ['Time to completed outcome (avg days)', m.outcome.time_to_completion_avg_days],
          ['Manual handoffs (avg)', m.outcome.manual_handoffs_avg],
          ['Evidence entries per item', m.outcome.evidence_per_item],
          ['Approval turnaround (avg hrs)', m.outcome.approval_turnaround_avg_hrs],
        ]} />
        <Dash title="Product" icon={<Activity className="h-4 w-4" />} rows={[
          ['Completion rate', `${m.product.completion_rate}%`],
          ['Human intervention rate', `${m.product.human_intervention_rate}%`],
          ['Policy escalation rate', `${m.product.policy_escalation_rate}%`],
          ['Work items in flight', stats.workitems.in_progress],
        ]} />
        <Dash title="Trust & safety" icon={<ShieldCheck className="h-4 w-4" />} rows={[
          ['Unauthorized action rate', `${m.trust.unauthorized_action_rate}%`],
          ['Policy bypass rate', `${m.trust.policy_bypass_rate}%`],
          ['Critical incidents', m.trust.critical_incidents],
          ['Audit completeness', `${m.trust.audit_completeness}%`],
        ]} />
        <Dash title="Business" icon={<DollarSign className="h-4 w-4" />} rows={[
          ['Paying customers', m.business.paying_customers],
          ['Expansion revenue', `${m.business.expansion_revenue_pct}%`],
          ['Gross margin after model cost', `${m.business.gross_margin_model}%`],
          ['Policy denials to date', stats.workitems.policy_denials],
        ]} />
      </div>

      {/* B1 reminder */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-purple-200/80">
        <strong>Principle reminder (B1.1):</strong> Intelligence is replaceable. Trust is earned per workflow: customers adopt one controlled process, see the measurement above, then expand. No day-one full autonomy.
      </div>
    </div>
  );
}

function Dash({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: Array<[string, string | number]> }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-200">{icon}{title}</h3>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-2">
            <dt className="text-xs text-gray-400">{k}</dt>
            <dd className="font-mono text-sm font-semibold text-white">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}