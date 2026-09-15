'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowRight, BarChart3, Bell, Brain, BrainCircuit, Briefcase, Calculator, CalendarCheck,
  Clapperboard, ClipboardList, Compass, Cpu, Crown, Database, Eye, FileCheck, FileText, FlaskConical,
  FolderKanban, Gauge, Ghost, Globe2, Handshake, HeartCrack, Home, Inbox, KeyRound, LifeBuoy,
  Link as LinkIcon, Lock, Maximize2, Megaphone, MessageSquareOff, Microscope, Monitor, Moon, PiggyBank,
  Radar, Repeat, Scale, Search, Settings, Shield, ShieldCheck, ShoppingBag, Sparkles, Truck,
  UserPlus, Users, Users2, Wallet, Waypoints, Workflow, Wrench, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';
import { ALL_TOOLS, type HubTool, type RestoredTool } from '@/lib/hub';
import { getBrand } from '@/lib/theme';
import { useSession } from '@/components/platform/SessionProvider';
import { kitTierForPlan } from '@/lib/plans';

const ICONS: Record<string, LucideIcon> = {
  Waypoints, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit, Activity, Workflow,
  Globe2, Database, Sparkles, Monitor, Truck, Wallet, Link: LinkIcon, Users2, Megaphone,
  BarChart3, FileText, Handshake, UserPlus, Calculator, Search, ClipboardList, Clapperboard,
  HeartCrack, FlaskConical, Repeat, Scale, MessageSquareOff, Moon, Radar, Brain, Briefcase,
  Ghost, LifeBuoy, Microscope, FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck,
  Wrench, Eye, Bell, Shield, Inbox,
};

const toolIcon = (t: HubTool | RestoredTool) => ICONS[t.icon] ?? BrainCircuit;

const WORLD_W = 5200;
const WORLD_H = 3400;
const MIN_K = 0.14;
const MAX_K = 2.6;

const CHIP_W = 180;
const CHIP_H = 96;

/* ---------------- the operating line ---------------- */

const X0 = 1700;
const PITCH = 215;
const Y0 = 950;
const ROWH = 215;
const NCOLS = 8;

interface PlacedTool {
  tool: HubTool | RestoredTool;
  x: number;
  y: number;
  tier: 'core' | 'premium' | 'pro';
}

const rowPos = (r: number, count: number): number[] => {
  const cols = r % 2 === 0 ? Array.from({ length: count }, (_, i) => i) : Array.from({ length: count }, (_, i) => NCOLS - 1 - i);
  return cols.map((c) => X0 + c * PITCH);
};

const CORE_ORDER: string[] = ['admin', 'security', 'settings', 'insights', 'integrations', 'website', 'operations', 'finance', 'hr', 'marketing', 'analytics', 'reports'];
const PREMIUM_ORDER: string[] = ['executive', 'team', 'ai', 'automation', 'memory', 'performer', 'attribution', 'connect', 'lifeadmin', 'inbox', 'moneypeace', 'errands', 'household', 'decisions', 'weeklyrecap', 'fixer', 'secondeyes', 'nudge', 'buffer'];
const PRO_ORDER: string[] = ['closer', 'recruiter', 'bookkeeper', 'rootcause', 'weeklyops', 'proofreel', 'decaydetect', 'pricingexp', 'autorenego', 'negotiator', 'silentresponse', 'shadowfounder', 'competitorshadow', 'secondbrain', 'consultant', 'ghostmode', 'rescuebutton', 'researcher'];

const byId = (id: string) => ALL_TOOLS.find((t) => t.id === id);
const tierOf = (id: string): 'core' | 'premium' | 'pro' =>
  CORE_ORDER.includes(id) ? 'core' : PRO_ORDER.includes(id) ? 'pro' : 'premium';

const buildLine = (): PlacedTool[] => {
  const list: PlacedTool[] = [];
  const tiers: { ids: string[]; rows: number[]; }[] = [
    { ids: CORE_ORDER, rows: [0, 1] },
    { ids: PREMIUM_ORDER, rows: [2, 3, 4] },
    { ids: PRO_ORDER, rows: [5, 6, 7] },
  ];
  for (const tier of tiers) {
    let start = 0;
    for (let r = 0; r < tier.rows.length; r += 1) {
      const total = tier.ids.length;
      const inRow = Math.min(r === tier.rows.length - 1 ? total - start : Math.min(NCOLS, total - start), NCOLS);
      const y = Y0 + tier.rows[r] * ROWH;
      const xs = rowPos(tier.rows[r], inRow);
      for (let i = 0; i < inRow; i += 1) {
        const id = tier.ids[start + i];
        const tool = byId(id);
        if (tool) list.push({ tool, x: xs[i], y, tier: tierOf(id) });
      }
      start += inRow;
    }
  }
  return list;
};

const LINE = buildLine();

const lineEdges = (): Array<[number, number]> => LINE.slice(0, -1).map((_, i) => [i, i + 1]);

/* tier up / unlock connectors between the three steps */
const TIER_SPRINGS = [
  { from: LINE[11], to: LINE[12], label: 'unlock', color: '#FF6B9D', node: { x: 2130, y: 1272 } },
  { from: LINE[30], to: LINE[31], label: 'unlock', color: '#E879F9', node: { x: 2667, y: 1917 } },
];

/* the operating spine — CORE sun + the four phase planets */
const SUN = { x: 440, y: 560, w: 230, h: 116 };
const SPINE_Y = 560;
const PLANETS = [
  { id: 'intelligence', label: 'Intelligence', step: 'READ', color: '#22d3ee', cx: 1250, tier: 'core' as const },
  { id: 'govern', label: 'Governance', step: 'SAFEGUARD', color: '#a78bfa', cx: 1900, tier: 'core' as const },
  { id: 'operate', label: 'Operations', step: 'EXECUTE', color: '#34d399', cx: 2680, tier: 'premium' as const },
  { id: 'revenue', label: 'Revenue', step: 'DELIVER', color: '#fbbf24', cx: 3600, tier: 'pro' as const },
];

const BOXES = [
  { key: 'core', y: 890, h: 366, color: '#2276D9', label: 'STEP 01 · CORE TOOLKIT — included', sub: 'the operating system · 12 core modules' },
  { key: 'premium', y: 1320, h: 581, color: '#FF6B9D', label: 'STEP 02 · $1,000 PREMIUMS', sub: 'intelligence + a life that sorts itself · 19 tools' },
  { key: 'pro', y: 1965, h: 581, color: '#E879F9', label: 'STEP 03 · $1,600 PRO PREMIUMS', sub: 'the operator who wants it all · 18 tools' },
];
const BOX_X = 1555;
const BOX_W = 1795;

const SECTIONS: { id: string; label: string; sub: string; icon: LucideIcon; color: string; x: number; y: number }[] = [
  { id: 'missioncontrol', label: 'Mission Control', sub: 'live execution · verify · undo', icon: Radar, color: '#22d3ee', x: 4580, y: 700 },
  { id: 'projects', label: 'Projects', sub: 'constellation of work', icon: FolderKanban, color: '#8b5cf6', x: 4580, y: 930 },
  { id: 'workforce', label: 'Workforce', sub: 'ai employees & skills', icon: Users, color: '#34d399', x: 4580, y: 1160 },
  { id: 'automation', label: 'Automation', sub: 'workflow studio', icon: Workflow, color: '#34d399', x: 4580, y: 1390 },
  { id: 'marketing', label: 'Marketing', sub: 'campaigns & attribution', icon: Megaphone, color: '#18d9a0', x: 4580, y: 1620 },
  { id: 'finance', label: 'Finance', sub: 'revenue · cash · risk', icon: Wallet, color: '#fbbf24', x: 4580, y: 1850 },
  { id: 'skills', label: 'Skills', sub: 'capabilities library', icon: Sparkles, color: '#a78bfa', x: 4580, y: 2080 },
];

/* which plan tier each tool needs — core free, premium $1000, pro $1600 */
function unlockedFor(tier?: string): Set<string> {
  if (tier === '1600') return new Set(ALL_TOOLS.map((t) => t.id));
  const core = new Set(CORE_ORDER);
  if (tier === '1000') return new Set([...core, ...PREMIUM_ORDER]);
  return core;
}

/* ---------------- the space ---------------- */

export function UniverseSpace({ initialFit = false, unlockAll = false }: { initialFit?: boolean; unlockAll?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string; blurb: string; tier: string; locked: boolean } | null>(null);
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  const { me } = useSession();
  const tier = kitTierForPlan(me?.plan);
  const unlocked = unlockAll ? new Set(ALL_TOOLS.map((t) => t.id)) : unlockedFor(tier);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const fitAll = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const k = Math.min(0.5, Math.max(MIN_K + 0.12, Math.min(rect.width / (WORLD_W * 1.05), rect.height / (WORLD_H * 1.05))));
    const w = WORLD_W * k;
    const h = WORLD_H * k;
    setView({ x: Math.max(0, (rect.width - w) / 2), y: Math.max(0, (rect.height - h) / 2), k });
  };

  useEffect(() => {
    if (!initialFit) return;
    const t = window.setTimeout(fitAll, 40);
    const ro = new ResizeObserver(() => fitAll());
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => { window.clearTimeout(t); ro.disconnect(); };
  }, [initialFit]);

  const zoomAt = (cx: number, cy: number, f: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = viewRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k * f));
    const mx = cx - rect.left;
    const my = cy - rect.top;
    setView({ x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k), k });
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
    setView((v) => ({ x: d.vx + (e.clientX - d.sx), y: d.vy + (e.clientY - d.sy), k: v.k }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const reset = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setView({ x: rect.width / 2 - SUN.x, y: rect.height / 2 - SUN.y, k: 1 });
  };

  const renderChip = (p: PlacedTool) => {
    const Icon = toolIcon(p.tool);
    const gold = 'premium' in p.tool && p.tool.premium;
    const locked = !unlocked.has(p.tool.id);
    const color = p.tier === 'core' ? '#2276D9' : p.tier === 'premium' ? '#FF6B9D' : '#E879F9';
    const inner = (
      <>
        <span
          className="absolute inset-0 rounded-xl border transition-all"
          style={{
            borderColor: locked ? 'rgba(255,255,255,0.12)' : gold ? 'rgba(251,191,36,0.35)' : `${color}44`,
            background: locked ? 'rgba(13,13,18,0.6)' : 'rgba(11,11,18,0.88)',
            boxShadow: locked ? '0 4px 12px rgba(0,0,0,0.4)' : `0 0 14px ${color}22, 0 6px 16px rgba(0,0,0,0.45)`,
          }}
        />
        <span className="absolute inset-x-0 top-0 flex items-center justify-between px-2.5 pt-2">
          <Icon className={`h-4 w-4 ${gold && !locked ? 'text-amber-200' : locked ? 'text-white/25' : 'text-white/80'}`} />
          <span
            className="rounded border px-1 py-px text-[6.5px] font-bold uppercase tracking-[0.14em]"
            style={{ borderColor: locked ? 'rgba(255,255,255,0.15)' : `${color}66`, color: locked ? '#5c6270' : color }}
          >
            {p.tier === 'core' ? '$0' : p.tier === 'premium' ? '$1k' : '$1.6k'}
          </span>
        </span>
        <span className="absolute inset-x-2 top-[38%] truncate text-center text-[10px] font-bold text-white" style={{ opacity: locked ? 0.5 : 1 }}>
          {p.tool.name}
        </span>
        {locked && (
          <span className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1 text-[7px] font-bold uppercase tracking-widest text-white/30">
            <Lock className="h-2 w-2" /> upgrade
          </span>
        )}
      </>
    );
    const layer = (
      <div
        key={p.tool.id}
        className="absolute z-10"
        style={{ left: p.x - CHIP_W / 2, top: p.y - CHIP_H / 2, width: CHIP_W, height: CHIP_H }}
        onMouseEnter={() => setHover({ x: p.x, y: p.y, name: p.tool.name, blurb: p.tool.blurb, tier: p.tier === 'core' ? 'CORE · included' : p.tier === 'premium' ? '$1,000 PREMIUMS' : '$1,600 PRO PREMIUMS', locked })}
        onMouseLeave={() => setHover((h) => (h && h.name === p.tool.name ? null : h))}
      >
        {locked ? (
          <span className="relative block h-full cursor-not-allowed">{inner}</span>
        ) : (
          <Link href={p.tool.href} className="group relative block h-full" aria-label={`Open ${p.tool.name}`}>
            <span className="absolute inset-0 rounded-xl opacity-0 transition group-hover:opacity-100" style={{ boxShadow: `0 0 26px ${color}4d` }} />
            {inner}
          </Link>
        )}
      </div>
    );
    return layer;
  };

  const spring = (ax: number, ay: number, bx: number, by: number): string => {
    const mx = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#04050a]" style={{ height: 'calc(100vh - 190px)', minHeight: 520 }}>
      {/* legend */}
      <div className="absolute left-4 top-4 z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-[#080a11]/90 px-3 py-2 shadow-2xl backdrop-blur">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10">
          <Cpu className="h-3.5 w-3.5 text-cyan-300" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">The full operating space</p>
          <p className="text-[9px] text-gray-500">one connected line of every tool · CORE → $1,000 → $1,600</p>
        </div>
      </div>

      {/* controls */}
      <div className="absolute right-4 top-4 z-40 flex items-center gap-1 rounded-xl border border-white/10 bg-[#080a11]/90 p-1 shadow-2xl">
        <Link href="/dashboard/toolkits" className="rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FFD700] hover:bg-white/10" title="Open the full toolkit space">
          <Crown className="h-4 w-4" />
        </Link>
        <button onClick={() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.25); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={fitAll} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Zoom out over everything">
          <Maximize2 className="h-4 w-4" />
        </button>
        <button onClick={reset} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Back to the CORE">
          <Radar className="h-4 w-4" />
        </button>
        <span className="px-2 text-[10px] tabular-nums text-gray-600">{Math.round(view.k * 100)}%</span>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/8 bg-black/70 px-3.5 py-1.5 text-[10px] text-gray-500 backdrop-blur">
        scroll to zoom in / out · drag empty space to move · hover a tool to read it · click anything to open it
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
          {/* starfield + nebulae */}
          <div className="jbos-grid-bg absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '140px 140px' }} />
          <div className="pointer-events-none absolute -left-40 top-0 h-[900px] w-[1100px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 66%)' }} />
          <div className="pointer-events-none absolute left-[1800px] top-[900px] h-[1000px] w-[1300px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 66%)' }} />
          <div className="pointer-events-none absolute left-[1800px] top-[1900px] h-[900px] w-[1300px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.08), transparent 66%)' }} />

          {/* ---------- connectors ---------- */}
          <svg className="pointer-events-none absolute inset-0 z-0" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
            <defs>
              <marker id="unCore" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2276D9" /></marker>
              <marker id="unPremium" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#FF6B9D" /></marker>
              <marker id="unPro" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#E879F9" /></marker>
              <marker id="unFlow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" /></marker>
            </defs>

            {/* zoned tiers — dashed boxes */}
            {BOXES.map((b) => (
              <g key={b.key}>
                <rect x={BOX_X} y={b.y} width={BOX_W} height={b.h} rx={20} fill={`${b.color}0d`} stroke={`${b.color}40`} strokeWidth="1.4" strokeDasharray="6 5" />
                <text x={BOX_X + 22} y={b.y + 26} fontSize="12" fontWeight={800} fill={b.color} opacity={0.9} letterSpacing="1.5">{b.label.toUpperCase()}</text>
                <text x={BOX_X + 22} y={b.y + 44} fontSize="10" fill="#8b93a7" opacity={0.8}>{b.sub}</text>
              </g>
            ))}

            {/* the operating spine — sun → phases */}
            <g opacity="0.9">
              <path d={`M ${SUN.x + SUN.w / 2} ${SPINE_Y} H ${PLANETS[3].cx}`} stroke="#22d3ee" strokeWidth="2" />
              {PLANETS.map((p) => (
                <path key={p.id} d={spring(p.cx, SPINE_Y - 40, p.cx, SPINE_Y - 2)} stroke={p.color} strokeWidth="1.2" strokeOpacity="0.5" />
              ))}
            </g>

            {/* phase planets → their tier boxes */}
            {PLANETS.map((p) => {
              const box = BOXES.find((b) => b.key === p.tier) ?? BOXES[0];
              const dx = Math.min(Math.max(p.cx, BOX_X + 40), BOX_X + BOX_W - 40);
              return <path key={`drop-${p.id}`} d={spring(dx, SPINE_Y + 46, dx, box.y + 30)} stroke={p.color} strokeWidth="1.6" strokeDasharray="5 5" strokeOpacity="0.8" markerEnd="url(#unFlow)" />;
            })}

            {/* sun → first tool of the line */}
            <path d={spring(SUN.x + SUN.w / 2 + 8, SPINE_Y, X0 - 30, LINE[0].y)} stroke="#2276D9" strokeWidth="2" markerEnd="url(#unCore)" />

            {/* the line of tools — each tool is a node ON the line */}
            {lineEdges().map(([a, b], i) => {
              const pa = LINE[a];
              const pb = LINE[b];
              if (!pa || !pb) return null;
              const c = pa.tier === 'core' ? '#2276D9' : pa.tier === 'premium' ? '#FF6B9D' : '#E879F9';
              return (
                <path key={i} d={spring(pa.x, pa.y, pb.x, pb.y)} fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" markerEnd={`url(#${pa.tier === 'core' ? 'unCore' : pa.tier === 'premium' ? 'unPremium' : 'unPro'})`} />
              );
            })}

            {/* step unlocks — better is next */}
            {TIER_SPRINGS.map((s) => (
              <g key={s.node.x}>
                <path d={spring(s.from.x, s.from.y + CHIP_H / 2, s.node.x, s.node.y - 22)} fill="none" stroke={s.color} strokeWidth="1.8" strokeDasharray="5 5" strokeOpacity="0.7" />
                <path d={spring(s.node.x, s.node.y + 22, s.to.x, s.to.y - CHIP_H / 2)} fill="none" stroke={s.color} strokeWidth="1.8" strokeDasharray="5 5" strokeOpacity="0.7" markerEnd={`url(#${s.color === '#FF6B9D' ? 'unPremium' : 'unPro'})`} />
              </g>
            ))}

            {/* sections → their tier box */}
            {SECTIONS.map((s) => {
              const target = s.id === 'marketing' || s.id === 'finance' ? BOXES[2] : s.id === 'workforce' || s.id === 'automation' || s.id === 'skills' ? BOXES[1] : BOXES[0];
              const ty = Math.min(Math.max(s.y, target.y + 50), target.y + target.h - 50);
              return <path key={`sec-${s.id}`} d={spring(BOX_X + BOX_W, ty, s.x - 110, s.y)} fill="none" stroke={s.color} strokeWidth="1.4" strokeDasharray="3 6" strokeOpacity="0.45" markerEnd="url(#unFlow)" />;
            })}
          </svg>

          {/* ---------- CORE sun ---------- */}
          <Link
            href="/dashboard/executive"
            className="absolute z-10 flex flex-col items-center justify-center rounded-full border border-cyan-300/40 bg-gradient-to-b from-cyan-500/20 to-transparent text-center"
            style={{ left: SUN.x - SUN.w / 2, top: SUN.y - SUN.h / 2, width: SUN.w, height: SUN.h, boxShadow: '0 0 60px rgba(34,211,238,0.35)' }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-200">{brand}</span>
            <span className="text-2xl font-black tracking-tight text-white">CORE</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
            </span>
          </Link>

          {/* ---------- four phase planets ---------- */}
          {PLANETS.map((f) => (
            <Link
              key={f.id}
              href={f.tier === 'core' ? '/dashboard/executive' : f.tier === 'premium' ? '/dashboard/lifeadmin' : '/dashboard/closer'}
              className="absolute z-20 flex flex-col items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{
                left: f.cx - 90, top: SPINE_Y - 90, width: 180, height: 180,
                background: `radial-gradient(120% 120% at 35% 30%, ${f.color}26, rgba(5,6,11,0.9) 82%)`,
                border: `1px solid ${f.color}55`,
                boxShadow: `0 0 34px ${f.color}33`,
              }}
            >
              <span className="rounded border px-1.5 text-[7px] font-bold tracking-[0.2em]" style={{ borderColor: f.color, color: f.color }}>STEP</span>
              <span className="text-[9px] font-black tracking-[0.14em]" style={{ color: f.color }}>{f.step}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">{f.label}</span>
            </Link>
          ))}

          {/* ---------- THE LINE — every tool, in order: this is better than this ---------- */}
          {LINE.map(renderChip)}

          {/* ---------- step unlock nodes ---------- */}
          {TIER_SPRINGS.map((s) => (
            <Link
              key={`n-${s.node.x}`}
              href="/dashboard/plans"
              className="absolute z-20 flex items-center justify-center rounded-full border bg-[#0b0b13]/95 text-center"
              style={{
                left: s.node.x - 92, top: s.node.y - 44, width: 184, height: 88,
                borderColor: `${s.color}55`,
                boxShadow: `0 0 30px ${s.color}26`,
              }}
            >
              <Crown className="absolute -top-2.5 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full p-0.5" style={{ color: s.color, background: '#0b0b13', border: `1px solid ${s.color}66` }} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: s.color }}>{s.label === 'unlock' ? 'unlock →' : s.label}</span>
              <span className="mt-0.5 text-[7px] text-gray-500">next tier · all these tools included</span>
            </Link>
          ))}

          {/* ---------- terminal — the whole system ---------- */}
          <Link
            href="/dashboard/toolkits"
            className="absolute z-20 flex items-center gap-2 rounded-2xl border border-[#FFD700]/40 bg-gradient-to-r from-[#FFD700]/10 to-[#E879F9]/10 px-5 py-3 transition hover:bg-white/5"
            style={{ left: 4560, top: 2340, boxShadow: '0 0 40px rgba(255,215,0,0.12)' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_14px_rgba(255,215,0,0.5)]">
              <Crown className="h-4 w-4 text-[#1a0a2e]" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white">The whole system</span>
              <span className="flex items-center gap-1 text-[9px] text-gray-400">{ALL_TOOLS.length} tools · every tier, one line <ArrowRight className="h-3 w-3" /></span>
            </span>
          </Link>

          {/* ---------- section planets ---------- */}
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/${s.id}`}
              className="group absolute z-20 flex flex-col items-center justify-center rounded-2xl border transition-transform hover:scale-105"
              style={{
                left: s.x - 82, top: s.y - 46, width: 164, height: 92,
                background: `linear-gradient(160deg, ${s.color}1a, rgba(5,6,11,0.92) 75%)`,
                borderColor: `${s.color}3d`,
                boxShadow: `0 0 20px ${s.color}18`,
              }}
            >
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">{s.label}</span>
              <span className="mt-0.5 px-2 text-center text-[7px] leading-tight text-gray-500">{s.sub}</span>
            </Link>
          ))}

          {/* hover card */}
          {hover && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0b13]/95 px-3 py-2 shadow-2xl backdrop-blur"
              style={{ left: hover.x, top: hover.y - 6, maxWidth: 300 }}
            >
              <p className="text-[11px] font-bold text-white">{hover.name}</p>
              <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: hover.locked ? '#9aa0b0' : '#FFD700' }}>
                {hover.locked ? 'upgrade to unlock' : hover.tier}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-gray-400">{hover.blurb}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}