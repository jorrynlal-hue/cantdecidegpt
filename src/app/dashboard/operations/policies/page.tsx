'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, TestTube2, Loader2 } from 'lucide-react';
import { api, policiesItem } from '@/lib/uiol/client';

const scopeColor: Record<string, string> = {
  action: 'text-purple-300 bg-purple-500/15',
  data: 'text-sky-300 bg-sky-500/15',
  workflow: 'text-amber-300 bg-amber-500/15',
  approval: 'text-emerald-300 bg-emerald-500/15',
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<policiesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // evaluator tester
  const [action, setAction] = useState('execute');
  const [amount, setAmount] = useState('500');
  const [evalResult, setEvalResult] = useState<Array<{ policy_id: string; decision: string; reason: string }> | null>(null);
  const [evalVerdict, setEvalVerdict] = useState<string | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await api.policies();
    setPolicies(res.policies);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.policies();
        if (!active) return;
        setPolicies(res.policies);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (id: string) => {
    setToggling(id);
    const p = policies.find((x) => x.id === id);
    if (!p) return;
    try {
      await api.updatePolicy(id, !p.enabled);
      load();
    } finally {
      setToggling(null);
    }
  };

  const runTest = async () => {
    setEvalLoading(true);
    try {
      const res = await api.evaluatePolicy({ action, amount: Number(amount) || 0 });
      setEvalResult(res.decisions);
      setEvalVerdict(res.verdict);
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><ShieldCheck className="h-6 w-6 text-purple-400" /> Policy Center</h1>
        <p className="mt-1 text-sm text-gray-400">Declarative, explainable policies evaluated before any action. Every decision is logged to the audit ledger.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading policies…</div>
          ) : (
            policies.map((p) => (
              <div key={p.id} className={`rounded-xl border p-4 ${p.enabled ? 'border-white/5 bg-[#12121a]' : 'border-white/5 bg-[#0d0d12] opacity-70'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-purple-400">{p.id}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${scopeColor[p.scope] || 'text-gray-300 bg-white/10'}`}>{p.scope}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${p.action_when_denied === 'deny' ? 'text-red-300 bg-red-500/15' : 'text-amber-300 bg-amber-500/15'}`}>on {p.action_when_denied}</span>
                      <span className="text-[10px] text-gray-600">v{p.version}</span>
                    </div>
                    <h3 className="mt-1.5 font-medium text-white">{p.name}</h3>
                    <p className="mt-0.5 text-sm text-gray-400">{p.description}</p>
                    <p className="mt-2 rounded bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-gray-300">{p.rule}</p>
                  </div>
                  <button
                    onClick={() => toggle(p.id)}
                    disabled={toggling === p.id}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${p.enabled ? 'bg-purple-500' : 'bg-white/10'} disabled:opacity-50`}
                    aria-label={p.enabled ? 'Disable policy' : 'Enable policy'}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${p.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Evaluator */}
        <div className="h-fit rounded-xl border border-white/5 bg-[#12121a] p-4 lg:sticky lg:top-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200"><TestTube2 className="h-4 w-4" /> Policy evaluator</h3>
          <p className="mt-1 text-xs text-gray-500">Test an action against the active policy set before any real work runs.</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] text-gray-400">Action</label>
              <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. execute, pay, export, read:finance" className="w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 font-mono text-xs text-white outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-400">Amount (for P-1 commitment threshold)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 font-mono text-xs text-white outline-none focus:border-purple-500/50" />
            </div>
            <button onClick={runTest} disabled={evalLoading} className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-500 hover:to-purple-400 disabled:opacity-50">
              {evalLoading ? 'Evaluating…' : 'Evaluate action'}
            </button>
          </div>
          {evalVerdict && (
            <div className="mt-4 space-y-2">
              <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                evalVerdict === 'deny' ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : evalVerdict === 'escalate' ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              }`}>Verdict: <strong>{evalVerdict}</strong></p>
              {evalResult?.map((d) => (
                <div key={d.policy_id} className="rounded-lg bg-white/5 p-2.5 text-xs">
                  <p className="font-medium text-gray-300">{d.policy_id} · <span className="uppercase text-purple-300">{d.decision}</span></p>
                  <p className="mt-0.5 text-gray-500">{d.reason}</p>
                </div>
              ))}
              {(!evalResult || evalResult.length === 0) && <p className="text-xs text-gray-500">No policy restrictions triggered for this action.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}