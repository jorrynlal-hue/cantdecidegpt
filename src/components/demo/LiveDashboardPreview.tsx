'use client';

import { useEffect, useRef, useState } from 'react';
import { InfiniteSystemMap } from '@/components/projects/InfiniteSystemMap';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { useTheme } from '@/lib/theme';

const TABS = [
  { id: 'map', label: 'System map', hash: '#system-map', hint: 'zoom out to every workflow, every tool, all three radial toolkits' },
  { id: 'projects', label: 'Projects space', hash: '#projects-space', hint: 'the project constellation, the hub, and the free space around it' },
  { id: 'toolkits', label: 'Radial toolkits', hash: '#radial-toolkits', hint: 'hover a tool, open it, read what it is and how it helps' },
] as const;

type Tab = (typeof TABS)[number]['id'];

function tabFromHash(): Tab {
  if (typeof window === 'undefined') return 'map';
  const h = window.location.hash;
  if (h === '#projects-space') return 'projects';
  if (h === '#radial-toolkits') return 'toolkits';
  return 'map';
}

const GUEST = [
  { name: 'Website Relaunch', pct: 68, tone: '#9B6CFF', status: 'active', next: 'Prepare the Delgado approval so the spec review can be unblocked today.' },
  { name: 'Family Summer Plan', pct: 32, tone: '#20DDB1', status: 'active', next: 'Find the free week, draft the route proposal and the packing list.' },
  { name: 'Q3 Pipeline Push', pct: 51, tone: '#FF5A91', status: 'on_hold', next: 'Draft the overdue follow-ups for the two deals paused on replies.' },
];

export default function LiveDashboardPreview() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>(() => tabFromHash());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = window.location.hash;
    if (h === '#system-map' || h === '#projects-space' || h === '#radial-toolkits') {
      const t = window.setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, []);

  return (
    <div id="live-dashboard" ref={rootRef} className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-[#07090f] shadow-2xl">
      <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.02] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CAN&apos;T DECIDE GPT · live preview</p>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> real, clickable
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-white/8 bg-white/[0.02] px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              tab === t.id
                ? 'bg-[var(--c-accent)] text-white'
                : 'border border-white/8 text-gray-500 hover:border-[var(--c-accent-border)] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
        <p className="ml-auto hidden self-center text-[9px] text-gray-600 md:block">{TABS.find((t) => t.id === tab)?.hint}</p>
      </div>

      <div className="relative">
        {tab === 'map' && <InfiniteSystemMap />}
        {tab === 'projects' && <ProjectsMock accent={theme.accent} />}
        {tab === 'toolkits' && (
          <div className="max-h-[680px] overflow-auto bg-[#04050a] p-4">
            <OrbitalKits which="all" coreLabel="CDG" subtitle="System Intelligence Active" />
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectsMock({ accent }: { accent: string }) {
  return (
    <div className="relative h-[560px] overflow-hidden bg-[#04050a]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" width={1200} height={560}>
        <circle cx={560} cy={130} r={64} fill="none" stroke={`${accent}66`} strokeWidth={1} strokeDasharray="4 5" className="jbos-breathe" />
        <circle cx={560} cy={130} r={90} fill="none" stroke={`${accent}22`} strokeWidth={1} />
        {GUEST.map((p, i) => {
          const x = 180 + i * 400;
          return <path key={p.name} d={`M 560 130 C ${(560 + x) / 2} 130, ${(560 + x) / 2} 340, ${x + 100} 340`} fill="none" stroke="rgba(160,150,220,0.22)" strokeWidth={1} strokeDasharray="3 6" />;
        })}
      </svg>

      <div className="absolute left-10 top-6 z-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-gray-600">
        <span style={{ color: '#19C9D6' }}>● system live</span>
        <span style={{ color: '#9B6CFF' }}>⚡ 3 running</span>
        <span className="text-amber-400">⚠ 2 need attention</span>
      </div>

      <div className="absolute left-1/2 top-[70px] z-10 flex h-[120px] w-[120px] -translate-x-1/2 flex-col items-center justify-center rounded-full border border-white/10 text-center" style={{ background: 'radial-gradient(120% 120% at 30% 25%, rgba(139,92,246,0.16), rgba(5,6,11,0.9) 80%)', left: 560 }}>
        <span className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: accent }}>projects</span>
        <span className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-gray-500">new project</span>
      </div>

      {GUEST.map((p, i) => {
        const x = 180 + i * 400 - 160;
        const y = 330;
        return (
          <div
            key={p.name}
            className="absolute z-20 w-[300px] rounded-2xl border border-white/8 bg-[#080a11]/92 p-4"
            style={{ left: x, top: y, boxShadow: '0 6px 26px rgba(0,0,0,0.35)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold" style={{ borderColor: `${p.tone}66`, color: p.tone, background: `${p.tone}14` }}>
                {p.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                <p className="text-[10px] text-gray-600">{p.status.replace('_', ' ')}</p>
              </div>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.status === 'active' ? '#00D9B2' : '#fbbf24' }} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-600">
              <span className="uppercase tracking-[0.14em]">{p.status.replace('_', ' ')}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.tone }} />
              </div>
              <span className="tabular-nums">{p.pct}%</span>
            </div>
            <p className="mt-2.5 text-[10px] leading-relaxed text-gray-500">{p.next}</p>
          </div>
        );
      })}

      <div className="absolute bottom-5 left-10 z-10 text-[10px] text-gray-600">
        Every project becomes a floating work object connected into this map.
      </div>
    </div>
  );
}