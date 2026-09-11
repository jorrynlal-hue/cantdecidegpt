'use client';

import { useEffect, useMemo, useRef, useState, type SVGProps } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Waypoints, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit,
  Activity, Workflow, Globe2, Database, Sparkles, Monitor, Truck, Wallet,
  Users2, Megaphone, BarChart3, FileText, Link as LinkIcon, Handshake,
  UserPlus, Calculator, Search, ClipboardList, Clapperboard, HeartCrack,
  FlaskConical, Repeat, Scale, MessageSquareOff, Moon, Radar, Briefcase,
  Ghost, LifeBuoy, Microscope, FileCheck, PiggyBank, ShoppingBag, Home,
  Compass, CalendarCheck, Wrench, Eye, Bell, Shield, Inbox, Cpu, Mic, MicOff,
  Zap, ArrowDown, Volume2, VolumeX, type LucideIcon,
} from 'lucide-react';
import { HUB_TOOLS, RESTORED_TOOLS, ZONE_LABELS, ALL_TOOLS, assertHub, assertAllTools, hubTotal, type HubTool, type RestoredTool } from '@/lib/hub';
import { collection } from '@/lib/core/client';

const ICONS: Record<string, LucideIcon> = {
  Waypoints, Gauge, ShieldCheck, KeyRound, Settings, Users, BrainCircuit,
  Activity, Workflow, Globe2, Database, Sparkles, Monitor, Truck, Wallet,
  LinkIcon, Users2, Megaphone, BarChart3, FileText,
  Handshake, UserPlus, Calculator, Search,
  ClipboardList, Clapperboard, HeartCrack, FlaskConical, Repeat, Scale,
  MessageSquareOff, Moon, Radar, Briefcase, Ghost, LifeBuoy, Microscope,
  FileCheck, PiggyBank, ShoppingBag, Home, Compass, CalendarCheck, Wrench,
  Eye, Bell, Shield, Inbox,
};

type Row = Record<string, unknown>;
type ProbeKey = 'tasks' | 'approvals' | 'emails' | 'deals' | 'invoices' | 'notifications' | 'executions';

const str = (r: Row, k: string) => String(r[k] ?? '').toLowerCase();

const DONE_STATUS = new Set(['completed', 'cancelled', 'canceled', 'done', 'archived', 'closed']);
const CLOSED_STAGE = new Set(['won', 'lost', 'closed', 'archived']);

const PROBES: { key: ProbeKey; collectionName: string; label: string; active: (r: Row) => boolean }[] = [
  { key: 'tasks', collectionName: 'tasks', label: 'open tasks', active: (r) => !DONE_STATUS.has(str(r, 'status')) },
  { key: 'approvals', collectionName: 'approvals', label: 'approvals waiting', active: (r) => str(r, 'status') === 'pending' || r.decidedAt == null },
  { key: 'emails', collectionName: 'emails', label: 'mail needs your hand', active: (r) => r.read === false || ['unread', 'pending', 'draft', 'failed'].includes(str(r, 'status')) },
  { key: 'deals', collectionName: 'deals', label: 'deals in play', active: (r) => !CLOSED_STAGE.has(str(r, 'stage') || str(r, 'status')) },
  { key: 'invoices', collectionName: 'invoices', label: 'money to collect', active: (r) => { const s = str(r, 'status'); return s !== '' && !['paid', 'void', 'cancelled', 'canceled'].includes(s); } },
  { key: 'notifications', collectionName: 'notifications', label: 'unread alerts', active: (r) => r.read === false || str(r, 'status') === 'unread' },
  { key: 'executions', collectionName: 'executions', label: 'flows to check', active: (r) => ['failed', 'error', 'running', 'pending', 'queued'].includes(str(r, 'status')) },
];

const PROBE_TOOL_MAP: Record<ProbeKey, string[]> = {
  tasks: ['errands', 'nudge', 'rescuebutton', 'weeklyops', 'shadowfounder', 'weeklyrecap', 'performer', 'hr'],
  approvals: ['executive', 'operations', 'rescuebutton'],
  emails: ['inbox', 'connect', 'shadowfounder'],
  deals: ['closer', 'finance', 'weeklyops', 'shadowfounder', 'decaydetect', 'reports'],
  invoices: ['finance', 'closer', 'bookkeeper', 'moneypeace', 'autorenego'],
  notifications: ['connect', 'inbox'],
  executions: ['automation', 'performer', 'ghostmode'],
};

const CANVAS_W = 1560;
const CANVAS_H = 1760;
const NODE_W = 150;
const NODE_H = 96;

interface LaneDef {
  id: string;
  label: string;
  step: string;
  tagline: string;
  color: string;
  y: number;
  tools: string[];
}

const LANES: LaneDef[] = [
  { id: 'intelligence', label: 'Intelligence & Decisions', step: 'STEP 01 · READ', tagline: 'live state of the business, read first', color: '#22d3ee', y: 140, tools: ['executive', 'insights', 'analytics', 'reports', 'attribution'] },
  { id: 'govern', label: 'Governance & Trust', step: 'STEP 02 · SAFEGUARD', tagline: 'who can act and what is protected', color: '#a78bfa', y: 400, tools: ['admin', 'security', 'settings', 'team', 'ai'] },
  { id: 'operate', label: 'Operations & Execution', step: 'STEP 03 · EXECUTE', tagline: 'the work pipeline that actually runs', color: '#34d399', y: 660, tools: ['operations', 'automation', 'integrations', 'memory', 'performer'] },
  { id: 'revenue', label: 'Revenue & Delivery', step: 'STEP 04 · DELIVER', tagline: 'money and outcomes in the door', color: '#fbbf24', y: 920, tools: ['finance', 'website', 'marketing', 'hr', 'connect'] },
];

const laneChipX = (i: number, n: number) => {
  const inner = 1240 - 48 - NODE_W;
  const d = inner / (Math.max(n, 1) - 1 || 1);
  return 170 + 24 + NODE_W / 2 + i * d;
};

const ZONE_TOOLS: { id: string; label: string; zone: string; x: number; w: number; y: number; toolIds: string[] }[] = [
  { id: 'biz', label: 'Business Operators', zone: 'business', x: 170, w: 760, y: 1180, toolIds: RESTORED_TOOLS.filter((t) => t.zone === 'business').map((t) => t.id) },
  { id: 'life', label: 'Personal Life', zone: 'life', x: 980, w: 560, y: 1180, toolIds: RESTORED_TOOLS.filter((t) => t.zone === 'life').map((t) => t.id) },
];

const zoneChipPos = (zoneIdx: number, i: number) => {
  const zone = ZONE_TOOLS[zoneIdx];
  const cols = zone.id === 'biz' ? 6 : 4;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: zone.x + 28 + col * 112, y: zone.y + 70 + row * 112, w: 104, h: 96 };
};

const FLOW_GROUPS = [
  { id: 'intelligence', label: 'Intelligence', toolIds: LANES[0].tools },
  { id: 'govern', label: 'Governance', toolIds: LANES[1].tools },
  { id: 'operate', label: 'Operations', toolIds: LANES[2].tools },
  { id: 'revenue', label: 'Revenue', toolIds: LANES[3].tools },
  { id: 'business', label: 'Business', toolIds: ZONE_TOOLS[0].toolIds },
  { id: 'life', label: 'Life', toolIds: ZONE_TOOLS[1].toolIds },
];

function ting() {
  try {
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    void ctx.resume();
    const freq = [1174.66, 1567.98];
    freq.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.17;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch {
    /* sound is best-effort until the browser allows audio */
  }
}

function itemTs(v: string): number {
  if (/^\d+(\.\d+)?$/.test(v.trim())) {
    const n = Number(v);
    if (!isNaN(n)) return n > 1e12 ? n : n * 1000;
  }
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

function agoStr(iso: string): string {
  if (!iso) return '';
  const t = itemTs(iso);
  if (!t) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sampleSparkline(rows: Row[]): number[] {
  const now = Date.now();
  const buckets = new Array(12).fill(0) as number[];
  for (const r of rows) {
    const ts = new Date(str(r, 'createdAt') || str(r, 'updatedAt')).getTime();
    if (!ts || isNaN(ts)) continue;
    const slot = Math.min(11, Math.floor((now - ts) / (6 * 3600 * 1000)));
    buckets[11 - slot] += 1;
  }
  return buckets;
}

interface VoiceCommand {
  match: (t: string) => string | null;
  href: string;
}

const VOICE_ROUTES: VoiceCommand[] = [
  { match: (t) => (/^(go to )?command( center)?/.test(t) || /dashboard/.test(t) ? 'command' : null), href: '/dashboard' },
  { match: (t) => (/calendar|schedule|my week/.test(t) ? 'calendar' : null), href: '/dashboard/calendar' },
  { match: (t) => (/approval/.test(t) ? 'approvals' : null), href: '/dashboard/operations/approvals' },
  { match: (t) => (/plans|billing|upgrade/.test(t) ? 'plans' : null), href: '/dashboard/plans' },
  { match: (t) => (/setting/.test(t) ? 'settings' : null), href: '/dashboard/settings' },
  { match: (t) => /team|people|members/.test(t) ? 'team' : null, href: '/dashboard/team' },
  { match: (t) => /security|permission/.test(t) ? 'security' : null, href: '/dashboard/security' },
  { match: (t) => /finance|money|revenue/.test(t) ? 'finance' : null, href: '/dashboard/finance' },
  { match: (t) => /marketing|campaign/.test(t) ? 'marketing' : null, href: '/dashboard/marketing' },
  { match: (t) => /automation|workflow/.test(t) ? 'automation' : null, href: '/dashboard/automation' },
  { match: (t) => /inbox|email|emails/.test(t) ? 'inbox' : null, href: '/dashboard/inbox' },
];

type SRConstructor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

function VoiceButton() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [goto, setGoto] = useState<{ label: string; href: string } | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const win = (typeof window !== 'undefined' ? window : undefined) as (Window & { webkitSpeechRecognition?: SRConstructor; SpeechRecognition?: SRConstructor }) | undefined;
  const supported = Boolean(win?.webkitSpeechRecognition || win?.SpeechRecognition);

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    recRef.current = null;
    setListening(false);
  };

  const start = () => {
    const Ctor = win?.webkitSpeechRecognition ?? win?.SpeechRecognition;
    if (!Ctor) {
      setMsg('Voice is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript?.trim() ?? '';
      if (!transcript) return;
      const t = transcript.toLowerCase().replace(/^(go to|open|take me to|navigate to|show me|show)\s+/, '').replace(/^the\s+/, '').trim();
      const special = VOICE_ROUTES.find((r) => r.match(t));
      if (special) {
        setMsg(`Heard: "${transcript}" → opening ${special.href}`);
        setGoto({ label: special.href === '/dashboard' ? 'Command Center' : special.href, href: special.href });
        window.setTimeout(() => router.push(special.href), 350);
        return;
      }
      const tool = ALL_TOOLS.find((x) => x.name.toLowerCase() === t || x.id === t || t.includes(x.name.toLowerCase()));
      if (tool) {
        setMsg(`Heard: "${transcript}" → opening ${tool.name}`);
        setGoto({ label: tool.name, href: tool.href });
        window.setTimeout(() => router.push(tool.href), 350);
        return;
      }
      setMsg(`Heard: "${transcript}" — I could not find that tool. Try a name like "Executive" or "Marketing".`);
    };
    rec.onerror = () => {
      setMsg('Did not catch that. Try again.');
      setListening(false);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
    setMsg(null);
    setGoto(null);
  };

  const toggle = () => {
    if (listening) stop();
    else start();
  };

  return (
    <div className="fixed right-3 top-3 z-[70]">
      {msg && (
        <div className="mb-2 w-64 rounded-xl border border-sky-400/30 bg-[#0b0f18]/95 p-2.5 text-[11px] text-sky-100 shadow-2xl backdrop-blur">
          <p>{msg}</p>
          {goto && (
            <Link href={goto.href} className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-sky-500/20 px-2 py-1 font-semibold text-sky-300 hover:bg-sky-500/30">
              Open {goto.label}
            </Link>
          )}
        </div>
      )}
      <button
        onClick={toggle}
        title="Voice commander — say a tool name to navigate"
        className={`group flex h-11 items-center gap-2 rounded-full border px-3.5 shadow-2xl transition-all ${
          listening
            ? 'border-red-400/60 bg-red-500/20 text-red-300 shadow-[0_0_25px_rgba(248,113,113,0.45)]'
            : 'border-white/10 bg-[#12121a]/90 text-white hover:border-sky-400/50 hover:bg-[#14141f]'
        }`}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-sky-300" />}
        <span className={`hidden text-xs font-medium sm:inline ${listening ? 'animate-pulse' : ''}`}>
          {listening ? 'Listening…' : 'Voice'}
        </span>
        {listening && <span className="h-2 w-2 animate-ping rounded-full bg-red-400" />}
      </button>
      {!supported && (
        <p className="mt-1 w-48 text-right text-[10px] text-gray-600">Voice needs Chrome/Edge.</p>
      )}
    </div>
  );
}

export default function CommandCenterPage() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [attn, setAttn] = useState<Partial<Record<ProbeKey, { rows: Row[]; loaded: boolean }>>>({});
  const [activity, setActivity] = useState<Row[]>([]);
  const [chimeOn, setChimeOn] = useState(true);
  const lastTotal = useRef(-1);
  const lastDing = useRef(0);

  useEffect(() => {
    assertHub();
    assertAllTools();
  }, []);

  useEffect(() => {
    const unlock = () => {
      if (chimeOn) ting();
    };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [chimeOn]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.all(
        PROBES.map(async (p) => {
          try {
            const rows = (await collection.list(p.collectionName)) as Row[];
            return { key: p.key, rows };
          } catch {
            return { key: p.key, rows: [] as Row[] };
          }
        }),
      );
      if (!alive) return;
      const next: Partial<Record<ProbeKey, { rows: Row[]; loaded: boolean }>> = {};
      for (const r of results) next[r.key] = { rows: r.rows, loaded: true };
      setAttn(next);
    };
    void load();
    const iv = setInterval(() => void load(), 30000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = (await collection.list('activities')) as Row[];
        if (alive) setActivity(rows);
      } catch {
        if (alive) setActivity([]);
      }
    };
    void load();
    const iv = setInterval(() => void load(), 45000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  const counts = useMemo(() => {
    const out: Record<ProbeKey, number> = { tasks: 0, approvals: 0, emails: 0, deals: 0, invoices: 0, notifications: 0, executions: 0 };
    for (const p of PROBES) {
      const rows = attn[p.key]?.rows ?? [];
      out[p.key] = rows.filter(p.active).length;
    }
    return out;
  }, [attn]);

  const toolAttention = useMemo(() => {
    const map = new Map<string, { total: number; probes: { key: ProbeKey; label: string; count: number }[] }>();
    const ensure = (id: string) => {
      let t = map.get(id);
      if (!t) {
        t = { total: 0, probes: [] };
        map.set(id, t);
      }
      return t;
    };
    for (const p of PROBES) {
      const c = counts[p.key];
      if (c <= 0) continue;
      for (const id of PROBE_TOOL_MAP[p.key]) {
        const t = ensure(id);
        t.total += c;
        t.probes.push({ key: p.key, label: p.label, count: c });
      }
    }
    return map;
  }, [counts]);

  const attentionTotal = useMemo(() => {
    const set = new Set<string>();
    let n = 0;
    for (const p of PROBES) {
      for (const id of PROBE_TOOL_MAP[p.key]) {
        if (!set.has(id)) {
          set.add(id);
          n += counts[p.key];
        }
      }
    }
    return n;
  }, [counts]);

  useEffect(() => {
    if (attentionTotal <= 0 || !chimeOn) return;
    const now = Date.now();
    if (attentionTotal > lastTotal.current && now - lastDing.current > 2500) {
      ting();
      lastDing.current = now;
    }
    lastTotal.current = attentionTotal;
  }, [attentionTotal, chimeOn]);

  const rows: Record<ProbeKey, Row[]> = {
    tasks: attn.tasks?.rows ?? [],
    approvals: attn.approvals?.rows ?? [],
    emails: attn.emails?.rows ?? [],
    deals: attn.deals?.rows ?? [],
    invoices: attn.invoices?.rows ?? [],
    notifications: attn.notifications?.rows ?? [],
    executions: attn.executions?.rows ?? [],
  };

  const tasksOpen = counts.tasks;
  const tasksTotal = rows.tasks.length;
  const tasksDone = tasksTotal - tasksOpen;

  const zoneTotals = useMemo(
    () =>
      FLOW_GROUPS.map((g) => ({
        ...g,
        total: g.toolIds.reduce((acc, id) => acc + (toolAttention.get(id)?.total ?? 0), 0),
      })),
    [toolAttention],
  );
  const zoneMax = Math.max(1, ...zoneTotals.map((z) => z.total));
  const sparkline = useMemo(() => sampleSparkline(rows.tasks), [rows.tasks]);

  const recentActivity = useMemo(
    () =>
      activity
        .map((r) => ({
          at: str(r, 'at') || str(r, 'createdAt'),
          actor: str(r, 'actorSource') || str(r, 'actorId'),
          action: str(r, 'action') || str(r, 'title'),
          object: str(r, 'objectLabel') || str(r, 'objectType') || '',
        }))
        .filter((a) => a.at)
        .sort((a, b) => itemTs(b.at) - itemTs(a.at))
        .slice(0, 6),
    [activity],
  );

  const toolById = (id: string): HubTool | RestoredTool | undefined => ALL_TOOLS.find((t) => t.id === id);
  const toolIcon = (tool: HubTool | RestoredTool) => ICONS[tool.icon] ?? Settings;
  const isPremium = (tool: HubTool | RestoredTool) => 'premium' in tool && tool.premium;
  const toolActive = (tool: HubTool | RestoredTool) => pathname === tool.href || (tool.href !== '/dashboard' && pathname.startsWith(tool.href));
  const attnFor = (id: string) => toolAttention.get(id);

  const renderChip = (t: HubTool | RestoredTool, cx: number, cy: number, w: number, h: number) => {
    const Icon = toolIcon(t);
    const a = attnFor(t.id);
    const gold = isPremium(t);
    const active = toolActive(t);
    return (
      <div key={t.id} className="absolute z-10" style={{ left: cx - w / 2, top: cy - h / 2, width: w, height: h }} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered((x) => (x === t.id ? null : x))}>
        <Link href={t.href} className="group relative block h-full" aria-label={`Open ${t.name}`}>
          <span
            className={`absolute inset-0 rounded-xl border transition-all ${
              (a?.total ?? 0) > 0
                ? 'border-amber-300/70'
                : active
                  ? 'border-sky-400/60 bg-sky-400/10'
                  : gold
                    ? 'border-amber-300/25'
                    : 'border-white/10'
            } ${(a?.total ?? 0) > 0 ? 'nx-blink' : ''} ${
              active ? 'bg-sky-400/10' : gold ? 'bg-[#0d0d14]' : 'bg-[#0b0b12]'
            } group-hover:border-white/30`}
            style={{ boxShadow: (a?.total ?? 0) > 0 ? '0 0 14px rgba(250,204,21,0.25)' : '0 6px 16px rgba(0,0,0,0.45)' }}
          >
            <span className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
              <span className="relative">
                <Icon className={`h-[22px] w-[22px] ${gold ? 'text-amber-200' : active ? 'text-sky-300' : 'text-sky-300/80'}`} />
                {(a?.total ?? 0) > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-amber-300/70 bg-amber-400 px-1 text-[9px] font-bold text-black nx-blink-badge">
                    {Math.min(a?.total ?? 0, 99)}
                  </span>
                )}
              </span>
              <span className="block w-full truncate text-[11px] font-semibold text-white">{t.name}</span>
              {(a?.total ?? 0) > 0 && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-300">
                  {a?.probes.length ?? 0} need you
                </span>
              )}
            </span>
          </span>
        </Link>
      </div>
    );
  };

  const donutFrac = tasksTotal === 0 ? 0 : tasksOpen / tasksTotal;
  const donutC = 2 * Math.PI * 40;
  const sparkMax = Math.max(1, ...sparkline);
  const sparkPts = sparkline.map((v, i) => `${(i / 11) * 120},${40 - (v / sparkMax) * 34}`).join(' ');

  return (
    <div style={{ background: '#000' }} className="min-h-[calc(100vh-6rem)] rounded-xl border border-white/10 p-4 lg:p-5">
      <VoiceButton />
      <style>{`
        @keyframes nxBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes nxGlow { 0%,100% { box-shadow: 0 0 14px rgba(250,204,21,0.30), 0 6px 16px rgba(0,0,0,0.45); } 50% { box-shadow: 0 0 26px rgba(250,204,21,0.65), 0 6px 16px rgba(0,0,0,0.45); } }
        @keyframes nxFlow { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .nx-blink { animation: nxGlow 1.2s ease-in-out infinite; }
        .nx-blink-badge { animation: nxBlink 0.9s ease-in-out infinite; }
        .nx-flow { animation: nxFlow 2.4s ease-in-out infinite; }
      `}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
            <Cpu className="h-5 w-5 text-cyan-300" />
          </span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Command Center</h1>
            <p className="text-[11px] text-gray-500">
              {hubTotal()} tools connected in one operating flow · {ZONE_LABELS.business} + {ZONE_LABELS.life} restored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChimeOn((v) => !v)}
            title={chimeOn ? 'Chime is on — click to mute' : 'Chime is muted — click to hear attention alerts'}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${chimeOn ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-white/5 bg-white/[0.02] text-gray-600 hover:text-gray-400'}`}
          >
            {chimeOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Chime
          </button>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-gray-400">
            {HUB_TOOLS.length} core · {RESTORED_TOOLS.length} restored
          </span>
          {attentionTotal > 0 ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-400/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 nx-blink-badge">
              <Zap className="h-3.5 w-3.5" /> {attentionTotal} need{attentionTotal === 1 ? 's' : ''} attention
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> All clear
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#050508] p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <ListChecksIcon className="h-3.5 w-3.5" /> Task load
          </p>
          <div className="mt-2 flex items-center gap-3">
            <svg viewBox="0 0 96 96" className="h-16 w-16 -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1c1c28" strokeWidth="9" />
              <circle cx="48" cy="48" r="40" fill="none" stroke={donutFrac > 0.6 ? '#fbbf24' : '#34d399'} strokeWidth="9" strokeDasharray={`${donutC * donutFrac} ${donutC}`} strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[11px] text-gray-400">
                <span className="font-bold text-amber-300">{tasksOpen}</span> open · <span className="font-bold text-emerald-300">{tasksDone}</span> done
              </p>
              <p className="text-[10px] text-gray-600">{tasksTotal} total tasks</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#050508] p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <BarChart3 className="h-3.5 w-3.5" /> Attention by flow
          </p>
          <div className="mt-2 flex h-16 items-end gap-1.5">
            {zoneTotals.map((z) => (
              <div key={z.id} className="group relative flex-1" title={`${z.label}: ${z.total}`}>
                <div className="w-full rounded-t bg-gradient-to-t from-sky-500/30 to-sky-400/70 transition-all group-hover:to-sky-300" style={{ height: `${Math.max(3, (z.total / zoneMax) * 100)}%` }} />
                <p className="mt-1 text-center text-[8px] uppercase tracking-wider text-gray-600">{z.label.slice(0, 4)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#050508] p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <Activity className="h-3.5 w-3.5" /> System pulse
          </p>
          <div className="mt-2 h-16">
            {sparkline.some((v) => v > 0) ? (
              <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <polyline points={sparkPts} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
                <polygon points={`0,40 ${sparkPts} 120,40`} fill="rgba(34,211,238,0.08)" />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] text-gray-600">Live sample — data appears as work flows</div>
            )}
          </div>
          <p className="mt-1 text-[10px] text-gray-600">work created · rolling 72h</p>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="mb-4 rounded-xl border border-white/10 bg-[#050508] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <Activity className="h-3.5 w-3.5" /> Recent activity
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-gray-200">{a.action}</span>
                  <span className="block truncate text-[10px] text-gray-600">
                    {a.object || (a.actor === 'user' ? 'system' : a.actor)} · {agoStr(a.at)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />

          <svg className="pointer-events-none absolute inset-0 z-0" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={CANVAS_W} height={CANVAS_H}>
            <defs>
              <marker id="arrowC" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
              </marker>
              <marker id="arrowY" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24" />
              </marker>
            </defs>

            <g className="nx-flow">
              <path d="M 800 102 L 800 136" stroke="#22d3ee" strokeWidth="2" markerEnd="url(#arrowC)" />
              {LANES.slice(0, -1).map((lane) => (
                <path key={lane.id} d={`M 800 ${lane.y + 220} L 800 ${LANES[LANES.indexOf(lane) + 1].y}`} stroke={lane.color} strokeWidth="2" markerEnd="url(#arrowC)" strokeDasharray="6 5" />
              ))}
              <path d={`M 800 ${LANES[3].y + 220} C 800 1130, 600 1140, ${ZONE_TOOLS[0].x + ZONE_TOOLS[0].w / 2} 1176`} stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowY)" />
              <path d={`M 800 ${LANES[3].y + 220} C 800 1130, 1200 1140, ${ZONE_TOOLS[1].x + ZONE_TOOLS[1].w / 2} 1176`} stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowY)" />
            </g>

            {LANES.map((lane) => (
              <g key={lane.id}>
                <path d={`M 178 ${lane.y + 52} L ${170 + 1240 - 22} ${lane.y + 52}`} stroke={lane.color} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5" />
                {lane.tools.map((id, i) => {
                  const cx = laneChipX(i, lane.tools.length);
                  return <path key={id} d={`M ${cx} ${lane.y + 52} L ${cx} ${lane.y + 70}`} stroke={lane.color} strokeWidth="1" opacity="0.5" />;
                })}
              </g>
            ))}

            {ZONE_TOOLS.map((zone, zi) => {
              const busY = zone.y + 58;
              return (
                <g key={zone.id}>
                  <path d={`M ${zone.x + 24} ${busY} L ${zone.x + zone.w - 24} ${busY}`} stroke={zone.zone === 'business' ? '#7c3aed' : '#14b8a6'} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.45" />
                  {zone.toolIds.map((id, i) => {
                    const p = zoneChipPos(zi, i);
                    return <path key={id} d={`M ${p.x + p.w / 2} ${busY} L ${p.x + p.w / 2} ${p.y}`} stroke={zone.zone === 'business' ? '#7c3aed' : '#14b8a6'} strokeWidth="1" opacity="0.45" />;
                  })}
                </g>
              );
            })}
          </svg>

          <Link
            href="/dashboard"
            className="absolute z-10 flex flex-col items-center justify-center rounded-2xl border border-cyan-300/40 bg-gradient-to-b from-cyan-500/20 to-transparent text-center"
            style={{ left: 710, top: 16, width: 180, height: 86, boxShadow: '0 0 30px rgba(34,211,238,0.25)' }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-200">Imprint</span>
            <span className="text-xl font-black tracking-tight text-white">CORE</span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE
            </span>
          </Link>

          {LANES.map((lane) => (
            <div key={lane.id} className="absolute z-0 rounded-2xl border border-white/8" style={{ left: 170, top: lane.y, width: 1240, height: 220, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))' }}>
              <p className="absolute left-4 top-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: lane.color }}>
                <span className="flex h-4 items-center gap-1 rounded border px-1.5" style={{ borderColor: lane.color }}>
                  {lane.step}
                </span>
                <span className="text-white/90">{lane.label}</span>
              </p>
              <p className="absolute right-4 top-3 text-[9px] text-gray-600">{lane.tagline}</p>
            </div>
          ))}
          {LANES.map((lane) =>
            lane.tools.map((id, i) => {
              const t = toolById(id);
              if (!t) return null;
              return renderChip(t, laneChipX(i, lane.tools.length), lane.y + 120, NODE_W, NODE_H);
            }),
          )}

          {ZONE_TOOLS.map((zone, zi) => (
            <div key={zone.id}>
              <div className="absolute z-0 rounded-2xl border border-white/8" style={{ left: zone.x, top: zone.y, width: zone.w, height: 520, background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.004))' }}>
                <p className="absolute left-4 top-3 text-[9px] font-bold uppercase tracking-[0.24em] text-gray-400">
                  {zone.zone === 'business' ? `${ZONE_LABELS.business} · restored` : `${ZONE_LABELS.life} · restored`}
                </p>
              </div>
              {zone.toolIds.map((id, i) => {
                const t = toolById(id);
                if (!t) return null;
                const p = zoneChipPos(zi, i);
                return renderChip(t, p.x + p.w / 2, p.y + p.h / 2, p.w, p.h);
              })}
            </div>
          ))}

          {hovered && toolById(hovered) && (() => {
            const t = toolById(hovered)!;
            const inLane = LANES.find((l) => l.tools.includes(t.id));
            const zi = inLane ? -1 : ZONE_TOOLS.findIndex((z) => z.toolIds.includes(t.id));
            const pos = inLane
              ? { x: laneChipX(inLane.tools.indexOf(t.id), inLane.tools.length), y: inLane.y + 120 }
              : ((c) => c ? { x: c.x + c.w / 2, y: c.y + c.h / 2 } : { x: 800, y: 900 })(zi >= 0 ? zoneChipPos(zi, ZONE_TOOLS[zi].toolIds.indexOf(t.id)) : null);
            const a = attnFor(t.id);
            const gold = isPremium(t);
            return (
              <div className="pointer-events-none absolute z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0b13]/95 px-3 py-2 shadow-2xl backdrop-blur" style={{ left: pos.x, top: pos.y - 60 }}>
                <p className={`text-[11px] font-bold ${gold ? 'text-amber-200' : 'text-white'}`}>{t.name}</p>
                {gold && <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-400">PRO EXCLUSIVE</p>}
                <p className="mt-0.5 max-w-[180px] text-[10px] leading-snug text-gray-400">{t.blurb}</p>
                {a && a.probes.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {a.probes.map((p) => (
                      <p key={p.key} className="flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                        <Zap className="h-2.5 w-2.5" /> {p.count}× {p.label}
                      </p>
                    ))}
                  </div>
                )}
                {!a && <p className="mt-1 text-[8px] uppercase tracking-wider text-gray-600">No pending attention</p>}
              </div>
            );
          })()}
        </div>
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
        <ArrowDown className="h-3 w-3" /> Flow: CORE → Intelligence → Governance → Operations → Revenue → Business & Life tools. Ambers blink where work is waiting and a chime plays.
      </p>
    </div>
  );
}

function ListChecksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}