'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ScrollText, CheckCircle2, AlertTriangle, ThumbsUp, Eye, PenLine, Send, CreditCard, Megaphone, UserCheck, Users } from 'lucide-react';
import { api, eventItem, statsShape } from '@/lib/uiol/client';
import { ActorLabel } from '@/components/uiol/badges';

// Trust Center (strategy §): AI permissions, approval tiers, and the audit timeline.
export default function TrustCenterPage() {
  const [stats, setStats] = useState<statsShape | null>(null);
  const [audit, setAudit] = useState<eventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [st, au] = await Promise.all([api.stats(), api.audit({ limit: 12 })]);
        if (!active) return;
        setStats(st.stats);
        setAudit(au.events);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const aiPermissions = [
    { icon: Eye, label: 'Read data', on: true },
    { icon: PenLine, label: 'Write / draft', on: true },
    { icon: Send, label: 'Send messages', on: false },
    { icon: CreditCard, label: 'Execute transactions', on: false },
    { icon: Megaphone, label: 'Publish externally', on: false },
    { icon: UserCheck, label: 'Hire / contract', on: false },
  ];

  const approvalTiers = [
    { label: 'Under $100', allowed: 'AI can execute autonomously', note: 'within policy bounds' },
    { label: '$100 – $1,000', allowed: 'Manager approval required', note: 'escalated to human approver' },
    { label: 'Above $1,000', allowed: 'Owner approval required', note: 'human must sign the decision receipt' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <ShieldCheck className="h-6 w-6 text-purple-400" /> Trust Center
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Permissions, approval rules, policies and a provable audit timeline. Because AI acts in the real world, every action is accountable.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {/* Trust stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Audit events', value: stats.audit.events, tone: 'text-purple-300' },
            { label: 'Active actors', value: stats.audit.actors, tone: 'text-sky-300' },
            { label: 'Unauthorized actions', value: stats.measurement.trust.unauthorized_action_rate, tone: 'text-emerald-300' },
            { label: 'Critical incidents', value: stats.measurement.trust.critical_incidents, tone: 'text-emerald-300' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-[#12121a] p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* AI Permissions */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-purple-300" /> AI permissions</h2>
          <p className="mt-1 text-xs text-gray-400">What the AI can and cannot do automatically.</p>
          <div className="mt-3 space-y-2">
            {aiPermissions.map((p) => (
              <div key={p.label} className={`flex items-center justify-between rounded-lg border p-2.5 ${p.on ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-[#0d0d12] opacity-70'}`}>
                <span className="flex items-center gap-2 text-xs text-gray-200"><p.icon className="h-3.5 w-3.5" /> {p.label}</span>
                {p.on ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Allowed</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500"><AlertTriangle className="h-3.5 w-3.5" /> Requires human</span>
                )}
              </div>
            ))}
          </div>
          <Link href="/dashboard/operations/policies" className="mt-3 inline-block text-[11px] text-purple-400 hover:text-purple-300">Manage policies →</Link>
        </div>

        {/* Approval tiers */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ThumbsUp className="h-4 w-4 text-purple-300" /> Approval rules</h2>
          <p className="mt-1 text-xs text-gray-400">Customizable escalation thresholds for AI execution.</p>
          <div className="mt-3 space-y-2">
            {approvalTiers.map((t, i) => (
              <div key={t.label} className="rounded-lg border border-white/10 bg-[#0d0d12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{t.label}</span>
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">Tier {i + 1}</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{t.allowed}</p>
                <p className="text-[10px] text-gray-600">{t.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">Higher-risk work and external side effects always route to a human approval gate.</p>
        </div>

        {/* Human permissions */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-purple-300" /> Human roles</h2>
          <p className="mt-1 text-xs text-gray-400">Roles bound to approval authority in the control plane.</p>
          <div className="mt-3 space-y-2">
            {[
              { role: 'Owner', note: 'Final authority; clears highest tiers' },
              { role: 'Manager', note: 'Approves mid-tier execution' },
              { role: 'Worker', note: 'Executes assigned work' },
              { role: 'Contractor', note: 'Project-scoped access' },
              { role: 'Reviewer', note: 'Verifies quality and outcome' },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0d0d12] p-2.5">
                <span className="text-xs font-medium text-gray-200">{r.role}</span>
                <span className="text-[10px] text-gray-600">{r.note}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/team" className="mt-3 inline-block text-[11px] text-purple-400 hover:text-purple-300">Manage team →</Link>
        </div>
      </div>

      {/* Audit timeline */}
      <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ScrollText className="h-4 w-4 text-purple-300" /> Audit timeline</h2>
          <Link href="/dashboard/operations/audit" className="text-[11px] text-purple-400 hover:text-purple-300">Full ledger →</Link>
        </div>
        <p className="mt-1 text-xs text-gray-400">Every important action, in order, forever.</p>
        {loading ? (
          <p className="py-8 text-center text-xs text-gray-600">Loading timeline…</p>
        ) : (
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {audit.map((ev) => (
              <div key={ev.id} className="flex gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px]">•</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-200">
                    <span className="font-mono text-purple-300">{new Date(ev.at).toLocaleTimeString()}</span>{' '}
                    <span className="font-medium">{ev.action}</span>
                    {ev.to ? <span className="text-gray-500"> → {ev.to}</span> : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{ev.details}</p>
                  <p className="mt-0.5 text-[10px] text-gray-600"><ActorLabel actor={ev.actor} short /> · {ev.workitem_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}