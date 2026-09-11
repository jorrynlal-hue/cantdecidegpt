'use client';

import {
  CONTROL_MODE_LABELS,
  ControlMode as Mode,
  RiskClass,
} from '@/lib/uiol/types';

const stageColors: Record<string, string> = {
  capture: 'bg-slate-500/15 text-slate-300 border-slate-400/20',
  understand: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
  plan: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20',
  check: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
  approve: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
  execute: 'bg-purple-500/15 text-purple-300 border-purple-400/20',
  verify: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  record: 'bg-teal-500/15 text-teal-300 border-teal-400/20',
  learn: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/20',
  completed: 'bg-purple-500/15 text-purple-300 border-purple-400/20',
};

const modeColors: Record<Mode, string> = {
  human_only: 'bg-gray-500/15 text-gray-300 border-gray-400/20',
  ai_suggests: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
  ai_prepares: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20',
  human_approves: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
  supervised: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  bounded_autonomy: 'bg-rose-500/15 text-rose-300 border-rose-400/20',
};

const riskColors: Record<RiskClass, string> = {
  low: 'bg-slate-500/15 text-slate-300 border-slate-400/20',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/20',
  high: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
  critical: 'bg-red-500/15 text-red-300 border-red-400/20',
};

export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function StageBadge({ stage, status }: { stage: string; status?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${stageColors[stage] || stageColors.completed}`}>
      {stage}
      {status === 'blocked' && <span className="ml-1 text-red-300">●</span>}
      {status === 'in_progress' && <span className="ml-1 animate-pulse text-purple-300">●</span>}
    </span>
  );
}

export function ControlModeBadge({ mode }: { mode: Mode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${modeColors[mode]}`}>{CONTROL_MODE_LABELS[mode]}</span>;
}

export function RiskBadge({ risk }: { risk: RiskClass }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${riskColors[risk]}`}>{risk}</span>;
}

export function ActorLabel({ actor, short }: { actor: { type: string; identity: string; display: string; roles?: string[] }; short?: boolean }) {
  const label = short ? actor.display.split(' ')[0] : actor.display;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-300">
      <span className={`h-1.5 w-1.5 rounded-full ${actor.type === 'person' ? 'bg-emerald-400' : actor.type === 'automation' ? 'bg-purple-400' : 'bg-sky-400'}`} />
      {label}
      {!short && <span className="text-[10px] text-gray-500">({actor.type})</span>}
    </span>
  );
}