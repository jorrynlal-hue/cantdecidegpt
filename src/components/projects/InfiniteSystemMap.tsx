'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import {
  Activity, BarChart3, Bell, Box, Brain, BrainCircuit, Briefcase, Calculator, CalendarCheck,
  Clapperboard, ClipboardList, Compass, Database, Eye, FileCheck, FileText, FlaskConical, Gauge,
  Ghost, Globe2, Handshake, HeartCrack, Home, Inbox, KeyRound, LifeBuoy, Link as LinkIcon,
  Maximize2, Megaphone, MessageSquareOff, Microscope, Monitor, Moon, PiggyBank, Radar, Repeat,
  Scale, Search, Settings, Shield, ShieldCheck, ShoppingBag, Sparkles, Truck, UserPlus, Users,
  Users2, Wallet, Waypoints, Workflow, Wrench, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';
import { ALL_TOOLS, RESTORED_TOOLS, ZONE_LABELS, type HubTool, type RestoredTool } from '@/lib/hub';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';
import { useSession } from '@/components/platform/SessionProvider';
import { kitTierForPlan } from '@/lib/plans';

const ICONS: Record<string, LucideIcon> = {
  Waypoints, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit, Activity, Workflow,
  Globe2, Database, Sparkles, Monitor, Truck, Wallet, Link: LinkIcon, Users2, Megaphone,
  BarChart3, FileText, Handshake, UserPlus, Calculator, Search, ClipboardList, Clapperboard,
  HeartCrack, FlaskConical, Repeat, Scale, MessageSquareOff, Moon, Radar, Brain, Briefcase,
  Ghost, LifeBuoy, Microscope, FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck,
  Wrench, Eye, Bell, Shield, Inbox, Box,
};

const toolIcon = (t: HubTool | RestoredTool) => {
  const I = ICONS[t.icon];
  return I ?? Box;
};

const WORLD_W = 3600;
const WORLD_H = 3320;
const MIN_K = 0.18;
const MAX_K = 3;

interface LaneDef {
  id: string;
  label: string;
  step: string;
  color: string;
  y: number;
  tools: string[];
}

const LANES: LaneDef[] = [
  { id: 'intelligence', label: 'Intelligence & Decisions', step: 'STEP 01 · READ', color: '#22d3ee', y: 200, tools: ['executive', 'insights', 'analytics', 'reports', 'attribution'] },
  { id: 'govern', label: 'Governance & Trust', step: 'STEP 02 · SAFEGUARD', color: '#a78bfa', y: 470, tools: ['admin', 'security', 'settings', 'team', 'ai'] },
  { id: 'operate', label: 'Operations & Execution', step: 'STEP 03 · EXECUTE', color: '#34d399', y: 740, tools: ['operations', 'automation', 'integrations', 'memory', 'performer'] },
  { id: 'revenue', label: 'Revenue & Delivery', step: 'STEP 04 · DELIVER', color: '#fbbf24', y: 1010, tools: ['finance', 'website', 'marketing', 'hr', 'connect'] },
];

const LANE_W = 1180;
const LANE_X = 170;
const CHIP_W = 176;
const CHIP_H = 96;
const laneChipX = (i: number, n: number) => {
  const d = (LANE_W - 64) / Math.max(n - 1, 1);
  return LANE_X + 32 + i * d;
};

const ZONE_TOOLS = [
  { id: 'biz', label: ZONE_LABELS.business, zone: 'business', x: 170, w: 640, y: 1330, tools: RESTORED_TOOLS.filter((t) => t.zone === 'business') },
  { id: 'life', label: ZONE_LABELS.life, zone: 'life', x: 850, w: 500, y: 1330, tools: RESTORED_TOOLS.filter((t) => t.zone === 'life') },
] as const;

const zoneChipPos = (zoneIdx: number, i: number) => {
  const zone = ZONE_TOOLS[zoneIdx];
  const cols = zoneIdx === 0 ? 3 : 2;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: zone.x + 28 + col * 204, y: zone.y + 64 + row * 116 };
};

const GRID_X = 1740;
const GRID_COLS = 5;
const GRID_CELL_W = 300;
const GRID_CELL_H = 118;
const gridPos = (i: number) => ({
  x: GRID_X + (i % GRID_COLS) * GRID_CELL_W,
  y: 200 + Math.floor(i / GRID_COLS) * GRID_CELL_H,
});

const ORBITAL_W = 1140;
const ORBITAL_GAP = 30;
const ORBITAL_Y = 1960;
const orbitalX = (i: number) => 150 + i * (ORBITAL_W + ORBITAL_GAP);

export function InfiniteSystemMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string; blurb: string; premium?: boolean } | null>(null);
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  const { me } = useSession();
  const tier = kitTierForPlan(me?.plan);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const zoomAt = (cx: number, cy: number, f: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = viewRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k * f));
    const mx = cx - rect.left;
    const my = cy - rect.top;
    setView({
      x: mx - (mx - v.x) * (k / v.k),
      y: my - (my - v.y) * (k / v.k),
      k,
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a,button,input')) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setView((v) => ({
      x: d.vx + (e.clientX - d.sx),
      y: d.vy + (e.clientY - d.sy),
      k: v.k,
    }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const reset = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setView({ x: rect.width / 2 - WORLD_W / 2, y: rect.height / 2 - WORLD_H / 2, k: 1 });
  };

  const fitWide = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const k = Math.min(MIN_K + 0.22, 0.5);
    const w = WORLD_W * k;
    setView({ x: (rect.width - w) / 2, y: 20, k });
  };

  const renderChip = (
    t: HubTool | RestoredTool,
    cx: number,
    cy: number,
    pin: { x: number; y: number },
  ) => {
    const Icon = toolIcon(t);
    const premium = 'premium' in t && t.premium;
    const zone = 'zone' in t ? t.zone : null;
    return (
      <div
        key={t.id}
        className="absolute z-10"
        style={{ left: cx - CHIP_W / 2, top: cy - CHIP_H / 2, width: CHIP_W, height: CHIP_H }}
        onMouseEnter={() => setHover({ x: pin.x, y: pin.y, name: t.name, blurb: t.blurb, premium })}
        onMouseLeave={() => setHover((h) => (h?.name === t.name ? null : h))}
      >
        <Link href={t.href} className="group relative block h-full" aria-label={`Open ${t.name}`}>
          <span
            className={`absolute inset-0 rounded-xl border transition-all ${
              premium ? 'border-amber-300/25 bg-[#0d0d14]' : 'border-white/10 bg-[#0b0b12]'
            } group-hover:border-white/30`}
            style={{
              boxShadow: premium ? '0 0 12px rgba(251,191,36,0.18), 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.45)',
            }}
          >
            <span className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
              <Icon className={`h-5 w-5 ${premium ? 'text-amber-200' : 'text-sky-300/90'}`} />
              <span className="block w-full truncate text-[11px] font-semibold text-white">{t.name}</span>
              {premium && <span className="text-[7px] font-bold uppercase tracking-widest text-amber-400">pro</span>}
              {zone && <span className="text-[7px] uppercase tracking-wider text-white/25">{zone === 'business' ? 'business' : 'life'}</span>}
            </span>
          </span>
        </Link>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#04050a]" style={{ height: 'calc(100vh - 190px)', minHeight: 520 }}>
      {/* controls */}
      <div className="absolute right-4 top-4 z-40 flex items-center gap-1 rounded-xl border border-white/10 bg-[#080a11]/90 p-1 shadow-2xl">
        <button onClick={() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.25); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={fitWide} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white" title="Fit everything">
          <Maximize2 className="h-4 w-4" />
        </button>
        <button onClick={reset} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white" title="Back to the CORE">
          <Radar className="h-4 w-4" />
        </button>
        <span className="px-2 text-[10px] tabular-nums text-gray-600">{Math.round(view.k * 100)}%</span>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/8 bg-black/70 px-3.5 py-1.5 text-[10px] text-gray-500 backdrop-blur">
        scroll to zoom in / out · drag the empty map to move · click any tool to open it
      </div>

      {/* world */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: WORLD_W, height: WORLD_H, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
        >
          <div className="jbos-grid-bg absolute inset-0 opacity-60" />

          {/* ---------- CORE FLOW ---------- */}
          <div className="absolute left-[150px] top-[40px] w-[480px]">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-cyan-300">workflow</p>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">The one operating flow</h2>
            <p className="text-[10px] text-gray-500">CORE → Read → Safeguard → Execute → Deliver → Business &amp; Life</p>
          </div>

          <svg className="pointer-events-none absolute inset-0" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
            <defs>
              <marker id="imArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
              </marker>
            </defs>
            <g opacity="0.55">
              <path d="M 760 140 L 760 190" stroke="#22d3ee" strokeWidth="2" markerEnd="url(#imArrow)" />
              {LANES.slice(0, -1).map((lane) => (
                <path key={lane.id} d={`M 760 ${lane.y + 120} L 760 ${LANES[LANES.indexOf(lane) + 1].y}`} stroke={lane.color} strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#imArrow)" />
              ))}
              <path d={`M 760 ${LANES[3].y + 120} L 760 ${ZONE_TOOLS[0].y + 30}`} stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#imArrow)" />
              {LANES.map((lane) => (
                <g key={lane.id}>
                  <path d={`M ${LANE_X + 20} ${lane.y + 54} L ${LANE_X + LANE_W - 20} ${lane.y + 54}`} stroke={lane.color} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.4" />
                  {lane.tools.map((id, i) => {
                    const cx = laneChipX(i, lane.tools.length);
                    return <path key={id} d={`M ${cx} ${lane.y + 54} L ${cx} ${lane.y + 70}`} stroke={lane.color} strokeWidth="1" opacity="0.4" />;
                  })}
                </g>
              ))}
              {ZONE_TOOLS.map((zone, zi) => {
                const busY = zone.y + 56;
                return (
                  <g key={zone.id}>
                    <path d={`M ${zone.x + 24} ${busY} L ${zone.x + zone.w - 24} ${busY}`} stroke={zone.zone === 'business' ? '#7c3aed' : '#14b8a6'} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.4" />
                    {zone.tools.map((t, i) => {
                      const p = zoneChipPos(zi, i);
                      return <path key={t.id} d={`M ${p.x + CHIP_W / 2} ${busY} L ${p.x + CHIP_W / 2} ${p.y}`} stroke={zone.zone === 'business' ? '#7c3aed' : '#14b8a6'} strokeWidth="1" opacity="0.4" />;
                    })}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* CORE hub */}
          <Link
            href="/dashboard"
            className="absolute z-10 flex flex-col items-center justify-center rounded-2xl border border-cyan-300/40 bg-gradient-to-b from-cyan-500/20 to-transparent text-center"
            style={{ left: 650, top: 50, width: 220, height: 90, boxShadow: '0 0 30px rgba(34,211,238,0.25)' }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-200">{brand}</span>
            <span className="text-xl font-black tracking-tight text-white">CORE</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
            </span>
          </Link>

          {/* workflow lanes */}
          {LANES.map((lane) => (
            <div key={lane.id} className="absolute z-0 rounded-2xl border border-white/8" style={{ left: LANE_X, top: lane.y, width: LANE_W, height: 220, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))' }}>
              <p className="absolute left-4 top-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: lane.color }}>
                <span className="flex h-4 items-center gap-1 rounded border px-1.5" style={{ borderColor: lane.color }}>{lane.step}</span>
                <span className="text-white/90">{lane.label}</span>
              </p>
            </div>
          ))}
          {LANES.map((lane) =>
            lane.tools.map((id, i) => {
              const t = ALL_TOOLS.find((x) => x.id === id);
              if (!t) return null;
              return renderChip(t, laneChipX(i, lane.tools.length), lane.y + 130, { x: laneChipX(i, lane.tools.length), y: lane.y + 100 });
            }),
          )}

          {/* restored zones */}
          {ZONE_TOOLS.map((zone, zi) => (
            <div key={zone.id}>
              <div className="absolute z-0 rounded-2xl border border-white/8" style={{ left: zone.x, top: zone.y, width: zone.w, height: 560, background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.004))' }}>
                <p className="absolute left-4 top-3 text-[9px] font-bold uppercase tracking-[0.24em] text-gray-400">{zone.label} · restored</p>
              </div>
              {zone.tools.map((t, i) => {
                const p = zoneChipPos(zi, i);
                return renderChip(t, p.x + CHIP_W / 2, p.y + CHIP_H / 2, { x: p.x + CHIP_W / 2, y: p.y });
              })}
            </div>
          ))}

          {/* ---------- EVERY TOOL GRID ---------- */}
          <div className="absolute z-0 rounded-2xl border border-white/8" style={{ left: GRID_X - 20, top: 120, width: GRID_COLS * GRID_CELL_W + 30, height: 1560, background: 'rgba(255,255,255,0.02)' }}>
            <p className="absolute left-6 top-5 text-[9px] font-black uppercase tracking-[0.26em] text-[#e879f9]">every tool in the system</p>
            <p className="absolute left-6 top-9 text-[10px] text-gray-500">{ALL_TOOLS.length} tools — core, premium, business &amp; life. Click any of them to open and run it.</p>
          </div>
          {ALL_TOOLS.map((t, i) => {
            const Icon = toolIcon(t);
            const p = gridPos(i);
            const premium = 'premium' in t && t.premium;
            return (
              <div key={t.id} className="absolute z-10" style={{ left: p.x, top: p.y, width: GRID_CELL_W - 18, height: GRID_CELL_H - 14 }} onMouseEnter={() => setHover({ x: p.x + GRID_CELL_W / 2, y: p.y, name: t.name, blurb: t.blurb, premium })} onMouseLeave={() => setHover((h) => (h?.name === t.name ? null : h))}>
                <Link href={t.href} className="group flex h-full items-center gap-3 rounded-xl border border-white/8 bg-[#0b0b12] px-3 transition-all hover:border-sky-400/40 hover:bg-white/[0.03]">
                  <Icon className={`h-4 w-4 shrink-0 ${premium ? 'text-amber-300' : 'text-sky-300/90'}`} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-[12px] font-semibold text-gray-100">
                      {t.name}
                      {premium && <span className="rounded bg-amber-400/15 px-1 text-[7px] font-bold uppercase tracking-wider text-amber-300">pro</span>}
                    </span>
                    <span className="block truncate text-[9px] text-gray-500">{t.blurb}</span>
                  </span>
                </Link>
              </div>
            );
          })}

          {/* ---------- THE THREE RADIAL TOOLKITS ---------- */}
          {(
            [
              { which: 'core' as const, label: '01 · CORE TOOLKIT — included', color: '#2276D9' },
              { which: 'premium' as const, label: '02 · $1,000 PREMIUMS', color: '#FF6B9D' },
              { which: 'pro' as const, label: '03 · $1,600 PRO PREMIUMS', color: '#E879F9' },
            ]
          ).map((kit, i) => (
            <div key={kit.which} className="absolute z-0 rounded-2xl border border-white/8 bg-[#0a0c14]/60" style={{ left: orbitalX(i), top: ORBITAL_Y, width: ORBITAL_W, height: 1280, padding: 18 }}>
              <p className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.26em]" style={{ color: kit.color }}>
                <Radar className="h-3.5 w-3.5" /> {kit.label}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Workflow className="h-3 w-3" /> hover a tool — it opens with what it is, how to use it, and how it helps.
              </div>
              <div className="mt-2">
                <OrbitalKits which={kit.which} coreLabel={brand} subtitle="System Intelligence Active" tier={tier} />
              </div>
            </div>
          ))}

          {/* hover card */}
          {hover && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0b13]/95 px-3 py-2 shadow-2xl backdrop-blur"
              style={{ left: hover.x, top: hover.y - 4, maxWidth: 320 }}
            >
              <p className={`text-[11px] font-bold ${hover.premium ? 'text-amber-200' : 'text-white'}`}>{hover.name}</p>
              {hover.premium && <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-400">PRO EXCLUSIVE</p>}
              <p className="mt-0.5 text-[10px] leading-snug text-gray-400">{hover.blurb}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SystemMapSection({ title = 'System map' }: { title?: string }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#080a11]/50 p-4 lg:p-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">infinite map</p>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">{title}</h2>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-500">
          {ALL_TOOLS.length} tools · every workflow · all 3 radial toolkits — scroll in and out to see it all
        </span>
      </div>
      <InfiniteSystemMap />
    </section>
  );
}