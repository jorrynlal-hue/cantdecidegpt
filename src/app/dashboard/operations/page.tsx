'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, ClipboardList, Inbox, Loader2, X, ArrowRight } from 'lucide-react';
import { api, fmtDate, CURRENT_ACTOR, statsShape, templateShape, userShape, WorkItem } from '@/lib/uiol/client';
import { ControlModeBadge, RiskBadge, StageBadge, ActorLabel } from '@/components/uiol/badges';
import ControlModeDial from '@/components/uiol/controlModeDial';
import { ControlMode, STAGE_ORDER } from '@/lib/uiol/types';

export default function OperationsQueuePage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [stats, setStats] = useState<statsShape | null>(null);
  const [templates, setTemplates] = useState<templateShape[]>([]);
  const [users, setUsers] = useState<userShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [wl, st, tl] = await Promise.all([api.workitems({ stage, q }), api.stats(), api.templates()]);
    setItems(wl.items);
    setStats(st.stats);
    setTemplates(tl.templates);
    setUsers(tl.users);
  }, [stage, q]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [wl, st, tl] = await Promise.all([api.workitems({ stage, q }), api.stats(), api.templates()]);
        if (!active) return;
        setItems(wl.items);
        setStats(st.stats);
        setTemplates(tl.templates);
        setUsers(tl.users);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [stage, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ClipboardList className="h-6 w-6 text-purple-400" /> Work Queue
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Governed work items flowing through the nine-stage lifecycle. Every run is auditable end-to-end.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-purple-400"
        >
          <Plus className="h-4 w-4" /> New Work Item
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'In Progress', value: stats.workitems.in_progress, accent: 'text-purple-300' },
            { label: 'Awaiting Approval', value: stats.workitems.awaiting_approval, accent: 'text-orange-300' },
            { label: 'Completed', value: stats.workitems.completed, accent: 'text-emerald-300' },
            { label: 'Success Rate', value: `${stats.workitems.success_rate}%`, accent: 'text-sky-300' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-[#12121a] p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStage('')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!stage ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All
        </button>
        {STAGE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStage(stage === s ? '' : s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${stage === s ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-56 rounded-lg border border-white/10 bg-[#12121a] py-1.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading work items…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <Inbox className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-sm text-gray-400">No work items match. Create one from a wedge workflow.</p>
          <button onClick={() => setCreating(true)} className="mt-4 text-sm font-medium text-purple-400 hover:text-purple-300">
            Create your first work item →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/operations/${item.id}`}
              className="group block rounded-xl border border-white/5 bg-[#12121a] p-4 transition hover:border-purple-500/30 hover:bg-[#16161f]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono text-gray-500">{item.id}</span>
                <StageBadge stage={item.stage} status={item.stage_status[item.stage]} />
                <ControlModeBadge mode={item.control_mode} />
                <RiskBadge risk={item.risk_classification} />
                <span className="ml-auto text-[11px] text-gray-500">updated {fmtDate(item.updated_at)}</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400 line-clamp-1">{item.objective}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-purple-400" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="text-gray-400">Workflow: <span className="text-gray-300">{item.workflow}</span></span>
                <ActorLabel actor={item.requester} short />
                <span>Owner: <span className="text-gray-300">{item.accountable_owner}</span></span>
                <span className={item.exceptions.length ? 'text-orange-300' : ''}>
                  {item.exceptions.length ? `${item.exceptions.length} exception(s)` : 'No exceptions'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <NewWorkItemModal
          templates={templates}
          users={users}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setQ('');
            setStage('');
            load();
          }}
        />
      )}
    </div>
  );
}

function NewWorkItemModal({
  templates,
  users,
  onClose,
  onCreated,
}: {
  templates: templateShape[];
  users: userShape[];
  onClose: () => void;
  onCreated: (wi: WorkItem) => void;
}) {
  const [selected, setSelected] = useState<string>(templates[0]?.id || '');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [related, setRelated] = useState('');
  const [mode, setMode] = useState<ControlMode>(templates[0]?.default_control_mode || 'human_approves');
  const [userId, setUserId] = useState<string>(users[0]?.id || 'u-1');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tpl = templates.find((t) => t.id === selected);

  const submit = async () => {
    if (!tpl) return;
    if (!title.trim() || !objective.trim()) {
      setErr('Title and objective are required.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await api.createWorkitem({
        template_id: tpl.id,
        title: title.trim(),
        objective: objective.trim(),
        related_customer_case: related.trim() || undefined,
        control_mode: mode,
        requester_id: userId,
      }, CURRENT_ACTOR);
      onCreated(res.workitem);
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#12121a] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Work Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-gray-400">Wedge workflow template</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelected(t.id);
                setObjective('');
                setMode(t.default_control_mode);
              }}
              className={`rounded-lg border p-3 text-left transition ${selected === t.id ? 'border-purple-500/60 bg-purple-500/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{t.name}</span>
                <RiskBadge risk={t.risk_class as WorkItem['risk_classification']} />
              </span>
              <span className="mt-1 block text-[11px] text-gray-500">{t.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title — e.g., Onboard: Northwind Analytics (expansion)"
            className="w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
          />
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder={tpl ? `Objective — e.g., ${tpl.plan_shell[0]?.summary.toLowerCase()}…` : 'Objective'}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={related}
              onChange={(e) => setRelated(e.target.value)}
              placeholder="Related case / PO (optional)"
              className="w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
            />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.roles[0]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-gray-400">Autonomy control mode (dial, never a switch — B4)</p>
          <ControlModeDial value={mode} onChange={setMode} />
        </div>

        {tpl && (
          <p className="mt-3 rounded-lg border border-white/10 bg-[#0d0d12] p-3 text-xs text-gray-400">
            <span className="font-medium text-amber-300">Value hypothesis:</span> {tpl.value_hypothesis}
            <br />
            <span className="font-medium text-gray-300">Side effects:</span> {tpl.side_effect_hints.join(', ') || 'none'} — these will be gated by policy and approval.
          </p>
        )}

        {err && <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

        <div className="mt-5 flex gap-3">
          <button onClick={submit} disabled={saving} className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-purple-400 disabled:opacity-50">
            {saving ? 'Creating…' : 'Capture Work Item'}
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}