'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CalendarClock, ClipboardList, Crown, Eye, Home, Inbox, Layers,
  Map, Scale, Wallet, Wrench, X, type LucideIcon,
} from 'lucide-react';
import {
  HUB, PREMIUM, PREMIUM_TOOLS, PREMIUM_RELATIONS, PREMIUM_FLAGSHIPS,
  relationsOfPremium, tiesOfPremium, FAMILY_LABELS, type PremiumTool,
} from '@/lib/radial02';

const ICONS: Record<string, LucideIcon> = {
  Layers, ClipboardList, Inbox, Wallet, Map, Home, Scale, CalendarClock, Wrench, Eye,
};

const POS = (t: PremiumTool) => ({ x: 50 + t.pos.x * 50, y: 50 + t.pos.y * 50 });

const REL_EDGES = (() => {
  const seen = new Set<string>();
  const edges: Array<[PremiumTool, PremiumTool]> = [];
  for (const tool of PREMIUM_TOOLS) {
    for (const rid of PREMIUM_RELATIONS[tool.id] ?? []) {
      const peer = PREMIUM_TOOLS.find((t) => t.id === rid);
      if (!peer) continue;
      const key = [tool.id, peer.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([tool, peer]);
    }
  }
  return edges;
})();

const CARD_PX = 80;

function PremiumCard({
  tool,
  active,
  dimmed,
  onSelect,
}: {
  tool: PremiumTool;
  active: boolean;
  dimmed: boolean;
  onSelect: (t: PremiumTool) => void;
}) {
  const router = useRouter();
  const pos = POS(tool);
  const Icon = ICONS[tool.icon] ?? Eye;
  return (
    <div
      className="absolute z-10 transition-all duration-200"
      style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        opacity: dimmed && !active ? 0.18 : 1,
      }}
    >
      {/* Double pink orbital rings — the energy field */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ width: CARD_PX + 16, height: CARD_PX + 16, borderColor: PREMIUM.ringOuter, transition: 'box-shadow 0.2s, opacity 0.2s' }} />
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{ width: CARD_PX + 7, height: CARD_PX + 7, borderColor: PREMIUM.ringInner, boxShadow: active ? `0 0 16px ${PREMIUM.primary}55` : undefined }} />

      {/* Gold crown */}
      <span
        className="pointer-events-none absolute -right-2 -top-2 z-20 grid h-6 w-6 place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${PREMIUM.crownHi}, #C79B00)`,
          boxShadow: active ? `0 0 12px ${PREMIUM.crown}66` : '0 0 4px rgba(255,196,0,0.35)',
        }}
      >
        <Crown className="h-3.5 w-3.5 text-[#221a00]" fill="#221a00" />
      </span>

      <button
        type="button"
        onClick={() => {
          onSelect(tool);
          router.push(tool.href);
        }}
        className="relative z-10 flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all duration-200"
        style={{
          width: CARD_PX, height: CARD_PX,
          background: PREMIUM.cardBg,
          border: active ? `1.5px solid ${PREMIUM.primary}` : `1px solid ${PREMIUM.cardBorder}`,
          boxShadow: active
            ? `0 0 22px ${PREMIUM.primary}55, inset 0 1px 0 rgba(255,255,255,0.10)`
            : '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: tool.accent }} />
        <span className="max-w-full truncate px-1 text-[9.5px] font-bold" style={{ color: active ? '#FFFFFF' : PREMIUM.name }}>
          {tool.name}
        </span>
        <span className="text-[7.5px] font-semibold uppercase tracking-wider" style={{ color: PREMIUM.price }}>
          $1000 PLAN
        </span>
      </button>
      {active && (
        <span
          className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
          style={{ background: PREMIUM.primary, boxShadow: `0 0 8px ${PREMIUM.primary}` }}
        />
      )}
    </div>
  );
}

export default function Radial02Page() {
  const [selected, setSelected] = useState<PremiumTool | null>(null);
  const focus = selected;

  const focusPeers = useMemo(() => (focus ? relationsOfPremium(focus.id) : []), [focus]);
  const connectedSet = useMemo(
    () => (focus ? new Set(PREMIUM_RELATIONS[focus.id] ?? []) : new Set<string>()),
    [focus],
  );

  const liveLines = useMemo(
    () =>
      REL_EDGES.filter(([a, b]) => focus && (a.id === focus.id || b.id === focus.id)),
    [focus],
  );
  const baseLines = useMemo(
    () => (focus ? REL_EDGES.filter(([a, b]) => !(a.id === focus.id || b.id === focus.id)) : REL_EDGES),
    [focus],
  );

  const ties = focus ? tiesOfPremium(focus.id) : [];

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#11151C' }}>
      {/* Magenta atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-28 h-[460px] w-[460px] rounded-full opacity-[0.17]"
          style={{ background: '#FF4F8B', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-40 -left-20 h-[440px] w-[440px] rounded-full opacity-[0.14]"
          style={{ background: '#5D315A', filter: 'blur(120px)' }} />
        <div className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,92,145,0.13) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 42%, transparent 30%, #11151C 100%)' }} />
      </div>

      <div className="relative px-5 py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: PREMIUM.primary }}>
              Radial System 02 · $1,000 Special · Premium Human Life Radial
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">CAN&apos;T DECIDE GPT <span style={{ color: PREMIUM.primary }}>/ $1000 / PREMIUMS</span></h1>
            <p className="mt-1 max-w-xl text-xs text-gray-500">
              {HUB.support} Ten live tools for the parts of life you don&apos;t want to constantly think about —
              same ecosystem as the Normal radial, a separate layer above it. Nothing here is decorative.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PREMIUM_FLAGSHIPS.map((id) => {
              const t = PREMIUM_TOOLS.find((x) => x.id === id);
              return t ? (
                <span key={id} className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] text-yellow-300">
                  <Crown className="h-3 w-3" /> {t.name}
                </span>
              ) : null;
            })}
            <Link
              href="/dashboard/radial"
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-gray-200 hover:bg-white/10"
            >
              <ArrowLeft className="h-3 w-3" /> Normal radial 01
            </Link>
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
          <div className="relative mx-auto aspect-square w-full max-w-[980px] xl:flex-1" style={{ maxHeight: '82vh', minHeight: 460 }}>
            {/* Pink rings */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute rounded-full border" style={{ borderColor: PREMIUM.ringOuter, inset: '41%' }} />
              <div className="absolute rounded-full border" style={{ borderColor: PREMIUM.ringInner, inset: '34.5%' }} />
              <div className="absolute rounded-full border border-dashed" style={{ borderColor: 'rgba(255,92,145,0.18)', inset: '30%' }} />
            </div>

            {/* Connection lines (pink) */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {baseLines.map(([a, b]) => {
                const pa = POS(a); const pb = POS(b);
                return (
                  <line
                    key={`${a.id}-${b.id}`}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={PREMIUM.lineSoft}
                    strokeWidth="0.3"
                  />
                );
              })}
              {focus &&
                liveLines.map(([a, b]) => {
                  const pa = POS(a); const pb = POS(b);
                  const d = `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;
                  const brighter = connectedSet.has(a.id) && connectedSet.has(b.id);
                  return (
                    <g key={`live-${a.id}-${b.id}`}>
                      <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                        stroke={brighter ? PREMIUM.lineActive : PREMIUM.lineMid} strokeWidth="0.6" opacity="0.9" />
                      <line
                        x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                        stroke="rgba(255,200,220,0.9)"
                        strokeWidth="0.5"
                        strokeDasharray="3 7"
                        className="radial-pulse"
                        style={{ animation: 'radialDash 1.5s linear infinite' }}
                      />
                      <circle r="1.15" fill={PREMIUM.primary}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={d} />
                      </circle>
                    </g>
                  );
                })}
            </svg>

            {/* Tool cards */}
            {PREMIUM_TOOLS.map((t) => (
              <PremiumCard
                key={t.id}
                tool={t}
                active={focus !== null && (focus.id === t.id || connectedSet.has(t.id))}
                dimmed={focus !== null}
                onSelect={setSelected}
              />
            ))}

            {/* Spokes */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {PREMIUM_TOOLS.map((t) => {
                const p = POS(t);
                return (
                  <line
                    key={`spoke-${t.id}`}
                    x1="50" y1="50" x2={p.x} y2={p.y}
                    stroke={focus?.id === t.id ? PREMIUM.primary : PREMIUM.ringOuter}
                    strokeWidth="0.22"
                    style={focus?.id === t.id ? { transition: 'stroke 0.2s' } : undefined}
                  />
                );
              })}
            </svg>

            {/* Hub — darker premium core */}
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div
                className="flex aspect-square items-center justify-center rounded-full text-center transition-shadow duration-300"
                style={{
                  width: 152,
                  background: HUB.gradient,
                  boxShadow: focus
                    ? `0 0 70px ${HUB.glow}, 0 0 28px rgba(185,70,120,0.6), inset 0 -12px 30px rgba(0,0,0,0.3)`
                    : `0 0 44px ${HUB.glow}, 0 0 20px rgba(185,70,120,0.45), inset 0 -12px 30px rgba(0,0,0,0.3)`,
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <div className="flex aspect-square items-center justify-center rounded-full"
                  style={{ width: 140, background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.16), transparent 55%)' }}>
                  <div>
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.25em] text-white/90">{HUB.name}</p>
                    <p className="mt-1 text-[17px] font-black tracking-[0.12em] text-white drop-shadow" style={{ color: '#FFE1EC' }}>
                      {HUB.tier} {HUB.tag}
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-[8px] font-semibold text-white/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-200 shadow-[0_0_6px_#fbcfe8]" /> LIVE
                    </p>
                    <p className="mx-auto mt-1 max-w-[126px] text-[7.5px] leading-tight text-white/80">{HUB.support}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector */}
          <div className="w-full shrink-0 rounded-2xl border border-white/5 bg-[#191F28]/90 p-4 xl:w-[320px]">
            {!focus ? (
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">Premium Inspector</p>
                <p className="mt-3 text-xs text-gray-400">
                  Tap any of the ten premium tools to trace its pink connection chain, review its scope and
                  open its workspace. Every tool is functional end-to-end — no decorative cards, no fake buttons.
                </p>
                <p className="mt-4 text-[10px] text-gray-600">
                  {PREMIUM_TOOLS.length} premium tools · {PREMIUM_FLAGSHIPS.length} flagship crowns · {REL_EDGES.length} pink chains
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl border"
                      style={{ background: PREMIUM.cardBg, borderColor: `${PREMIUM.primary}40` }}
                    >
                      {(() => { const Icon = ICONS[focus.icon] ?? Eye; return <Icon className="h-4 w-4" style={{ color: focus.accent }} />; })()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{focus.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: PREMIUM.secondary }}>
                        {FAMILY_LABELS[focus.family]} · <span style={{ color: PREMIUM.price }}>$1000 PLAN</span>
                        {focus.flagship && <span className="ml-1.5 text-[#FFC400]">· FLAGSHIP</span>}
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
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${PREMIUM.primary}, ${PREMIUM.secondary})` }}
                >
                  Open {focus.name} workspace <ArrowRight className="h-3.5 w-3.5" />
                </a>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  AI + Human control
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {['Suggest', 'Prepare', 'Ask', 'Execute'].map((m) => (
                    <span key={m} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] text-gray-300">
                      {m}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Premium chain ({focusPeers.length})
                </p>
                <div className="mt-2 space-y-1">
                  {focusPeers.length === 0 && <p className="text-xs text-gray-600">No premium peers mapped.</p>}
                  {focusPeers.map((p) => {
                    const PIcon = ICONS[p.icon] ?? Eye;
                    return (
                      <Link
                        key={p.id}
                        href={p.href}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5"
                      >
                        <PIcon className="h-3.5 w-3.5" style={{ color: p.accent }} />
                        <span className="flex-1 text-xs text-gray-300">{p.name}</span>
                        <Crown className="h-3 w-3 text-[#FFC400]" />
                        <ArrowRight className="h-3 w-3 text-gray-600 group-hover:text-gray-300" />
                      </Link>
                    );
                  })}
                </div>

                {ties.length > 0 && (
                  <>
                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Reaches into Radial 01
                    </p>
                    <div className="mt-2 space-y-1">
                      {ties.map((t) => (
                        <Link key={t.href} href={t.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                          <ArrowRight className="h-3 w-3 text-[#19C9D6]" />
                          <span className="text-xs text-gray-300">{t.label}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="mt-5 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Premium tools</p>
          <div className="mt-2 grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3" style={{ maxHeight: 320 }}>
            {PREMIUM_TOOLS.map((t) => {
              const Icon = ICONS[t.icon] ?? Eye;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: PREMIUM.cardBorder, background: PREMIUM.cardBg }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: t.accent }} />
                  <span className="flex-1 truncate text-xs text-gray-100">{t.name}</span>
                  <Crown className="h-3 w-3 text-[#FFC400]" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status line */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
          <p className="text-[10px] text-gray-500">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: PREMIUM.primary, boxShadow: `0 0 6px ${PREMIUM.primary}` }} />
            Premium hub live · {PREMIUM_TOOLS.length} premium tools · every workspace functional · {PREMIUM_FLAGSHIPS.length} flagships
          </p>
          <p className="text-[10px] text-gray-600">Tap a tool to open its workspace · select a tool to trace its pink chain</p>
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