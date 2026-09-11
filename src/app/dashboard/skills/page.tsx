'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Bot, Users, Brain, ArrowRight } from 'lucide-react';
import { api } from '@/lib/uiol/client';
import { SKILLS, WORKFORCE_AGENTS, MEMORY_CATEGORIES, EXECUTION_MODE_META } from '@/lib/uiol/layer';

interface SkillRow { id: string; name: string; blurb: string; tools: string[]; capabilities: string[]; workforce: string[]; activeItems: number; }

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const wf = await api.workforce();
        if (!active) return;
        setSkills(wf.workforce.skills as SkillRow[]);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => { active = false; };
  }, []);

  const rows = skills.length ? skills : SKILLS.map((s) => ({ ...s, activeItems: 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Sparkles className="h-6 w-6 text-purple-400" /> Skills
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Every capability can be performed by AI, a human, or both — the shared language of the Work Network.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {/* Hybrid concept banner */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-[#12121a] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">Same skill, three executors</p>
        <p className="mt-1 text-sm text-gray-200">
          One skill like <strong>Video editing</strong> can be delivered as an <strong>AI Video Editor</strong>, a <strong>Human Video Editor</strong>, or an <strong>AI + Human Video Team</strong>. You choose the executor.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(['ai_only', 'ai_and_human', 'human_to_ai'] as (keyof typeof EXECUTION_MODE_META)[]).map((m) => (
            <div key={m} className="rounded-lg border border-white/10 bg-[#0d0d12] p-3">
              <p className="text-xs font-semibold text-white">{EXECUTION_MODE_META[m].label}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{EXECUTION_MODE_META[m].desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => {
          const agents = WORKFORCE_AGENTS.filter((a) => a.skills.includes(s.name));
          return (
            <div key={s.id} className="group rounded-xl border border-white/5 bg-[#12121a] p-4 transition hover:border-purple-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white group-hover:text-purple-300">{s.name}</h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">{s.activeItems} active</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{s.blurb}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.tools.map((t) => <span key={t} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-300">{t}</span>)}
              </div>
              <div className="mt-3 border-t border-white/5 pt-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-600">Who can do this</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {agents.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-300">
                      <Bot className="h-3 w-3" /> {agents.length} AI agent{agents.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                    <Users className="h-3 w-3" /> Humans
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
                    <Brain className="h-3 w-3" /> Hybrid teams
                  </span>
                </div>
              </div>
              <Link href="/dashboard/workforce" className="mt-2 inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300">
                Assign to work <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Memory categories teaser */}
      <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Brain className="h-4 w-4 text-purple-300" /> Skill memory (Work Memory)</h2>
        <p className="mt-1 text-xs text-gray-400">How skills, people, and preferences are remembered — stored in Work Memory for the whole network.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEMORY_CATEGORIES.map((c) => (
            <Link key={c.id} href="/dashboard/memory" className="rounded-lg border border-white/10 bg-[#0d0d12] p-3 transition hover:border-purple-500/30">
              <p className="text-xs font-semibold text-gray-100">{c.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}