'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Brain, Activity, Sparkles, UserPlus, Cpu, ArrowRight } from 'lucide-react';
import { api, WorkForceAgent } from '@/lib/uiol/client';
import { WORKFORCE_AGENTS, EXECUTION_MODE_META } from '@/lib/uiol/layer';
import { useCollection } from '@/components/platform/data';
import ExecutionControl from '@/components/uiol/executionControl';

interface AgentRow extends WorkForceAgent { active: number; status: 'busy' | 'ready'; }
interface SkillRow { id: string; name: string; blurb: string; tools: string[]; capabilities: string[]; workforce: string[]; activeItems: number; }
interface HumanRow { id: string; name: string; role: string; status: string; skills: string[]; aiAssist: string[]; }

const ROLE_ICON: Record<string, string> = {
  Researcher: '🔬',
  Analyst: '📊',
  Writer: '✍️',
  Developer: '💻',
  Operator: '⚙️',
  Planner: '🗺️',
  Reviewer: '🔎',
  Strategist: '🧭',
};

export default function WorkforcePage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<keyof typeof EXECUTION_MODE_META>('auto');
  const [buildName, setBuildName] = useState('');
  const [buildRole, setBuildRole] = useState('');
  const [buildSkill, setBuildSkill] = useState('');
  const [built, setBuilt] = useState<string | null>(null);

  const humans = useCollection<HumanRow>('humans', {});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const wf = await api.workforce();
        if (!active) return;
        setAgents(wf.workforce.agents as AgentRow[]);
        setSkills(wf.workforce.skills as SkillRow[]);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const buildAgent = async () => {
    if (!buildName.trim() || !buildSkill.trim()) return;
    const statement = `Custom agent "${buildName.trim()}"${buildRole.trim() ? ` (${buildRole.trim()})` : ''} — specialized in ${buildSkill.trim()}.`;
    try {
      const res = await api.teach({
        statement,
        scope: 'always',
        category: 'patterns',
      });
      setBuilt(res.note);
      setBuildName(''); setBuildRole(''); setBuildSkill('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Bot className="h-6 w-6 text-purple-400" /> AI Workforce
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Specialized digital workers with identities, skills, permissions and supervision. Each is a member of a team — not a generic API object.
          </p>
        </div>
        <Link href="/dashboard/operations" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-purple-400">
          <ArrowRight className="h-4 w-4" /> Deploy on work
        </Link>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
          <p className="text-xs text-gray-500">Workforce agents</p>
          <p className="mt-1 text-2xl font-bold text-purple-300">{WORKFORCE_AGENTS.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
          <p className="text-xs text-gray-500">Currently working</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{agents.filter((a) => a.active > 0).length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
          <p className="text-xs text-gray-500">Active assignments</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{agents.reduce((n, a) => n + a.active, 0)}</p>
        </div>
        <Link href="/dashboard/humans" className="rounded-xl border border-white/5 bg-[#12121a] p-4 transition hover:border-purple-500/30">
          <p className="text-xs text-gray-500">Human collaborators</p>
          <p className="mt-1 text-2xl font-bold text-sky-300">{humans.rows.length}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">View workspace →</p>
        </Link>
      </div>

      {/* Build an agent */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-[#12121a] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><UserPlus className="h-4 w-4 text-purple-300" /> Build an agent</h2>
        <p className="mt-1 text-xs text-gray-400">Describe a digital employee and the system creates its identity, skills, and memory.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="Name — e.g., Competitor Intel" className="rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50" />
          <input value={buildRole} onChange={(e) => setBuildRole(e.target.value)} placeholder="Role — e.g., Research Analyst" className="rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50" />
          <input value={buildSkill} onChange={(e) => setBuildSkill(e.target.value)} placeholder="Skill — e.g., competitor monitoring" className="rounded-lg border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50" />
        </div>
        <button
          onClick={buildAgent}
          disabled={!buildName.trim() || !buildSkill.trim()}
          className="mt-3 rounded-lg border border-purple-500/40 bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-40"
        >
          <Cpu className="mr-1 inline h-3.5 w-3.5" /> Create agent
        </button>
        {built && <p className="mt-2 text-xs text-emerald-300">{built}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500"><Activity className="mr-2 h-5 w-5 animate-pulse" /> Loading workforce…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(agents.length ? agents : WORKFORCE_AGENTS.map((a) => ({ ...a, active: 0, status: 'ready' as const }))).map((a) => (
            <div key={a.id} className="rounded-xl border border-white/5 bg-[#12121a] p-4 transition hover:border-purple-500/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 text-lg">
                    {ROLE_ICON[a.role] || '🤖'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.title} Agent</p>
                    <p className="text-[11px] text-gray-500">Role: <span className="text-gray-400">{a.role}</span></p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${a.status === 'busy' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                  {a.status === 'busy' ? '🟢 Working' : 'Ready'}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">{a.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.skills.map((s) => (
                  <Link key={s} href="/dashboard/skills" className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300 hover:border-purple-500/30">{s}</Link>
                ))}
                <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-300">temp: {a.temp}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                <span>Tasks: <span className="font-semibold text-gray-300">{a.active}</span></span>
                <span>Provider: <span className="font-mono text-gray-400">{a.providerKind}</span></span>
                <span>Supervisor: <span className="text-gray-400">Ava Operations</span></span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-500">{a.id}</span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">Permissions: assigned per work item</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Execution model pool */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-purple-300" /> Execution model for new work</h2>
          <p className="mt-1 text-xs text-gray-400">Default who-runs-this for work created from the Command Center. Auto (★) recommended.</p>
          <div className="mt-3">
            <ExecutionControl value={mode} onChange={setMode} showRecommended />
          </div>
          <p className="mt-3 text-[11px] text-gray-500">Your choice: <span className="text-purple-300">{EXECUTION_MODE_META[mode].short}</span> → mapped to the work control dial on capture.</p>
        </div>

        {/* Skills catalog */}
        <div className="rounded-xl border border-white/5 bg-[#12121a] p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Brain className="h-4 w-4 text-purple-300" /> Skills catalog</h2>
          <p className="mt-1 text-xs text-gray-400">Capabilities that can be performed by AI, a human, or both — the service/network skill layer.</p>
          {skills.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-600">Loading catalog…</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {skills.map((s) => (
                <Link key={s.id} href="/dashboard/skills" className="group rounded-lg border border-white/5 bg-[#0d0d12] p-3 transition hover:border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-100 group-hover:text-purple-300">{s.name}</p>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">{s.activeItems} active works</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.blurb}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tools.map((t) => <span key={t} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-300">{t}</span>)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}