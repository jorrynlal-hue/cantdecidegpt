'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waypoints, Cpu, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit,
  ListChecks, Activity, Workflow, Globe2, Database, Sparkles, Monitor, Truck,
  Wallet, Users2, Megaphone, Heart, Target, BarChart3, FileText,
  FolderKanban, CalendarClock, Handshake, UserPlus, Calculator, Search,
  ClipboardList, Clapperboard, HeartCrack, FlaskConical, Repeat, Scale,
  MessageSquareOff, Moon, Radar, Briefcase, Ghost, LifeBuoy, Microscope,
  FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck, Wrench,
  Eye, Bell, Shield, Inbox,
  Crown, X, LayoutGrid, Link as LinkIcon, ArrowRight, type LucideIcon,
} from 'lucide-react';
import { HUB_TOOLS, RESTORED_TOOLS, ZONE_LABELS, PREMIUM_IDS, assertHub, assertAllTools, hubTotal, type HubTool, type RestoredTool } from '@/lib/hub';

const ICONS: Record<string, LucideIcon> = {
  Waypoints, Cpu, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit,
  ListChecks, Activity, Workflow, Globe2, Database, Sparkles, Monitor, Truck,
  Wallet, LinkIcon, Users2, Megaphone, Heart, Target, BarChart3, FileText,
  FolderKanban, CalendarClock, Handshake, UserPlus, Calculator, Search,
  ClipboardList, Clapperboard, HeartCrack, FlaskConical, Repeat, Scale,
  MessageSquareOff, Moon, Radar, Briefcase, Ghost, LifeBuoy, Microscope,
  FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck, Wrench,
  Eye, Bell, Shield, Inbox,
};

function pos(tool: HubTool) {
  const angle = (tool.clock / 12) * Math.PI * 2 - Math.PI / 2;
  const r = tool.layer === 'outer' ? 41 : 29;
  return { x: 50 + Math.cos(angle) * r, y: 50 + Math.sin(angle) * r };
}

function dayLabel(clock: number): string {
  const h = Math.floor(clock);
  const m = Math.round((clock - h) * 60);
  return `${h === 12 ? 12 : h}:${String(m === 0 ? 0 : m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function CoreHubPage() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const c = assertHub();
    if (c.total !== 24 || c.premium !== 10 || c.standard !== 14) {
      console.error('HUB ASSERTION FAILED', c);
    }
    const a = assertAllTools();
    if (a.radialTotal !== 24 || a.restoredTotal !== 31 || a.allTotal !== 55) {
      console.error('ALL-TOOLS ASSERTION FAILED', a);
    }
    const t = setTimeout(() => setBooted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const premium = (id: string) => PREMIUM_IDS.has(id);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
      {/* Minimal system status strip */}
      <div className="mb-4 flex w-full max-w-[820px] items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${booted ? 'bg-emerald-400' : 'bg-emerald-400/40'}`} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Imprint Operating System</p>
        </div>
        <button
          onClick={() => setShowList(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/10"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          All {hubTotal()} tools
        </button>
      </div>

      {/* Human + AI coworking banner */}
      <Link
        href="/dashboard/humans"
        className="mb-4 flex w-full max-w-[820px] items-center justify-between rounded-xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent px-4 py-3 transition-colors hover:border-indigo-400/60"
      >
        <div>
          <p className="text-xs font-bold text-indigo-200">Human + AI co-working — human integrations are live</p>
          <p className="mt-0.5 text-[11px] text-gray-400">Human workspace with live presence and a generative insight board.</p>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Radial stage — scrollable on very small screens instead of hiding tools */}
      <div className="relative w-full overflow-x-auto overflow-y-visible pb-4">
        <div
          className="relative mx-auto aspect-square"
          style={{
            width: 'max(430px, min(92%, 820px, 72vh))',
            '--c': 'max(430px, min(92%, 820px, 72vh))',
          } as React.CSSProperties}
        >
          {/* Ambient center glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.16), rgba(56,189,248,0.04) 55%, transparent 72%)', filter: 'blur(6px)' }}
          />

          {/* Orbital rings */}
          {[58, 82, 97].map((sz, i) => (
            <div
              key={sz}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${sz}%`,
                height: `${sz}%`,
                border: i === 2 ? '1px dashed rgba(99,102,241,0.20)' : '1px solid rgba(99,102,241,0.16)',
                boxShadow: i === 0 ? '0 0 30px rgba(56,189,248,0.05) inset' : undefined,
              }}
            />
          ))}

          {/* Connection lines CORE → tools */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g style={{ animation: 'corePulse 6s ease-in-out infinite' }}>
              {HUB_TOOLS.map((tool) => {
                const { x, y } = pos(tool);
                const isActive = pathname === tool.href || (tool.href !== '/dashboard' && pathname.startsWith(tool.href));
                const isHover = hovered === tool.id;
                const isGold = premium(tool.id);
                const color = isGold && (isActive || isHover) ? 'rgb(245,158,11)' : isActive || isHover ? 'rgb(56,189,248)' : isGold ? 'rgba(245,158,11,0.28)' : 'rgba(99,102,241,0.18)';
                return (
                  <line
                    key={tool.id}
                    x1={50}
                    y1={50}
                    x2={x}
                    y2={y}
                    stroke={color}
                    strokeWidth={isActive || isHover ? 0.32 : 0.16}
                    opacity={hovered && !isHover && !isActive ? 0.35 : 1}
                  />
                );
              })}
            </g>
          </svg>
          <style>{`@keyframes corePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>

          {/* CORE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{
              width: 'clamp(120px, 19%, 154px)',
              height: 'clamp(120px, 19%, 154px)',
              background: 'radial-gradient(circle at 30% 25%, rgba(56,189,248,0.95), rgba(14,116,144,0.9) 45%, rgba(4,32,54,0.98) 80%)',
              border: '1px solid rgba(125,211,252,0.35)',
              boxShadow: '0 0 40px rgba(56,189,248,0.35), 0 0 90px rgba(34,211,238,0.18), inset 0 0 30px rgba(224,242,254,0.10)',
            }}
          >
            <div className="text-center leading-none">
              <p className="text-[clamp(8px,0.0145em,11px)] font-semibold uppercase tracking-[0.34em] text-cyan-100/90" style={{ fontSize: 'clamp(8px, calc(var(--c) * 0.013), 11px)' }}>
                Imprint
              </p>
              <p className="mt-1 text-[clamp(26px,0.05em,42px)] font-black tracking-tight text-white" style={{ fontSize: 'clamp(24px, calc(var(--c) * 0.048), 40px)', textShadow: '0 0 24px rgba(103,232,249,0.55)' }}>
                CORE
              </p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-[clamp(7px,0.013em,11px)] font-bold uppercase tracking-[0.24em] text-emerald-300" style={{ fontSize: 'clamp(7px, calc(var(--c) * 0.012), 11px)' }}>
                <span className={`h-1.5 w-1.5 rounded-full ${booted ? 'animate-pulse bg-emerald-300' : 'bg-emerald-300/50'}`} />
                LIVE
              </p>
              <p className="mt-1.5 hidden text-[6px] font-medium uppercase tracking-[0.18em] text-cyan-100/60 sm:block" style={{ fontSize: 'clamp(6px, calc(var(--c) * 0.009), 9px)' }}>
                Business Intelligence Active
              </p>
            </div>
          </motion.div>

          {/* Tool cards */}
          {HUB_TOOLS.map((tool, idx) => {
            const { x, y } = pos(tool);
            const Icon = ICONS[tool.icon] ?? Settings;
            const isGold = premium(tool.id);
            const isActive = pathname === tool.href || (tool.href !== '/dashboard' && pathname.startsWith(tool.href));
            const isHover = hovered === tool.id;

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: booted ? idx * 0.022 : 0, duration: 0.4, ease: 'easeOut' }}
                className="absolute z-10"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', width: 'clamp(48px, 12.5%, 96px)' }}
                onMouseEnter={() => setHovered(tool.id)}
                onMouseLeave={() => setHovered((h) => (h === tool.id ? null : h))}
              >
                <Link href={tool.href} aria-label={`Open ${tool.name}`} className="group relative block">
                  {/* Gold orbital ring for premium tools */}
                  {isGold && (
                    <span
                      className="pointer-events-none absolute rounded-full transition-all duration-300"
                      style={{
                        inset: -3,
                        border: '1px solid rgba(245,158,11,0.45)',
                        boxShadow: isHover || isActive ? '0 0 16px rgba(245,158,11,0.5)' : '0 0 6px rgba(245,158,11,0.18)',
                      }}
                    />
                  )}
                  {/* Crown badge */}
                  {isGold && (
                    <span
                      className={`pointer-events-none absolute right-0 top-0 z-20 transition-all duration-300 ${isHover ? 'scale-110' : ''}`}
                      style={{ filter: `drop-shadow(0 0 ${isHover ? 7 : 3}px rgba(251,191,36,0.9))` }}
                    >
                      <Crown className="h-[0.62em] w-[0.62em] fill-amber-300 text-amber-400" style={{ fontSize: 'clamp(10px, calc(var(--c) * 0.0165), 16px)' }} />
                    </span>
                  )}
                  {/* The card */}
                  <div
                    className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-center transition-all duration-300 ${
                      isActive
                        ? 'border-sky-400/60 bg-sky-400/10 shadow-[0_0_22px_rgba(56,189,248,0.30)]'
                        : isHover
                        ? 'border-white/25 bg-[#14141f] shadow-[0_0_22px_rgba(56,189,248,0.22)]'
                        : isGold
                        ? 'border-amber-300/20 bg-[#0f0f17]'
                        : 'border-white/10 bg-[#0e0e16]'
                    } group-hover:border-white/25`}
                    style={{
                      boxShadow: isHover ? '0 12px 30px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.30)',
                    }}
                  >
                    <Icon
                      className={`transition-all duration-300 ${isGold ? 'text-amber-200' : 'text-sky-300'} ${isHover ? 'scale-110' : ''}`}
                      style={{ width: 'clamp(16px, calc(var(--c) * 0.03), 26px)', height: 'clamp(16px, calc(var(--c) * 0.03), 26px)' }}
                    />
                    <span
                      className="mt-1.5 block w-full truncate px-1 font-semibold text-white"
                      style={{ fontSize: 'clamp(8px, calc(var(--c) * 0.0155), 13px)' }}
                    >
                      {tool.name}
                    </span>
                    {isGold && (
                      <span
                        className="block w-full truncate px-1 font-medium uppercase tracking-[0.14em] text-amber-300/90"
                        style={{ fontSize: 'clamp(5px, calc(var(--c) * 0.009), 8px)', marginTop: '1px' }}
                      >
                        Pro Exclusive
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Tooltip preview */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="pointer-events-none absolute z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0c0c14]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
                style={{ left: `${pos(HUB_TOOLS.find((t) => t.id === hovered)!).x}%`, top: `${pos(HUB_TOOLS.find((t) => t.id === hovered)!).y - 22}%` }}
              >
                {(() => {
                  const t = HUB_TOOLS.find((x) => x.id === hovered)!;
                  return (
                    <>
                      <p className={`text-[11px] font-bold ${premium(t.id) ? 'text-amber-200' : 'text-white'}`}>{t.name}</p>
                      {premium(t.id) && <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-400">PRO EXCLUSIVE</p>}
                      <p className="mt-1 max-w-[180px] text-[10px] leading-snug text-gray-400">{t.blurb}</p>
                      <p className="mt-1 text-[8px] uppercase tracking-wider text-gray-600">{dayLabel(t.clock)} · connected to CORE</p>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Semantics */}
          <p className="pointer-events-none absolute bottom-[3%] left-[3%] text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
            Delivery
          </p>
          <p className="pointer-events-none absolute bottom-[3%] right-[3%] text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
            Revenue
          </p>
        </div>
      </div>

      {/* Secondary expandable tool list (mobile + anytime) */}
      <AnimatePresence>
        {showList && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowList(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[300px] max-w-[86vw] flex-col border-l border-white/10 bg-[#0c0c14]"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">All {hubTotal()} tools</p>
                <button onClick={() => setShowList(false)} className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">Core System</p>
                <div className="divide-y divide-white/5">
                  {HUB_TOOLS.map((tool) => {
                    const Icon = ICONS[tool.icon] ?? Settings;
                    const isGold = premium(tool.id);
                    const isActive = pathname === tool.href || (tool.href !== '/dashboard' && pathname.startsWith(tool.href));
                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        onClick={() => setShowList(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5 ${isActive ? 'bg-sky-500/10' : ''}`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isGold ? 'text-amber-300' : 'text-sky-300'}`} />
                        <span className={`flex-1 truncate text-xs font-medium ${isActive ? 'text-sky-300' : 'text-gray-200'}`}>{tool.name}</span>
                        {isGold ? (
                          <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
                            <Crown className="h-3 w-3 fill-amber-300/60 text-amber-300" /> Pro
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider text-gray-600">System</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
                {(Object.keys(ZONE_LABELS) as (keyof typeof ZONE_LABELS)[]).map((zone) => (
                  <div key={zone}>
                    <p className="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">
                      {ZONE_LABELS[zone]} · Restored
                    </p>
                    <div className="divide-y divide-white/5">
                      {RESTORED_TOOLS.filter((t) => t.zone === zone).map((tool: RestoredTool) => {
                        const Icon = ICONS[tool.icon] ?? Settings;
                        const isActive = pathname === tool.href || pathname.startsWith(tool.href);
                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            onClick={() => setShowList(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5 ${isActive ? 'bg-sky-500/10' : ''}`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${zone === 'business' ? 'text-violet-300' : 'text-teal-300'}`} />
                            <span className={`flex-1 truncate text-xs font-medium ${isActive ? 'text-sky-300' : 'text-gray-200'}`}>{tool.name}</span>
                            <span className="text-[9px] uppercase tracking-wider text-gray-600">Restored</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}