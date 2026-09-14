'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import {
  Activity, BarChart3, Bell, Box, Brain, BrainCircuit, Briefcase, Calculator, CalendarCheck,
  Clapperboard, ClipboardList, Compass, Cpu, Crown, Database, Eye, FileCheck, FileText, FlaskConical,
  FolderKanban, Gauge, Ghost, Globe2, Handshake, HeartCrack, Home, Inbox, KeyRound, LifeBuoy,
  Link as LinkIcon, Maximize2, Megaphone, MessageSquareOff, Microscope, Monitor, Moon, PiggyBank,
  Radar, Repeat, Scale, Search, Settings, Shield, ShieldCheck, ShoppingBag, Sparkles, Truck,
  UserPlus, Users, Users2, Wallet, Waypoints, Workflow, Wrench, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';
import { ALL_TOOLS, RESTORED_TOOLS, type HubTool, type RestoredTool } from '@/lib/hub';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';

const ICONS: Record<string, LucideIcon> = {
  Waypoints, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit, Activity, Workflow,
  Globe2, Database, Sparkles, Monitor, Truck, Wallet, Link: LinkIcon, Users2, Megaphone,
  BarChart3, FileText, Handshake, UserPlus, Calculator, Search, ClipboardList, Clapperboard,
  HeartCrack, FlaskConical, Repeat, Scale, MessageSquareOff, Moon, Radar, Brain, Briefcase,
  Ghost, LifeBuoy, Microscope, FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck,
  Wrench, Eye, Bell, Shield, Inbox, Box,
};

const toolIcon = (t: HubTool | RestoredTool) => ICONS[t.icon] ?? Box;
const isPremium = (t: HubTool | RestoredTool) => 'premium' in t && t.premium;

const WORLD_W = 5200;
const WORLD_H = 3400;
const MIN_K = 0.14;
const MAX_K = 2.6;

const CCTV = 106;

const CHIP_W = 176;
const CHIP_H = 96;

/* ---------------- celestial data ---------------- */

const ring = (n: number, cx: number, cy: number, r: number, phase = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => {
    const a = phase + (i * 2 * Math.PI) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

interface FlowPlanet {
  id: string;
  label: string;
  step: string;
  color: string;
  cx: number;
}

const CORE_Y = 620;

const FLOW: FlowPlanet[] = [
  { id: 'intelligence', label: 'Intelligence', step: 'READ', color: '#22d3ee', cx: 1120 },
  { id: 'govern', label: 'Governance', step: 'SAFEGUARD', color: '#a78bfa', cx: 1900 },
  { id: 'operate', label: 'Operations', step: 'EXECUTE', color: '#34d399', cx: 2680 },
  { id: 'revenue', label: 'Revenue', step: 'DELIVER', color: '#fbbf24', cx: 3460 },
];

const FLOW_TOOLS: Record<string, string[]> = {
  intelligence: ['executive', 'insights', 'analytics', 'reports', 'attribution'],
  govern: ['admin', 'security', 'settings', 'team', 'ai'],
  operate: ['operations', 'automation', 'integrations', 'memory', 'performer'],
  revenue: ['finance', 'website', 'marketing', 'hr', 'connect'],
};

interface ZonePlanet {
  id: string;
  label: string;
  color: string;
  cx: number;
  cy: number;
  inner: number;
  outer: number;
  tools: RestoredTool[];
}

const ZONES: ZonePlanet[] = [
  {
    id: 'business', label: 'BUSINESS PRO', color: '#7c3aed', cx: 4500, cy: 700,
    inner: 320, outer: 560,
    tools: RESTORED_TOOLS.filter((t) => t.zone === 'business'),
  },
  {
    id: 'life', label: 'PERSONAL LIFE', color: '#14b8a6', cx: 4620, cy: 1300,
    inner: 240, outer: 460,
    tools: RESTORED_TOOLS.filter((t) => t.zone === 'life'),
  },
];

const toolById = (id: string): HubTool | RestoredTool | undefined => ALL_TOOLS.find((t) => t.id === id);

const SECTIONS: { id: string; label: string; sub: string; icon: LucideIcon; color: string; x: number; y: number }[] = [
  { id: 'missioncontrol', label: 'Mission Control', sub: 'live execution · verify · undo', icon: Radar, color: '#22d3ee', x: 480, y: 1400 },
  { id: 'projects', label: 'Projects', sub: 'constellation of work', icon: FolderKanban, color: '#8b5cf6', x: 860, y: 1330 },
  { id: 'workforce', label: 'Workforce', sub: 'ai employees & skills', icon: Users, color: '#34d399', x: 520, y: 1730 },
  { id: 'automation', label: 'Automation', sub: 'workflow studio', icon: Workflow, color: '#34d399', x: 1190, y: 1630 },
  { id: 'marketing', label: 'Marketing', sub: 'campaigns & attribution', icon: Megaphone, color: '#18d9a0', x: 1500, y: 1300 },
  { id: 'finance', label: 'Finance', sub: 'revenue · cash · risk', icon: Wallet, color: '#fbbf24', x: 950, y: 1810 },
  { id: 'skills', label: 'Skills', sub: 'capabilities library', icon: Sparkles, color: '#a78bfa', x: 1540, y: 1770 },
];

const sun = { x: 400, y: CORE_Y, w: 240, h: 120 };

const TX_CX = 2650;
const TX_Y = 1240;
const TX_W = 900;
const TX_H = 250;

const CONNECTOR_STUBS = [
  { fromX: 2330, toX: 1000, color: '#2276D9' },
  { fromX: 2650, toX: 2600, color: '#FF6B9D' },
  { fromX: 2970, toX: 4200, color: '#E879F9' },
];

const INFO_CONSTELLATION = { cx: 4000, cy: 2360, rx: 760, ry: 560 };

const sunflower = (i: number, n: number) => {
  const GA = Math.PI * (3 - Math.sqrt(5));
  const r = Math.sqrt((i + 0.5) / n);
  const a = i * GA;
  return {
    x: INFO_CONSTELLATION.cx + INFO_CONSTELLATION.rx * r * Math.cos(a),
    y: INFO_CONSTELLATION.cy + INFO_CONSTELLATION.ry * r * Math.sin(a),
  };
};

const STARS = ALL_TOOLS.map((t, i) => ({ t, ...sunflower(i, ALL_TOOLS.length) }));

const PANEL_W = 1140;
const PANEL_H = 1180;
const PANEL_Y = 2100;
const RADIALS = [
  { which: 'core' as const, label: '01 · CORE TOOLKIT — included', color: '#2276D9', x: 430 },
  { which: 'premium' as const, label: '02 · $1,000 PREMIUMS', color: '#FF6B9D', x: 2030 },
  { which: 'pro' as const, label: '03 · $1,600 PRO PREMIUMS', color: '#E879F9', x: 3630 },
];

/* ---------------- the space ---------------- */

export function UniverseSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string; blurb: string; premium?: boolean } | null>(null);
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));

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

  const fitAll = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const k = Math.min(MIN_K + 0.14, 0.42);
    const w = WORLD_W * k;
    const h = WORLD_H * k;
    setView({ x: Math.max(0, (rect.width - w) / 2), y: Math.max(0, (rect.height - h) / 2), k });
  };

  const reset = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setView({ x: rect.width / 2 - sun.x, y: rect.height / 2 - sun.y, k: 1 });
  };

  const renderMoon = (t: HubTool | RestoredTool, cx: number, cy: number) => {
    const Icon = toolIcon(t);
    const gold = isPremium(t);
    return (
      <div key={t.id} className="absolute z-10" style={{ left: cx - CHIP_W / 2, top: cy - CHIP_H / 2, width: CHIP_W, height: CHIP_H }}>
        <Link href={t.href} className="group relative block h-full" aria-label={`Open ${t.name}`}>
          <span
            className={`absolute inset-0 rounded-xl border transition-all ${gold ? 'border-amber-300/25 bg-[#0d0d14]' : 'border-white/10 bg-[#0b0b12]'} group-hover:border-white/30`}
            style={{ boxShadow: gold ? '0 0 12px rgba(251,191,36,0.18), 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.45)' }}
          >
            <span className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
              <Icon className={`h-5 w-5 ${gold ? 'text-amber-200' : 'text-sky-300/90'}`} />
              <span className="block w-full truncate text-[11px] font-semibold text-white">{t.name}</span>
              {gold && <span className="text-[7px] font-bold uppercase tracking-widest text-amber-400">pro</span>}
            </span>
          </span>
        </Link>
      </div>
    );
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
          <p className="text-[9px] text-gray-500">every section, every tool, all three radial toolkits — placed like a sky</p>
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
        scroll to zoom in / out · drag empty space to move · hover a star to read it · click anything to open it
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
          <div className="pointer-events-none absolute left-[2600px] top-[700px] h-[1000px] w-[1200px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 66%)' }} />
          <div className="pointer-events-none absolute left-[3300px] top-[1900px] h-[900px] w-[1200px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.08), transparent 66%)' }} />

          {/* ---------- connectors ---------- */}
          <svg className="pointer-events-none absolute inset-0 z-0" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
            <defs>
              <marker id="unFlow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
              </marker>
              <marker id="unCore" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#2276D9" />
              </marker>
              <marker id="unPremium" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#FF6B9D" />
              </marker>
              <marker id="unPro" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#E879F9" />
              </marker>
            </defs>

            {/* the one operating flow — spine above the planets */}
            <g opacity="0.9">
              <path d={`M ${sun.x} ${sun.y - sun.h / 2 - 8} V 440`} stroke="#22d3ee" strokeWidth="2" />
              <path d="M 400 440 H 3600" stroke="#22d3ee" strokeWidth="2" />
              {FLOW.map((f) => (
                <path key={f.id} d={`M ${f.cx} 440 V ${CORE_Y - CCTV}`} stroke={f.color} strokeWidth="2" markerEnd="url(#unFlow)" />
              ))}
            </g>

            {/* toolkit center → the three radial toolkits */}
            {CONNECTOR_STUBS.map((c) => (
              <g key={c.toX}>
                <path
                  d={c.toX === 2600 ? `M ${c.fromX} ${TX_Y + TX_H / 2 + 8} L ${c.toX} ${PANEL_Y - 2}` : `M ${c.fromX} ${TX_Y + TX_H / 2 + 8} C ${c.fromX} ${TX_Y + 560}, ${c.toX} ${TX_Y + 560}, ${c.toX} ${PANEL_Y - 2}`}
                  stroke={c.toX === 2600 ? c.color : c.color}
                  strokeWidth="2"
                  strokeDasharray="6 5"
                  strokeOpacity="0.7"
                  markerEnd={`url(#${c.color === '#2276D9' ? 'unCore' : c.color === '#FF6B9D' ? 'unPremium' : 'unPro'})`}
                />
              </g>
            ))}

            {/* orbit ring around the special toolkit center */}
            <circle cx={TX_CX} cy={TX_Y + 30} r={560} fill="none" stroke="rgba(255,215,0,0.14)" strokeWidth="1.2" strokeDasharray="3 10" className="jbos-breathe" style={{ animationDuration: '9s' }} />

            {/* flow planet + moon spokes */}
            {FLOW.map((f) =>
              FLOW_TOOLS[f.id].map((id, i) => {
                const { x, y } = ring(FLOW_TOOLS[f.id].length, f.cx, CORE_Y, 300)[i];
                return <path key={id} d={`M ${f.cx} ${CORE_Y} L ${x} ${y}`} stroke={f.color} strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.3" />;
              }),
            )}

            {/* business / life spokes */}
            {ZONES.map((z) => {
              const inner = ring(6, z.cx, z.cy, z.inner);
              const outerPts = ring(Math.max(0, z.tools.length - 6), z.cx, z.cy, z.outer, -Math.PI / 2 + Math.PI / 6);
              return (
                <g key={z.id}>
                  {z.tools.slice(0, 6).map((t, i) => (
                    <path key={t.id} d={`M ${z.cx} ${z.cy} L ${inner[i].x} ${inner[i].y}`} stroke={z.color} strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.3" />
                  ))}
                  {z.tools.slice(6).map((t, i) => (
                    <path key={t.id} d={`M ${z.cx} ${z.cy} L ${outerPts[i].x} ${outerPts[i].y}`} stroke={z.color} strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.28" />
                  ))}
                </g>
              );
            })}

            {/* the full constellation rings */}
            <ellipse cx={INFO_CONSTELLATION.cx} cy={INFO_CONSTELLATION.cy} rx={INFO_CONSTELLATION.rx} ry={INFO_CONSTELLATION.ry} fill="none" stroke="rgba(232,121,249,0.12)" strokeWidth="1.2" strokeDasharray="4 8" className="jbos-breathe" style={{ animationDuration: '8s' }} />
            <ellipse cx={INFO_CONSTELLATION.cx} cy={INFO_CONSTELLATION.cy} rx={INFO_CONSTELLATION.rx * 0.6} ry={INFO_CONSTELLATION.ry * 0.6} fill="none" stroke="rgba(232,121,249,0.08)" strokeWidth="1" strokeDasharray="2 6" />
          </svg>

          {/* ---------- CORE sun ---------- */}
          <Link
            href="/dashboard/executive"
            className="absolute z-10 flex flex-col items-center justify-center rounded-full border border-cyan-300/40 bg-gradient-to-b from-cyan-500/20 to-transparent text-center"
            style={{ left: sun.x - sun.w / 2, top: sun.y - sun.h / 2, width: sun.w, height: sun.h, boxShadow: '0 0 60px rgba(34,211,238,0.35)' }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-200">{brand}</span>
            <span className="text-2xl font-black tracking-tight text-white">CORE</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
            </span>
          </Link>

          {/* ---------- flow planets + moons ---------- */}
          {FLOW.map((f) => {
            const moons = ring(FLOW_TOOLS[f.id].length, f.cx, CORE_Y, 300);
            return (
              <div key={f.id}>
                {moons.map((p, i) => {
                  const t = toolById(FLOW_TOOLS[f.id][i]);
                  if (!t) return null;
                  return renderMoon(t, p.x, p.y);
                })}
                <Link
                  href={`/dashboard/${f.id === 'intelligence' ? 'executive' : f.id === 'govern' ? 'admin' : f.id === 'operate' ? 'operations' : 'finance'}`}
                  className="absolute z-20 flex flex-col items-center justify-center rounded-full transition-transform hover:scale-105"
                  style={{
                    left: f.cx - CCTV, top: CORE_Y - CCTV, width: CCTV * 2, height: CCTV * 2,
                    background: `radial-gradient(120% 120% at 35% 30%, ${f.color}26, rgba(5,6,11,0.9) 82%)`,
                    border: `1px solid ${f.color}55`,
                    boxShadow: `0 0 34px ${f.color}33`,
                  }}
                >
                  <span className="rounded border px-1.5 text-[7px] font-bold tracking-[0.2em]" style={{ borderColor: f.color, color: f.color }}>STEP</span>
                  <span className="text-[9px] font-black tracking-[0.14em]" style={{ color: f.color }}>{f.step}</span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">{f.label}</span>
                </Link>
              </div>
            );
          })}

          {/* ---------- business & life planets ---------- */}
          {ZONES.map((z) => {
            const inner = ring(6, z.cx, z.cy, z.inner);
            const outerPts = ring(Math.max(0, z.tools.length - 6), z.cx, z.cy, z.outer, -Math.PI / 2 + Math.PI / 6);
            const r = z.id === 'business' ? 66 : 58;
            return (
              <div key={z.id}>
                {z.tools.slice(0, 6).map((t, i) => renderMoon(t, inner[i].x, inner[i].y))}
                {z.tools.slice(6).map((t, i) => renderMoon(t, outerPts[i].x, outerPts[i].y))}
                <Link
                  href={`/dashboard/${z.id === 'business' ? 'weeklyops' : 'lifeadmin'}`}
                  className="absolute z-20 flex flex-col items-center justify-center rounded-full transition-transform hover:scale-105"
                  style={{
                    left: z.cx - r, top: z.cy - r, width: r * 2, height: r * 2,
                    background: `radial-gradient(120% 120% at 35% 30%, ${z.color}33, rgba(5,6,11,0.92) 82%)`,
                    border: `1px solid ${z.color}66`,
                    boxShadow: `0 0 40px ${z.color}40`,
                  }}
                >
                  <Moon className="h-4 w-4" style={{ color: z.color }} />
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">{z.id === 'business' ? 'Business' : 'Life'}</span>
                  <span className="text-[6px] font-bold uppercase tracking-[0.18em]" style={{ color: z.color }}>{z.tools.length} tools</span>
                </Link>
                <span className="pointer-events-none absolute text-[8px] font-bold uppercase tracking-[0.2em]" style={{ left: z.cx - 90, top: z.cy - r - 22, width: 180, textAlign: 'center', color: `${z.color}88` }}>
                  {z.label}
                </span>
              </div>
            );
          })}

          {/* ---------- the full constellation ---------- */}
          <div className="absolute z-10 flex w-[520px] flex-col items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-[#0b0b13]/80 px-4 py-3 text-center" style={{ left: INFO_CONSTELLATION.cx - 260, top: INFO_CONSTELLATION.cy - INFO_CONSTELLATION.ry - 140 }}>
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-[#e879f9]">every tool · one constellation</p>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">The full toolkit placed among the stars</h2>
            <p className="mt-1 text-[10px] leading-snug text-gray-500">{ALL_TOOLS.length} tools — core, business &amp; life — scattered in orbit. Each one opens and runs. Premium tools shine gold.</p>
          </div>
          {STARS.map(({ t, x, y }) => {
            const Icon = toolIcon(t);
            const gold = isPremium(t);
            return (
              <div key={t.id} className="absolute z-10" style={{ left: x - 28, top: y - 28, width: 56, height: 56 }} onMouseEnter={() => setHover({ x, y, name: t.name, blurb: t.blurb, premium: gold })} onMouseLeave={() => setHover((h) => (h?.name === t.name ? null : h))}>
                <Link href={t.href} className="group flex h-full w-full items-center justify-center rounded-full border transition-transform hover:scale-110" style={{ background: gold ? 'radial-gradient(circle, rgba(251,191,36,0.18), rgba(13,13,20,0.9))' : 'radial-gradient(circle, rgba(34,211,238,0.10), rgba(11,11,18,0.9))', borderColor: gold ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.12)', boxShadow: gold ? '0 0 14px rgba(251,191,36,0.3)' : '0 0 10px rgba(34,211,238,0.12)' }} aria-label={`Open ${t.name}`}>
                  <Icon className={`h-5 w-5 ${gold ? 'text-amber-200' : 'text-sky-300/90'}`} />
                </Link>
                <span className={`pointer-events-none absolute left-1/2 w-24 -translate-x-1/2 truncate text-center text-[8px] font-semibold ${gold ? 'text-amber-200/90' : 'text-white/60'}`} style={{ top: 34 }}>
                  {t.name}
                </span>
              </div>
            );
          })}

          {/* ---------- section planets ---------- */}
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/${s.id}`}
              className="group absolute z-20 flex flex-col items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{
                left: s.x - 55, top: s.y - 55, width: 110, height: 110,
                background: `radial-gradient(120% 120% at 35% 30%, ${s.color}1f, rgba(5,6,11,0.92) 80%)`,
                border: `1px solid ${s.color}44`,
                boxShadow: `0 0 24px ${s.color}22`,
              }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">{s.label}</span>
              <span className="mt-0.5 px-2 text-center text-[7px] leading-tight text-gray-500">{s.sub}</span>
            </Link>
          ))}

          {/* ---------- waves of the three radial toolkits ---------- */}
          <div
            className="absolute z-20 flex flex-col items-center justify-center rounded-3xl border text-center"
            style={{
              left: TX_CX - TX_W / 2, top: TX_Y - TX_H / 2, width: TX_W, height: TX_H,
              background: 'radial-gradient(120% 120% at 50% 20%, rgba(255,215,0,0.10), rgba(10,9,16,0.94) 78%)',
              borderColor: 'rgba(255,215,0,0.35)',
              boxShadow: '0 0 70px rgba(255,215,0,0.18), inset 0 0 60px rgba(255,215,0,0.04)',
            }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_18px_rgba(255,215,0,0.5)]">
              <Crown className="h-5 w-5 text-[#1a0a2e]" strokeWidth={2.5} />
            </span>
            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#FFD700]">special toolkit</p>
            <h2 className="text-xl font-black uppercase tracking-[0.14em] text-white">The three radial toolkits</h2>
            <p className="mt-1 text-[10px] text-gray-500">CORE — every company module · $1,000 premiums — life that sorts itself · $1,600 pro premiums — the operator who wants it all</p>
            <Link href="/dashboard/toolkits" className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[#FFD700]/40 bg-[#FFD700]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FFD700] transition hover:bg-[#FFD700]/20">
              Open the toolkit space <Crown className="h-3 w-3" />
            </Link>
          </div>

          {/* ---------- the three radial toolkits ---------- */}
          {RADIALS.map((kit) => (
            <div key={kit.which} className="absolute z-0 rounded-2xl border border-white/8 bg-[#0a0c14]/60" style={{ left: kit.x, top: PANEL_Y, width: PANEL_W, height: PANEL_H, padding: 18 }}>
              <p className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.26em]" style={{ color: kit.color }}>
                <Radar className="h-3.5 w-3.5" /> {kit.label}
              </p>
              <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-500">
                <Workflow className="h-3 w-3" /> hover a tool — it opens with what it is, how to use it, and how it helps.
              </div>
              <OrbitalKits which={kit.which} coreLabel={brand} subtitle="System Intelligence Active" />
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