'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Bot, BrainCircuit, CalendarCheck2, Crown, Database, FileText, FolderKanban,
  Gauge, Globe2, HeartHandshake, KeyRound, Link2, Megaphone, Monitor, Settings, ShieldCheck, Sparkles,
  Target, Truck, Users, Wallet, Waypoints, Workflow, X, type LucideIcon,
} from 'lucide-react';
import {
  BOARD_TOOLS, CORE, FAMILIES, PREMIUM_TOOLS, RELATIONS, relationsOf, type RadialFamily, type RadialTool,
} from '@/lib/radial01';

const ICONS: Record<string, LucideIcon> = {
  Gauge, ShieldCheck, KeyRound, Settings, BrainCircuit, CalendarCheck2, FolderKanban, Workflow, Globe2,
  Database, Sparkles, Monitor, Truck, Wallet, Link2, Users, Megaphone, HeartHandshake, Target, BarChart3,
  FileText, Waypoints, Bot,
};

// SVG / HTML coordinates for a tool on a 0-100 board (center 50,50).
// Radius of a tool = orbit radius (fraction of half the board) * 50 units.
const POS = (t: RadialTool) => {
  const r = (t.layer === 'inner' ? 0.3 : 0.47) * 50;
  const rad = (t.deg * Math.PI) / 180;
  return { x: 50 + r * Math.sin(rad), y: 50 - r * Math.cos(rad), r };
};

const REL_EDGES = (() => {
  const seen = new Set<string>();
  const edges: Array<[RadialTool, RadialTool]> = [];
  for (const tool of BOARD_TOOLS) {
    for (const rid of RELATIONS[tool.id] ?? []) {
      const peer = BOARD_TOOLS.find((t) => t.id === rid);
      if (!peer) continue;
      const key = [tool.id, peer.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([tool, peer]);
    }
  }
  return edges;
})();

const CARD_PX = 76;

function ToolCard({
  tool,
  active,
  onSelect,
  onHover,
}: {
  tool: RadialTool;
  active: boolean;
  onSelect: (t: RadialTool) => void;
  onHover: (t: RadialTool | null) => void;
}) {
  const router = useRouter();
  const pos = POS(tool);
  const color = FAMILIES[tool.family].color;
  const Icon = ICONS[tool.icon] ?? Gauge;
  return (
    <div
      className="group absolute z-10"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)' }}
      onMouseEnter={() => onHover(tool)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        onClick={() => {
          onSelect(tool);
          router.push(tool.href);
        }}
        className="relative flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200"
        style={{
          width: CARD_PX,
          height: CARD_PX,
          background: 'rgba(32,38,48,0.92)',
          border: active ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.07)',
          boxShadow: active
            ? `0 0 18px ${color}55, inset 0 1px 0 rgba(255,255,255,0.08)`
            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 16px rgba(0,0,0,0.35)',
        }}
      >
        {tool.premium && (
          <span className="absolute -top-2 -right-1.5 z-20">
            <Crown className="h-3.5 w-3.5" style={{ color: '#FFC400', fill: '#FFC400' }} />
          </span>
        )}
        <span
          className="absolute top-0 left-2 h-px w-5"
          style={{ background: `linear-gradient(90deg, transparent, ${color})` }}
        />
        <Icon className="h-[18px] w-[18px]" style={{ color }} />
        <span className="max-w-full truncate px-1 text-[9.5px] font-semibold text-gray-200">{tool.name}</span>
      </button>
      {active && (
        <span
          className="absolute left-1/2 -bottom-2 h-1.5 w-1.5 rounded-full"
          style={{ transform: 'translateX(-50%)', background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
    </div>
  );
}

const FAMILY_ORDER: RadialFamily[] = ['intelligence', 'system', 'work', 'growth', 'delivery'];

export default function RadialBoardPage() {
  const [selected, setSelected] = useState<RadialTool | null>(null);
  const [hovered, setHovered] = useState<RadialTool | null>(null);
  const focus = selected ?? hovered;
  const focusColor = focus ? FAMILIES[focus.family].color : null;

  const focusPeers = useMemo(() => (focus ? relationsOf(focus.id) : []), [focus]);

  const connectedSet = useMemo(
    () => (focus ? new Set(RELATIONS[focus.id] ?? []) : new Set<string>()),
    [focus],
  );

  const liveLines = useMemo(
    () =>
      REL_EDGES.filter(
        ([a, b]) => connectedSet.has(a.id) || connectedSet.has(b.id),
      ).filter(([a, b]) => focus && (a.id === focus.id || b.id === focus.id)),
    [connectedSet, focus],
  );

  const baseLines = useMemo(() => {
    if (focus) return REL_EDGES.filter(([a, b]) => !(connectedSet.has(a.id) && connectedSet.has(b.id)));
    return REL_EDGES;
  }, [focus, connectedSet]);

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#11151C' }}>
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full opacity-[0.16]"
          style={{ background: '#2486EA', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-48 -left-24 h-[460px] w-[460px] rounded-full opacity-[0.13]"
          style={{ background: '#9B6CFF', filter: 'blur(120px)' }} />
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(rgba(67,139,255,0.16) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 42%, transparent 30%, #11151C 100%)' }} />
      </div>

      <div className="relative px-5 py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#19C9D6' }}>
              Radial System 01 · Normal Toolkit
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">CAN&apos;T DECIDE GPT CORE</h1>
            <p className="mt-1 max-w-xl text-xs text-gray-500">
              Every tool on the ring is live. Select a tool to trace its live connections, or open
              it straight from the board. All 24 tools — no missing pages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FAMILY_ORDER.map((f) => (
              <span key={f} className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[10px] text-gray-400">
                <span className="h-2 w-2 rounded-full" style={{ background: FAMILIES[f].color }} />
                {FAMILIES[f].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 rounded-full border border-[#FFC400]/30 bg-[#FFC400]/10 px-2.5 py-1 text-[10px] text-[#FFC400]">
              <Crown className="h-3 w-3" /> PRO EXCLUSIVE
            </span>
            <Link
              href="/dashboard/toolkits"
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-gray-200 hover:bg-white/10"
            >
              Toolkit tiers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Board + inspector */}
        <div className="mt-4 flex flex-col gap-4 xl:flex-row">
          <div className="relative mx-auto aspect-square w-full max-w-[1120px] xl:flex-1" style={{ maxHeight: '82vh', minHeight: 420 }}>
            {/* Rings */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute rounded-full border" style={{ borderColor: 'rgba(55,100,145,0.22)', inset: '33.5%' }} />
              <div className="absolute rounded-full border" style={{ borderColor: 'rgba(55,100,145,0.25)', inset: '26.5%' }} />
              <div className="absolute rounded-full border border-dashed" style={{ borderColor: 'rgba(55,100,145,0.16)', inset: '18.5%' }} />
              <div className="absolute rounded-full border" style={{ borderColor: 'rgba(55,100,145,0.10)', inset: '10%' }} />
              <div
                className="absolute left-1/2 top-0 h-full w-px"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(55,100,145,0.18), transparent)' }}
              />
              <div
                className="absolute top-1/2 left-0 w-full h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(55,100,145,0.18), transparent)' }}
              />
            </div>

            {/* Zone labels */}
            <span className="pointer-events-none absolute left-1/2 top-[13px] -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#FF4D61]/70">GOVERN</span>
            <span className="pointer-events-none absolute right-[4px] top-[34%] hidden -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#9B6CFF]/60 lg:block">INTELLIGENCE</span>
            <span className="pointer-events-none absolute bottom-[6px] left-[12%] text-[10px] font-bold uppercase tracking-[0.35em] text-[#FF9D21]/70">DELIVERY</span>
            <span className="pointer-events-none absolute bottom-[6px] right-[12%] text-[10px] font-bold uppercase tracking-[0.35em] text-[#00D9B2]/70">REVENUE</span>

            {/* Connection lines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {baseLines.map(([a, b]) => {
                const pa = POS(a); const pb = POS(b);
                return (
                  <line
                    key={`${a.id}-${b.id}`}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="rgba(55,100,145,0.16)"
                    strokeWidth="0.28"
                  />
                );
              })}
              {focusColor &&
                liveLines.map(([a, b]) => {
                  const pa = POS(a); const pb = POS(b);
                  const d = `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;
                  return (
                    <g key={`live-${a.id}-${b.id}`}>
                      <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={focusColor} strokeWidth="0.55" opacity="0.85" />
                      <line
                        x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                        stroke="rgba(255,255,255,0.85)"
                        strokeWidth="0.5"
                        strokeDasharray="3 7"
                        className="radial-pulse"
                        style={{ animation: 'radialDash 1.5s linear infinite' }}
                      />
                      <circle r="1.15" fill={focusColor}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={d} />
                      </circle>
                    </g>
                  );
                })}
            </svg>

            {/* Tool cards */}
            {BOARD_TOOLS.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                active={focus !== null && (focus.id === t.id || connectedSet.has(t.id))}
                onSelect={setSelected}
                onHover={setHovered}
              />
            ))}

            {/* Spokes (core beams) */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {BOARD_TOOLS.map((t) => {
                const p = POS(t);
                return (
                  <line
                    key={`spoke-${t.id}`}
                    x1="50" y1="50" x2={p.x} y2={p.y}
                    stroke={focus?.id === t.id ? FAMILIES[t.family].color : 'rgba(55,100,145,0.13)'}
                    strokeWidth="0.22"
                    style={focus?.id === t.id ? { transition: 'stroke 0.2s' } : undefined}
                  />
                );
              })}
            </svg>

            {/* CORE */}
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div
                className="flex aspect-square items-center justify-center rounded-full text-center"
                style={{
                  width: 150,
                  background: CORE.gradient,
                  boxShadow: '0 0 60px rgba(32,217,195,0.4), 0 0 24px rgba(36,134,234,0.45), inset 0 -12px 30px rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <div
                  className="flex aspect-square items-center justify-center rounded-full"
                  style={{
                    width: 138,
                    background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.18), transparent 55%)',
                  }}
                >
                  <div>
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/90">Can&apos;t Decide GPT</p>
                    <p className="mt-0.5 text-[17px] font-black tracking-[0.18em] text-white drop-shadow">CORE</p>
                    <p className="mt-0.5 flex items-center justify-center gap-1 text-[8px] font-semibold text-white/85">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-300 shadow-[0_0_6px_#86efac]" />
                      LIVE
                    </p>
                    <p className="mx-auto mt-1 max-w-[126px] text-[7.5px] leading-tight text-white/75">
                      {CORE.tagline}
                    </p>
                  </div>
                </div>
              </div>
              <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.2em] text-white/45">
                © {new Date().getFullYear()} sync active
              </span>
            </div>
          </div>

          {/* Inspector */}
          <div className="w-full shrink-0 rounded-2xl border border-white/5 bg-[#191F28]/90 p-4 xl:w-[320px]">
            {!focus ? (
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">Tool Inspector</p>
                <p className="mt-3 text-xs text-gray-400">
                  Choose any tool on the ring to trace its live connections, review its scope and open its
                  workspace. The board is fully live — nothing here is a stub.
                </p>
                <p className="mt-4 text-[10px] text-gray-600">
                  {BOARD_TOOLS.length} tools · {PREMIUM_TOOLS.length} PRO EXCLUSIVE · {REL_EDGES.length} connections
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: FAMILIES[focus.family].soft, border: `1px solid ${focusColor}40` }}
                    >
                      {(() => { const Icon = ICONS[focus.icon] ?? Gauge; return <Icon className="h-4 w-4" style={{ color: focusColor ?? '#fff' }} />; })()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{focus.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: focusColor ?? '#888' }}>
                        {FAMILIES[focus.family].label}
                        {focus.premium && <span className="ml-1.5 text-[#FFC400]">· PRO EXCLUSIVE</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white"
                    aria-label="Close inspector"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-400">{focus.blurb}</p>
                <a
                  href={focus.href}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#0B1020]"
                  style={{ background: `linear-gradient(135deg, #20D9C3, #19C9D6)` }}
                >
                  Open {focus.name} workspace <ArrowRight className="h-3.5 w-3.5" />
                </a>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Connections ({focusPeers.length})
                </p>
                <div className="mt-2 space-y-1">
                  {focusPeers.length === 0 && <p className="text-xs text-gray-600">No mapped connections yet.</p>}
                  {focusPeers.map((p) => {
                    const PIcon = ICONS[p.icon] ?? Gauge;
                    return (
                      <Link
                        key={p.id}
                        href={p.href}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5"
                      >
                        <PIcon className="h-3.5 w-3.5" style={{ color: FAMILIES[p.family].color }} />
                        <span className="flex-1 text-xs text-gray-300">{p.name}</span>
                        {p.premium && <Crown className="h-3 w-3 text-[#FFC400]" />}
                        <ArrowRight className="h-3 w-3 text-gray-600 group-hover:text-gray-300" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile orbital nav */}
        <div className="mt-5 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Orbital navigation</p>
          <div className="mt-2 grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3" style={{ maxHeight: 320 }}>
            {BOARD_TOOLS.map((t) => {
              const Icon = ICONS[t.icon] ?? Gauge;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#202630]/70 px-3 py-2.5"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: FAMILIES[t.family].color }} />
                  <span className="flex-1 truncate text-xs text-gray-200">{t.name}</span>
                  {t.premium && <Crown className="h-3 w-3 text-[#FFC400]" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status line */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
          <p className="text-[10px] text-gray-500">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
            CORE live · {BOARD_TOOLS.length} tools synced · {PREMIUM_TOOLS.length} PRO EXCLUSIVE
          </p>
          <p className="text-[10px] text-gray-600">Tap any tool to open its workspace · select a tool to trace its connections</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes radialDash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </div>
  );
}