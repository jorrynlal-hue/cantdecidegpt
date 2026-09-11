'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap, Bot, User, Hourglass, CheckCircle2, ArrowRight, Loader2, Compass, Briefcase, Users, Sparkles,
  ClipboardList, ShieldCheck, Handshake, Workflow as WorkflowIcon,
} from 'lucide-react';
import { api, CommandCard, CommandBucket, CURRENT_ACTOR } from '@/lib/uiol/client';
import { EXECUTION_MODE_META, BUCKET_LABELS, ExecutionMode } from '@/lib/uiol/layer';
import { StageBadge, ControlModeBadge, ActorLabel } from '@/components/uiol/badges';
import ExecutionControl from '@/components/uiol/executionControl';
import { useCollection } from '@/components/platform/data';

interface HumanRow { id: string; name: string; role: string; status: string; }
interface WorkflowRow { id: string; name: string; enabled: boolean; }
interface WorkspaceRow { id: string; name: string; }

const BUCKET_ORDER: CommandBucket[] = ['now', 'ai_working', 'waiting', 'completed'];

export default function CommandCenterPage() {
  const [buckets, setBuckets] = useState<Record<CommandBucket, CommandCard[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tell, setTell] = useState('');
  const [mode, setMode] = useState<ExecutionMode>('auto');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const humans = useCollection<HumanRow>('humans', {});
  const workflows = useCollection<WorkflowRow>('workflows', {});
  const workspaces = useCollection<WorkspaceRow>('workspaces', {});

  const load = useCallback(async () => {
    try {
      const cc = await api.command();
      setBuckets(cc.command.buckets);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cc = await api.command();
        if (!active) return;
        setBuckets(cc.command.buckets);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const tellNow = async () => {
    const goal = tell.trim();
    if (!goal || sending) return;
    setSending(true);
    setSent(null);
    try {
      const res = await api.createWorkitem(
        {
          template_id: 'tpl-01',
          title: goal.length > 80 ? goal.slice(0, 80) : goal,
          objective: goal,
          control_mode: 'human_approves',
          execution_mode: mode,
          requester_id: 'u-1',
          requester_display: CURRENT_ACTOR.display,
        },
        CURRENT_ACTOR
      );
      setSent(res.workitem.id);
      setTell('');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const active = buckets ? (buckets.now.length + buckets.ai_working.length + buckets.waiting.length) : 0;
  const aiWorkers = 8;

  return (
    <div className="space-y-6">
      {/* Hero: What are we getting done today? */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-[#12121a] p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-300">
          <Compass className="h-4 w-4" /> Command Center
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">What are we getting done today?</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Tell us what you want done. We connect the right people, AI, tools and businesses to get it done.
        </p>

        <div className="mt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tell}
              onChange={(e) => setTell(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') tellNow(); }}
              placeholder="e.g., Launch my new online store · Find me three video editors · Build a marketing team · Start my business"
              className="flex-1 rounded-lg border border-white/10 bg-[#0d0d12] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/60"
            />
            <button
              onClick={tellNow}
              disabled={sending || !tell.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:from-purple-500 hover:to-fuchsia-400 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" /> {sending ? 'Capturing…' : 'Get it done'}
            </button>
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-500">Who runs this work?</p>
            <ExecutionControl value={mode} onChange={setMode} showRecommended />
          </div>
          {sent && (
            <p className="mt-3 text-sm text-emerald-300">
              Captured as <Link href={`/dashboard/operations/${sent}`} className="font-mono underline">{sent}</Link> — routed through the control plane. Open it to review or take over.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Your World */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: Bot, label: 'AI workers', value: aiWorkers, href: '/dashboard/workforce' },
          { icon: Users, label: 'Human collaborators', value: humans.rows.length, href: '/dashboard/humans' },
          { icon: ClipboardList, label: 'Active work', value: active, href: '/dashboard/operations' },
          { icon: WorkflowIcon, label: 'Automations', value: workflows.rows.filter((w) => w.enabled).length, href: '/dashboard/automation' },
          { icon: Briefcase, label: 'Businesses', value: workspaces.rows.length || 1, href: '/dashboard/platform' },
          { icon: Handshake, label: 'Opportunities', value: 0, href: '/dashboard/marketplace' },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl border border-white/5 bg-[#12121a] p-4 transition hover:border-purple-500/30">
            <s.icon className="h-4 w-4 text-purple-400" />
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Buckets */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Assembling the world…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BUCKET_ORDER.map((bk) => {
            const cards = buckets?.[bk] ?? [];
            const meta = BUCKET_LABELS[bk];
            const tint =
              bk === 'now' ? 'border-rose-500/30' : bk === 'ai_working' ? 'border-purple-500/30' : bk === 'waiting' ? 'border-amber-500/30' : 'border-emerald-500/30';
            const Icon = bk === 'now' ? Zap : bk === 'ai_working' ? Bot : bk === 'waiting' ? Hourglass : CheckCircle2;
            return (
              <div key={bk} className={`rounded-xl border bg-[#101018] p-4 ${tint}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${bk === 'now' ? 'text-rose-300' : bk === 'ai_working' ? 'text-purple-300' : bk === 'waiting' ? 'text-amber-300' : 'text-emerald-300'}`} />
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-200">{meta.label}</p>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">{cards.length}</span>
                  </div>
                  <p className="hidden text-[10px] text-gray-500 sm:block">{meta.sub}</p>
                </div>
                {cards.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-600">Nothing here.</p>
                ) : (
                  <div className="space-y-2">
                    {cards.slice(0, 6).map((c) => (
                      <Link
                        key={c.item.id}
                        href={`/dashboard/operations/${c.item.id}`}
                        className="block rounded-lg border border-white/5 bg-[#0d0d12] p-3 transition hover:border-purple-500/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-600">{c.item.id}</span>
                          <StageBadge stage={c.item.stage} status={c.item.stage_status[c.item.stage]} />
                          <ControlModeBadge mode={c.execution.control_mode} />
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-gray-100">{c.item.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{c.summary}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            {c.execution.execution_mode === 'ai_only' ? <Bot className="h-3 w-3 text-purple-400" /> : c.execution.control_mode === 'human_only' ? <User className="h-3 w-3 text-emerald-400" /> : <Sparkles className="h-3 w-3 text-purple-400" />}
                            {EXECUTION_MODE_META[c.execution.execution_mode]?.label || c.item.control_mode}
                          </span>
                          <ActorLabel actor={c.item.requester} short />
                        </div>
                      </Link>
                    ))}
                    {cards.length > 6 && (
                      <Link href="/dashboard/operations" className="flex items-center gap-1 px-1 text-xs text-purple-400 hover:text-purple-300">
                        View all {cards.length} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick routes */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { href: '/dashboard/operations', label: 'Work Queue', icon: ClipboardList },
          { href: '/dashboard/workforce', label: 'AI Workforce', icon: Bot },
          { href: '/dashboard/skills', label: 'Skills', icon: Sparkles },
          { href: '/dashboard/humans', label: 'Human Workspace', icon: Users },
          { href: '/dashboard/trust', label: 'Trust Center', icon: ShieldCheck },
          { href: '/dashboard/marketplace', label: 'Opportunities', icon: Handshake },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#12121a] px-3 py-1.5 text-xs text-gray-300 transition hover:border-purple-500/30 hover:text-white">
            <l.icon className="h-3.5 w-3.5" /> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}