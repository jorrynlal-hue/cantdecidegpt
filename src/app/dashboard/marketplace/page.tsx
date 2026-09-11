'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, ArrowRight, Bot, Users, Layers, Clock, IndianRupee, BadgeCheck, PackageSearch } from 'lucide-react';
import { api, WorkItem } from '@/lib/uiol/client';
import { EXECUTION_MODE_META, SKILLS } from '@/lib/uiol/layer';
import { useCollection } from '@/components/platform/data';

interface HumanRow { id: string; name: string; role: string; status: string; skills: string[]; aiAssist: string[]; }

const EXEC_TONE: Record<string, string> = {
  ai_only: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  ai_to_human: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  human_to_ai: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  human_only: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  ai_and_human: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  auto: 'border-white/20 bg-white/10 text-gray-200',
};

export default function MarketplacePage() {
  const [open, setOpen] = useState<WorkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const humans = useCollection<HumanRow>('humans', {});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const q = await api.workitems({ stage: 'capture' });
        if (!active) return;
        setOpen(q.items.filter((i) => !i.participants.length));
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => { active = false; };
  }, []);

  const execMeta = (m: string) => EXECUTION_MODE_META[m as keyof typeof EXECUTION_MODE_META];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Store className="h-6 w-6 text-purple-400" /> Service Marketplace
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          What do you need done? Every service can be delivered by AI, a human, or a hybrid team — compare and choose.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {/* Ask banner */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-[#12121a] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">Need something done?</p>
        <p className="mt-1 text-sm text-gray-200">Tell the Command Center what you need — a video, a website, a contract review, a marketing push. It scouts AI, humans, and hybrid teams to get it done.</p>
        <Link href="/dashboard/command" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-purple-400">
          <PackageSearch className="h-4 w-4" /> Make a request <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Opportunities feed */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ArrowRight className="h-4 w-4 text-purple-300" /> Opportunity feed</h2>
            <Link href="/dashboard/operations" className="text-[11px] text-purple-400 hover:text-purple-300">Work queue →</Link>
          </div>
          <p className="mt-1 text-xs text-gray-400">Open work in the network right now — who no one has claimed yet.</p>
          {open.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-600">No open opportunities. Create one from the Command Center.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {open.map((w) => {
                const meta = w.execution_mode ? execMeta(w.execution_mode) : undefined;
                return (
                  <Link key={w.id} href={`/dashboard/operations/${w.id}`} className="group flex items-start gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3 transition hover:border-purple-500/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-gray-100 group-hover:text-purple-300">{w.title}</p>
                        {meta && w.execution_mode && <span className={`rounded border px-1.5 py-0.5 text-[10px] ${EXEC_TONE[w.execution_mode] || EXEC_TONE.auto}`}>{meta.label}</span>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{w.objective}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {w.stage}</span>
                        <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" /> N/A</span>
                        {w.control_mode === 'human_only' && <span className="text-emerald-500">Needs a human</span>}
                      </div>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 group-hover:text-purple-300" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* People available */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-purple-300" /> People available</h2>
          <p className="mt-1 text-xs text-gray-400">Humans in this workspace you can pull into work.</p>
          <div className="mt-3 space-y-2">
            {humans.rows.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-600">No people yet.</p>
            ) : (
              humans.rows.map((h) => (
                <Link key={h.id} href="/dashboard/humans" className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0d0d12] p-3 transition hover:border-purple-500/30">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-xs font-bold text-purple-300">{h.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-xs font-medium text-gray-100"><BadgeCheck className="h-3 w-3 text-emerald-400" /> {h.name}</p>
                    <p className="truncate text-[10px] text-gray-500">{h.role}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${h.status === 'available' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{h.status}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Service catalog */}
      <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Layers className="h-4 w-4 text-purple-300" /> Service catalog</h2>
          <Link href="/dashboard/skills" className="text-[11px] text-purple-400 hover:text-purple-300">Skills →</Link>
        </div>
        <p className="mt-1 text-xs text-gray-400">Standard services with three delivery options.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/5 bg-[#0d0d12] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-100">{s.name}</p>
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-300"><Bot className="h-2.5 w-2.5" /> AI</span>
                  <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300"><Users className="h-2.5 w-2.5" /> Human</span>
                  <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300"><Layers className="h-2.5 w-2.5" /> Hybrid</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">{s.blurb}</p>
              <p className="mt-1 text-[10px] text-gray-600">Compare: price · delivery · quality · availability</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}