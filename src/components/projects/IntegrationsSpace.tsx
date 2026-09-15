'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowRight, Braces, CalendarDays, Camera, Clapperboard, Cloud, Code2, Contact,
  Cpu, CreditCard, Database, FileAudio, FileText, Globe2, Mail, Maximize2, MessageSquare,
  Mic, Plug, Unplug, Volume2, Wifi, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';
import { useCollection } from '@/components/platform/data';
import { Btn, Input, Badge } from '@/components/platform/ui';
import type { Integration, ProviderConfig } from '@/lib/core/types';

/* ---------------- data shapes ---------------- */

interface Chan { id: string; name: string; category: string; connected: boolean; permissions?: string[]; note?: string; }
interface Prov { id: string; kind: string; provider: string; enabled: boolean; }
interface ProvStatus { kind: string; provider: string; usesBaseline: boolean; keyConfigured: boolean; model?: string; }

const KINDS = ['chat', 'content', 'image', 'video', 'voice', 'transcription', 'speech', 'code'];
const PROVIDERS = ['baseline', 'openai', 'anthropic', 'gemini', 'mistral', 'runway', 'midjourney', 'elevenlabs', 'resemblyzer'];

/* ---------------- world ---------------- */

const WORLD_W = 3400;
const WORLD_H = 1900;
const MIN_K = 0.2;
const MAX_K = 2.4;

const DIM_A = { w: 220, h: 76 };
const DIM_B = { w: 248, h: 92 };
const LANE_Y_A = 600;
const LANE_Y_B = 1230;
const X0 = 1120;
const STEP = 290;
const NCOLS = 8;

const ORB = { x: 690, w: 128, h: 64 };
const SYNC = { x: 690, y: 915 };

const CAT: Record<string, { icon: LucideIcon; color: string }> = {
  email: { icon: Mail, color: '#38bdf8' },
  social: { icon: Camera, color: '#f472b6' },
  calendar: { icon: CalendarDays, color: '#fbbf24' },
  payments: { icon: CreditCard, color: '#34d399' },
  crm: { icon: Contact, color: '#a78bfa' },
  database: { icon: Database, color: '#22d3ee' },
  cloud: { icon: Cloud, color: '#60a5fa' },
  dev: { icon: Code2, color: '#e879f9' },
  external: { icon: Globe2, color: '#fb923c' },
};

const KIND_META: Record<string, { icon: LucideIcon; color: string }> = {
  chat: { icon: MessageSquare, color: '#22d3ee' },
  content: { icon: FileText, color: '#60a5fa' },
  image: { icon: Camera, color: '#e879f9' },
  video: { icon: Clapperboard, color: '#f472b6' },
  voice: { icon: Mic, color: '#34d399' },
  transcription: { icon: FileAudio, color: '#a78bfa' },
  speech: { icon: Volume2, color: '#fbbf24' },
  code: { icon: Braces, color: '#38bdf8' },
};

/* ---------------- placement ---------------- */

interface PlacedChan extends Chan { x: number; y: number; }
interface PlacedProv extends Prov { x: number; y: number; }

const placeLine = <T,>(items: T[], y: number, dim: { w: number; h: number }): Array<T & { x: number; y: number }> => {
  const placed: Array<T & { x: number; y: number }> = [];
  let start = 0;
  let r = 0;
  while (start < items.length) {
    const inRow = Math.min(NCOLS, items.length - start);
    const rowY = y + r * (dim.h + 40);
    for (let i = 0; i < inRow; i += 1) {
      const c = r % 2 === 0 ? i : NCOLS - 1 - i;
      placed.push({ ...items[start + i], x: X0 + c * STEP, y: rowY });
    }
    start += inRow;
    r += 1;
  }
  return placed;
};

const zoneBox = (chips: Array<{ x: number; y: number }>, dim: { w: number; h: number }) => {
  if (chips.length === 0) return { x: 0, y: 0, w: 900, h: 320 };
  const xs = chips.map((c) => c.x);
  const ys = chips.map((c) => c.y);
  const minX = Math.min(...xs) - dim.w / 2 - 60;
  const maxX = Math.max(...xs) + dim.w / 2 + 60;
  const minY = Math.min(...ys) - dim.h / 2 - 64;
  const maxY = Math.max(...ys) + dim.h / 2 + 46;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

/* ---------------- sample (showcase) data ---------------- */

export const SAMPLE_CHANNELS: Chan[] = [
  { id: 'int-email', name: 'Email provider', category: 'email', connected: true, permissions: ['send', 'read'], note: 'inbox mapped · 12 inboxes' },
  { id: 'int-gmail', name: 'Gmail', category: 'email', connected: false, permissions: ['send', 'read'] },
  { id: 'int-instagram', name: 'Instagram', category: 'social', connected: true, permissions: ['publish'], note: 'publishing live' },
  { id: 'int-tiktok', name: 'TikTok', category: 'social', connected: false, permissions: ['publish'] },
  { id: 'int-cal', name: 'Google Calendar', category: 'calendar', connected: true, permissions: ['read', 'write'], note: 'syncs every 60s' },
  { id: 'int-stripe', name: 'Stripe', category: 'payments', connected: false, permissions: ['revenue', 'payouts'] },
  { id: 'int-whatsapp', name: 'WhatsApp Business', category: 'crm', connected: true, permissions: ['messages', 'contacts'], note: 'reply desk attached' },
  { id: 'int-files', name: 'Google Drive', category: 'cloud', connected: true, permissions: ['files', 'notes'], note: 'vault synced' },
];

export const SAMPLE_PROVIDERS: Prov[] = KINDS.map((k) => ({ id: `prv-${k}`, kind: k, provider: 'baseline', enabled: true }));
export const SAMPLE_STATUS: ProvStatus[] = [
  { kind: 'chat', provider: 'anthropic', usesBaseline: false, keyConfigured: true, model: 'claude-3-7-sonnet' },
  { kind: 'image', provider: 'openai', usesBaseline: false, keyConfigured: true, model: 'gpt-image-1' },
  { kind: 'code', provider: 'anthropic', usesBaseline: false, keyConfigured: true, model: 'claude-3-7-sonnet' },
  ...KINDS.filter((k) => !['chat', 'image', 'code'].includes(k)).map((k) => ({ kind: k, provider: 'baseline', usesBaseline: true, keyConfigured: false, model: '' as string })),
];

/* ---------------- component ---------------- */

export function IntegrationsSpace({
  channels,
  providers,
  providerStatus,
}: {
  channels?: Chan[];
  providers?: Prov[];
  providerStatus?: ProvStatus[];
}) {
  const live = channels === undefined && providers === undefined;

  const integrations = useCollection<Integration>('integrations', {});
  const providerConfigs = useCollection<ProviderConfig>('providerConfigs', {});
  const [stat, setStat] = useState<ProvStatus[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [token, setToken] = useState<Record<string, string>>({});
  const [openConn, setOpenConn] = useState<string | null>(null);

  useEffect(() => {
    if (!live) return;
    fetch('/api/providers')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStat(d.data.kinds ?? []); })
      .catch(() => {});
  }, [live]);

  const chans: PlacedChan[] = placeLine<Chan>(
    live
      ? (integrations.rows as Integration[]).map((i) => ({ id: i.id, name: i.name, category: i.category, connected: i.connected, permissions: i.permissions ?? [], note: (i as unknown as { note?: string }).note ?? i.error }))
      : (channels ?? SAMPLE_CHANNELS),
    LANE_Y_A,
    DIM_A
  );

  const provs: PlacedProv[] = placeLine<Prov>(
    live
      ? (providerConfigs.rows as ProviderConfig[]).map((c) => ({ id: c.id, kind: c.kind, provider: c.provider, enabled: c.enabled }))
      : (providers ?? SAMPLE_PROVIDERS),
    LANE_Y_B,
    DIM_B
  );

  const statusList = live ? stat : (providerStatus ?? SAMPLE_STATUS);

  const boxA = zoneBox(chans, DIM_A);
  const boxB = zoneBox(provs, DIM_B);

  const connect = async (c: PlacedChan) => {
    setBusy(c.id);
    try {
      const res = await fetch(`/api/integrations/${c.id}/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token[c.id] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Connect failed');
      setNote((n) => ({ ...n, [c.id]: d?.note ?? d?.connected ? 'Connected.' : 'Status updated.' }));
      setOpenConn(null);
      integrations.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (c: PlacedChan) => {
    if (!confirm(`Disconnect ${c.name}?`)) return;
    setBusy(c.id);
    try {
      const res = await fetch(`/api/integrations/${c.id}/disconnect`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Disconnect failed');
      }
      integrations.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveProvider = async (cfg: Prov, patch: Partial<Prov>) => {
    try {
      await fetch(`/api/db/providerConfigs/${cfg.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: cfg.kind, provider: patch.provider ?? cfg.provider, enabled: patch.enabled ?? cfg.enabled }),
      });
      providerConfigs.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  /* ---------------- view state ---------------- */

  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string; sub: string; tone: string } | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const spring = (ax: number, ay: number, bx: number, by: number): string => {
    const mx = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
  };

  const fitAll = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const k = Math.min(0.5, Math.max(MIN_K + 0.12, Math.min(rect.width / (WORLD_W * 1.06), rect.height / (WORLD_H * 1.06))));
    const w = WORLD_W * k;
    const h = WORLD_H * k;
    setView({ x: Math.max(0, (rect.width - w) / 2), y: Math.max(0, (rect.height - h) / 2), k });
  };

  useEffect(() => {
    fitAll();
    const ro = new ResizeObserver(() => fitAll());
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    if (target.closest('a,button,input,select')) return;
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

  const chansConsec = [];
  for (let i = 0; i < chans.length - 1; i += 1) chansConsec.push([chans[i], chans[i + 1]]);
  const provsConsec = [];
  for (let i = 0; i < provs.length - 1; i += 1) provsConsec.push([provs[i], provs[i + 1]]);

  const maxX = Math.max(ORB.x + 200, ...chans.map((c) => c.x), ...provs.map((c) => c.x));

  const catOf = (c: Chan) => CAT[c.category] ?? CAT.external;
  const kindOf = (k: string) => KIND_META[k] ?? KIND_META.chat;

  const chansTop = (chans[0]?.y ?? LANE_Y_A) - DIM_A.h / 2;
  const provsTop = (provs[0]?.y ?? LANE_Y_B) - DIM_B.h / 2;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#04050a]" style={{ height: 'calc(100vh - 190px)', minHeight: 520 }}>
      {/* legend */}
      <div className="absolute left-4 top-4 z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-[#080a11]/90 px-3 py-2 shadow-2xl backdrop-blur">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10">
          <Wifi className="h-3.5 w-3.5 text-cyan-300" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">The connected space</p>
          <p className="text-[9px] text-gray-500">channels in → AI out · one integrated system</p>
        </div>
      </div>

      {/* controls */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1.5">
        <button onClick={() => zoomAt(innerWidth / 2, innerHeight / 2, 1.12)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b13]/90 text-gray-300 transition hover:text-white" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.12)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b13]/90 text-gray-300 transition hover:text-white" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={fitAll} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b13]/90 text-gray-300 transition hover:text-white" aria-label="Fit all"><Maximize2 className="h-4 w-4" /></button>
      </div>

      {/* hint */}
      <div className="absolute bottom-4 left-4 z-40 text-[9px] text-gray-600">
        scroll to zoom in / out · drag empty space to move · hover a chip to read it · click a plug circle to connect or unplug
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
          {/* bg */}
          <div className="jbos-grid-bg absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '140px 140px' }} />
          <div className="pointer-events-none absolute -left-40 top-0 h-[900px] w-[1400px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 66%)' }} />
          <div className="pointer-events-none absolute left-[400px] top-[900px] h-[1000px] w-[1500px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 66%)' }} />

          <svg className="absolute inset-0" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
            <defs>
              <marker id="unChan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" /></marker>
              <marker id="unProv" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#a78bfa" /></marker>
            </defs>

            {/* zone A — channels */}
            <rect x={boxA.x} y={boxA.y} width={boxA.w} height={boxA.h} rx={20} fill="#22d3ee0d" stroke="#22d3ee40" strokeWidth="1.4" strokeDasharray="6 5" />
            <text x={boxA.x + 22} y={boxA.y + 26} fontSize="12" fontWeight={800} fill="#22d3ee" opacity={0.9} letterSpacing="1.5">CHANNELS &amp; SERVICES</text>
            <text x={boxA.x + 22} y={boxA.y + 44} fontSize="10" fill="#8b93a7" opacity={0.8}>{chans.filter((c) => c.connected).length} connected · route email, social, uploads through here</text>

            {/* zone B — providers */}
            <rect x={boxB.x} y={boxB.y} width={boxB.w} height={boxB.h} rx={20} fill="#a78bfa0d" stroke="#a78bfa40" strokeWidth="1.4" strokeDasharray="6 5" />
            <text x={boxB.x + 22} y={boxB.y + 26} fontSize="12" fontWeight={800} fill="#a78bfa" opacity={0.9} letterSpacing="1.5">AI PROVIDERS</text>
            <text x={boxB.x + 22} y={boxB.y + 44} fontSize="10" fill="#8b93a7" opacity={0.8}>engine assignments per generation kind · baseline until a live key is set</text>

            {/* trunk — channels orb → engine orb */}
            <path d={spring(ORB.x, LANE_Y_A + ORB.h / 2, ORB.x, LANE_Y_B - ORB.h / 2)} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 8" strokeOpacity="0.7" />

            {/* spines above each lane + drops into every chip */}
            <path d={`M ${ORB.x} ${LANE_Y_A - 42} H ${maxX}`} stroke="#22d3ee" strokeWidth="1.6" strokeOpacity="0.55" />
            <path d={`M ${ORB.x} ${LANE_Y_A} V ${LANE_Y_A - 42}`} stroke="#22d3ee" strokeWidth="1.6" strokeOpacity="0.55" />
            <path d={`M ${ORB.x} ${LANE_Y_B - 42} H ${maxX}`} stroke="#a78bfa" strokeWidth="1.6" strokeOpacity="0.55" />
            <path d={`M ${ORB.x} ${LANE_Y_B} V ${LANE_Y_B - 42}`} stroke="#a78bfa" strokeWidth="1.6" strokeOpacity="0.55" />
            {chans.map((c) => (
              <path key={`d-${c.id}`} d={`M ${c.x} ${LANE_Y_A - 42} V ${chansTop}`} stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="3 5" />
            ))}
            {provs.map((p) => (
              <path key={`d-${p.id}`} d={`M ${p.x} ${LANE_Y_B - 42} V ${provsTop}`} stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="3 5" />
            ))}

            {/* the lines — channels in a line, providers in a line */}
            {chansConsec.map(([a, b], i) => (
              <path key={`c-${i}`} d={spring(a.x, a.y, b.x, b.y)} fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" markerEnd="url(#unChan)" />
            ))}
            {provsConsec.map(([a, b], i) => (
              <path key={`p-${i}`} d={spring(a.x, a.y, b.x, b.y)} fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.85" markerEnd="url(#unProv)" />
            ))}

            {/* engine → first provider */}
            {provs.length > 0 && (
              <path d={spring(ORB.x + ORB.w / 2, LANE_Y_B - ORB.h / 2, provs[0].x - DIM_B.w / 2, provs[0].y)} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeDasharray="5 5" strokeOpacity="0.7" markerEnd="url(#unProv)" />
            )}
          </svg>

          {/* orb — channels */}
          <div
            className="absolute z-20 flex items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br from-cyan-400/15 to-transparent text-center"
            style={{ left: ORB.x - ORB.w / 2, top: LANE_Y_A - ORB.h / 2, width: ORB.w, height: ORB.h, borderColor: '#22d3ee55', boxShadow: '0 0 34px rgba(34,211,238,0.28)' }}
          >
            <Plug className="h-4 w-4 text-cyan-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Channels</span>
          </div>

          {/* orb — engine */}
          <div
            className="absolute z-20 flex items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br from-violet-400/15 to-transparent text-center"
            style={{ left: ORB.x - ORB.w / 2, top: LANE_Y_B - ORB.h / 2, width: ORB.w, height: ORB.h, borderColor: '#a78bfa55', boxShadow: '0 0 34px rgba(167,139,250,0.28)' }}
          >
            <Cpu className="h-4 w-4 text-violet-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Engine</span>
          </div>

          {/* sync node on the trunk */}
          <div
            className="absolute z-20 flex flex-col items-center justify-center rounded-full border bg-[#0b0b13]/95 text-center"
            style={{ left: SYNC.x - 52, top: SYNC.y - 52, width: 104, height: 104, borderColor: '#FFD70055', boxShadow: '0 0 30px rgba(255,215,0,0.18)' }}
          >
            <Activity className="h-4 w-4 text-amber-300" />
            <span className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-white">SYNC</span>
            <span className="mt-0.5 flex items-center gap-1 text-[7px] font-bold uppercase text-emerald-300"><span className="h-1 w-1 animate-pulse rounded-full bg-emerald-300" /> on</span>
          </div>

          {/* channel chips */}
          {chans.map((c) => {
            const meta = catOf(c);
            const Icon = meta.icon;
            const open = openConn === c.id;
            return (
              <div
                key={c.id}
                className="absolute z-30"
                style={{ left: c.x - DIM_A.w / 2, top: c.y - DIM_A.h / 2, width: DIM_A.w, height: DIM_A.h }}
                onMouseEnter={() => setHover({ x: c.x, y: c.y, name: c.name, sub: `${c.category} · ${(c.permissions ?? []).join(', ')}`, tone: c.connected ? 'connected' : 'open' })}
                onMouseLeave={() => setHover((h) => (h && h.name === c.name ? null : h))}
              >
                <span
                  className="absolute inset-0 rounded-xl border"
                  style={{
                    borderColor: c.connected ? 'rgba(52,211,153,0.45)' : 'rgba(255,255,255,0.14)',
                    background: c.connected ? 'rgba(16,22,20,0.92)' : 'rgba(13,13,18,0.9)',
                    boxShadow: c.connected ? '0 0 16px rgba(52,211,153,0.22), 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.45)',
                  }}
                />
                <span className="absolute inset-x-2.5 top-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: `${meta.color}44`, background: `${meta.color}14` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">{c.name}</span>
                  <span
                    className="rounded border px-1 py-px text-[6.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ borderColor: c.connected ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.16)', color: c.connected ? '#34d399' : '#7a8194' }}
                  >
                    {c.connected ? 'live' : 'open'}
                  </span>
                </span>
                <span className="absolute inset-x-2.5 top-[58%] truncate text-[9px] text-gray-500">
                  {c.category} · {(c.permissions ?? []).slice(0, 2).join(', ') || (c.note ?? 'no permissions')}
                </span>
                <button
                  onClick={() => (c.connected ? disconnect(c) : setOpenConn(c.id))}
                  disabled={busy === c.id}
                  title={c.connected ? 'Disconnect' : 'Connect'}
                  aria-label={c.connected ? `Disconnect ${c.name}` : `Connect ${c.name}`}
                  className="absolute -right-3 top-1/2 z-30 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-[#0b0b13] transition hover:scale-110"
                  style={{ borderColor: c.connected ? 'rgba(232,121,249,0.5)' : 'rgba(34,211,238,0.5)', boxShadow: c.connected ? '0 0 12px rgba(232,121,249,0.3)' : '0 0 12px rgba(34,211,238,0.25)' }}
                >
                  {busy === c.id ? <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white/40 border-t-white" /> : c.connected ? <Unplug className="h-3 w-3 text-fuchsia-300" /> : <Plug className="h-3 w-3 text-cyan-300" />}
                </button>
                {note[c.id] ? (
                  <span className="absolute -bottom-5 left-0 whitespace-nowrap text-[8px] text-cyan-300">{note[c.id]}</span>
                ) : null}
                {open && (
                  <div
                    className="absolute left-full top-0 z-40 ml-2 w-44 rounded-xl border border-cyan-400/30 bg-[#0b0b13]/95 p-2.5 shadow-2xl"
                    onMouseEnter={() => setHover(null)}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300">Connect {c.name}</p>
                    <Input value={token[c.id] ?? ''} onChange={(v) => setToken((t) => ({ ...t, [c.id]: v }))} placeholder="token (optional)" className="mt-1.5 !py-1 text-[11px]" />
                    <div className="mt-2 flex items-center gap-1.5">
                      <Btn kind="solid" small onClick={() => connect(c)}>{busy === c.id ? 'Connecting…' : 'Connect'}</Btn>
                      <Btn kind="ghost" small onClick={() => setOpenConn(null)}>Cancel</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* provider chips */}
          {provs.map((p) => {
            const meta = kindOf(p.kind);
            const Icon = meta.icon;
            const st = statusList.find((s) => s.kind === p.kind);
            const liveEngine = st && !st.usesBaseline;
            return (
              <div
                key={p.id}
                className="absolute z-30"
                style={{ left: p.x - DIM_B.w / 2, top: p.y - DIM_B.h / 2, width: DIM_B.w, height: DIM_B.h }}
                onMouseEnter={() => setHover({ x: p.x, y: p.y, name: `${p.kind} engine`, sub: liveEngine ? `live on ${st.provider}${st.model ? ' · ' + st.model : ''}` : 'baseline simulator · set a live key in Settings → AI provider', tone: p.enabled ? (liveEngine ? 'connected' : 'open') : 'open' })}
                onMouseLeave={() => setHover((h) => (h && h.name === `${p.kind} engine` ? null : h))}
              >
                <span
                  className="absolute inset-0 rounded-xl border"
                  style={{
                    borderColor: liveEngine ? 'rgba(52,211,153,0.45)' : p.enabled ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.12)',
                    background: 'rgba(11,11,18,0.9)',
                    boxShadow: liveEngine ? '0 0 16px rgba(52,211,153,0.22), 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.45)',
                  }}
                />
                <span className="absolute inset-x-2.5 top-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: `${meta.color}44`, background: `${meta.color}14` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </span>
                  <span className="flex-1 text-[11px] font-bold capitalize text-white">{p.kind}</span>
                  <button
                    onClick={() => live && saveProvider(p, { enabled: !p.enabled })}
                    className={`relative h-5 w-9 rounded-full transition-colors ${live ? 'cursor-pointer' : ''} ${p.enabled ? (liveEngine ? 'bg-emerald-500' : 'bg-violet-500') : 'bg-white/10'}`}
                    aria-label={`Toggle ${p.kind} ${p.enabled ? 'off' : 'on'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${p.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </span>
                <span className="absolute inset-x-2.5 top-[46%] flex items-center gap-1.5">
                  <select
                    value={p.provider}
                    onChange={(e) => live && saveProvider(p, { provider: e.target.value })}
                    disabled={!live}
                    className="w-full rounded border border-white/10 bg-[#0b0b13] px-1.5 py-0.5 text-[9px] text-gray-300 outline-none focus:border-violet-400/50 disabled:opacity-60"
                  >
                    {PROVIDERS.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                </span>
                <span className="absolute inset-x-2.5 bottom-1.5 flex items-center justify-between">
                  <span className="text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: liveEngine ? '#34d399' : '#7a8194' }}>
                    {liveEngine ? `${st.provider} · live` : 'baseline'}
                  </span>
                  <Badge tone={p.enabled ? 'green' : 'gray'}>{p.enabled ? 'on' : 'off'}</Badge>
                </span>
              </div>
            );
          })}

          {/* terminal */}
          <Link
            href="/dashboard/toolkits"
            className="absolute z-20 flex items-center gap-2 rounded-2xl border border-[#FFD700]/40 bg-gradient-to-r from-[#FFD700]/10 to-[#a78bfa]/10 px-5 py-3 transition hover:bg-white/5"
            style={{ left: 1630, top: 1700, boxShadow: '0 0 40px rgba(255,215,0,0.12)' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_14px_rgba(255,215,0,0.5)]">
              <Cpu className="h-4 w-4 text-[#1a0a2e]" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white">The whole system</span>
              <span className="flex items-center gap-1 text-[9px] text-gray-400">every tool connected in one order <ArrowRight className="h-3 w-3" /></span>
            </span>
          </Link>

          {/* hover card */}
          {hover && (
            <div
              className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0b13]/95 px-3 py-2 shadow-2xl backdrop-blur"
              style={{ left: hover.x, top: hover.y - (live ? 40 : 40), maxWidth: 300 }}
            >
              <p className="text-[11px] font-bold text-white">{hover.name}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: hover.tone === 'connected' ? '#34d399' : '#9aa0b0' }}>
                {hover.tone === 'connected' ? 'connected · syncing' : hover.tone}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-gray-400">{hover.sub}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}