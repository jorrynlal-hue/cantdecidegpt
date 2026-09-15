'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BellRing,
  Box,
  Boxes,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Layers,
  Mail,
  Maximize2,
  MessageCircle,
  Monitor,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Square,
  Users,
  Video,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Badge, Btn, Card, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { useSession } from '@/components/platform/SessionProvider';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import type { ModuleMeta as OrbitalModuleMeta } from '@/components/projects/OrbitalKits';
import { ProjectIntake } from '@/components/projects/ProjectIntake';
import { playTing } from '@/lib/ting';
import { getBrand } from '@/lib/theme';
import { kitTierForPlan } from '@/lib/plans';

const DND_MIME = 'application/x-cdgtool';

interface Project {
  id: string; name: string; description?: string; status: string; ownerId?: string;
  category?: string; colour?: string; tier?: string; template?: string;
  startDate?: string; deadline?: string; createdAt: string; updatedAt: string;
}
interface Task { id: string; projectId?: string; status: string; priority?: string; title?: string; dueDate?: string; }
interface Execution { id: string; status: string; tool: string; objectId?: string; startedAt: string; }
interface Integration { id: string; name: string; key: string; connected?: boolean; status?: string; category?: string; createdAt?: string; }

interface ToolDef { id: string; label: string; page?: string; desc: string; }

const TOOLS: ToolDef[] = [
  { id: 'consultant', label: 'Consultant Button', page: '/dashboard/consultant', desc: 'Ask-the-board advice on demand.' },
  { id: 'shadowfounder', label: 'Shadow Founder', page: '/dashboard/shadowfounder', desc: 'Your founder brain on tap.' },
  { id: 'competitorshadow', label: 'Competitor Shadow', page: '/dashboard/competitorshadow', desc: 'Tracks competitor moves.' },
  { id: 'secondbrain', label: 'Second Brain', page: '/dashboard/secondbrain', desc: 'Searchable business memory.' },
  { id: 'ghostmode', label: 'Ghost Mode', page: '/dashboard/ghostmode', desc: 'Run quietly without notifications.' },
  { id: 'rescuebutton', label: 'Rescue Button', page: '/dashboard/rescuebutton', desc: 'Emergency runbook when things break.' },
  { id: 'proofreel', label: 'Proof-of-Work', page: '/dashboard/proofreel', desc: 'Auto chain of evidence for every job.' },
  { id: 'closer', label: 'The Closer', page: '/dashboard/closer', desc: 'Closes deals and follows ups.' },
  { id: 'calendar', label: 'The Scheduler', page: '/dashboard/calendar', desc: 'Time-block juggling.' },
  { id: 'bookkeeper', label: 'Bookkeeper Lite', page: '/dashboard/bookkeeper', desc: 'Categorises and reconciles.' },
  { id: 'recruiter', label: 'The Recruiter', page: '/dashboard/recruiter', desc: 'Screens and shortlists hires.' },
  { id: 'negotiator', label: 'The Negotiator', page: '/dashboard/negotiator', desc: 'Negotiates the numbers.' },
  { id: 'researcher', label: 'The Researcher', page: '/dashboard/researcher', desc: 'Digs up answers with sources.' },
  { id: 'weeklyops', label: 'Weekly Ops', page: '/dashboard/weeklyops', desc: 'Weekly operating review.' },
  { id: 'autorenego', label: 'Auto Renegotiate', page: '/dashboard/autorenego', desc: 'Auto-renews bills down.' },
  { id: 'silentresponse', label: 'Silent Response', page: '/dashboard/silentresponse', desc: 'Pattern-matched replies.' },
  { id: 'decaydetect', label: 'Decay Detect', page: '/dashboard/decaydetect', desc: 'Catches declining metrics.' },
  { id: 'rootcause', label: 'Root Cause', page: '/dashboard/rootcause', desc: 'Finds the real failure point.' },
  { id: 'pricingexp', label: 'Pricing Experiments', page: '/dashboard/pricingexp', desc: 'Tests price changes safely.' },
  { id: 'inbox', label: 'Inbox Triage', page: '/dashboard/inbox', desc: 'Sorts the inbox.' },
  { id: 'lifeadmin', label: 'Life Admin Autopilot', page: '/dashboard/lifeadmin', desc: 'Runs personal admin.' },
  { id: 'moneypeace', label: 'Money Peace of Mind', page: '/dashboard/moneypeace', desc: 'Bills and budgets.' },
  { id: 'weeklyrecap', label: 'Weekly Personal Recap', page: '/dashboard/weeklyrecap', desc: 'The weekly personal debrief.' },
  { id: 'fixer', label: 'The Fixer', page: '/dashboard/fixer', desc: 'Repairs anything broken.' },
  { id: 'second-eyes', label: 'Second Set of Eyes', page: '/dashboard/secondeyes', desc: 'Proofreads decisions.' },
  { id: 'nudge', label: 'The Nudge', page: '/dashboard/nudge', desc: 'Gentle reminders before things slip.' },
];

interface FlowNode { id: string; label: string; kind: string; x: number; y: number; status?: string; group?: string; }
interface FlowEdge { from: string; to: string; }
interface Flow { nodes: FlowNode[]; edges: FlowEdge[]; }

type View = { x: number; y: number; z: number };
type RunState = 'idle' | 'running' | 'paused';

function layoutDefault(project: Project): Flow {
  const tools = TOOLS.filter((t) => {
    if (project.tier === '1600') return true;
    if (project.tier === '1000') return ['inbox', 'lifeadmin', 'moneypeace', 'weeklyrecap', 'fixer', 'second-eyes', 'nudge'].includes(t.id);
    return ['inbox', 'researcher'].includes(t.id);
  });
  const pool = tools.slice(0, 10);
  const cx = 520, cy = 300;
  const nodes: FlowNode[] = [
    { id: 'job', label: 'JOB', kind: 'job', x: cx, y: cy - 210 },
    { id: 'inbox', label: 'INBOX', kind: 'inbox', x: cx - 230, y: cy - 90 },
    { id: 'decisions', label: 'DECISIONS', kind: 'decisions', x: cx + 230, y: cy + 90 },
    { id: 'result', label: 'RESULT', kind: 'result', x: cx, y: cy + 210 },
  ];
  const edges: FlowEdge[] = [
    { from: 'job', to: 'inbox' }, { from: 'inbox', to: 'decisions' }, { from: 'decisions', to: 'result' }, { from: 'job', to: 'result' },
  ];
  pool.forEach((t, i) => {
    const ang = (i / pool.length) * Math.PI * 2 - Math.PI / 2;
    const r = 300;
    nodes.push({ id: `t:${t.id}`, label: t.label, kind: 'tool', x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, status: 'ready' });
    edges.push({ from: 'inbox', to: `t:${t.id}` });
    edges.push({ from: `t:${t.id}`, to: 'decisions' });
  });
  return { nodes, edges };
}

function loadFlow(project: Project): Flow {
  try {
    const raw = localStorage.getItem(`cdg.flow.${project.id}`);
    if (raw) {
      const p = JSON.parse(raw) as Flow;
      if (Array.isArray(p.nodes) && p.nodes.length) return p;
    }
  } catch { /* ignore */ }
  return layoutDefault(project);
}

const SEAL = '✧';
const STATUSES = ['ready', 'working', 'needs-approval', 'connected', 'done', 'error'];

const STATUS_META: Record<string, { dot: string; ring: string; label: string }> = {
  ready: { dot: 'bg-gray-400', ring: '', label: 'ready' },
  working: { dot: 'bg-[var(--c-accent)]', ring: 'ring-[var(--c-accent-border)]', label: 'working' },
  'needs-approval': { dot: 'bg-rose-400', ring: 'ring-rose-400/40', label: 'needs approval' },
  connected: { dot: 'bg-[#19C9D6]', ring: 'ring-[#19C9D6]/40', label: 'connected' },
  done: { dot: 'bg-emerald-400', ring: 'ring-emerald-400/40', label: 'completed' },
  error: { dot: 'bg-red-500', ring: 'ring-red-500/50', label: 'error' },
};

/* ---------- SERVICE CONSTELLATION → CORE ---------- */

const SERVICES: { key: string; icon: typeof Mail; color: string; label: string }[] = [
  { key: 'people', icon: Users, color: '#438BFF', label: 'People' },
  { key: 'email', icon: Mail, color: '#19C9D6', label: 'Email' },
  { key: 'messages', icon: MessageCircle, color: '#9B6CFF', label: 'Messages' },
  { key: 'calendar', icon: Calendar, color: '#f5b544', label: 'Calendar' },
  { key: 'meetings', icon: Video, color: '#38bdf8', label: 'Meetings' },
  { key: 'files', icon: FileText, color: '#a3e635', label: 'Files' },
  { key: 'browser', icon: Globe, color: '#ec4899', label: 'Browser' },
  { key: 'website', icon: Monitor, color: '#00d9b2', label: 'Websites' },
];

const SERVICE_SLOT: Record<string, { cx: number; cy: number }> = {
  people: { cx: 70, cy: 24 }, email: { cx: 190, cy: 14 }, messages: { cx: 312, cy: 22 },
  calendar: { cx: 44, cy: 118 }, meetings: { cx: 150, cy: 128 }, files: { cx: 252, cy: 132 },
  browser: { cx: 352, cy: 116 }, website: { cx: 436, cy: 96 },
};

function CoreBlock({ servicesLive, coreLabel }: { servicesLive: string[]; coreLabel: string }) {
  const core = { cx: 540, cy: 78 };
  return (
    <div className="relative flex justify-end">
      <div className="relative h-[168px] w-[520px] max-w-full">
        <svg viewBox="0 0 520 168" className="absolute inset-0 h-full w-full">
          {SERVICES.map((s) => {
            const p = SERVICE_SLOT[s.key];
            const live = servicesLive.includes(s.key.toLowerCase()) || servicesLive.some((k) => s.key.startsWith(k));
            return (
              <path
                key={`ln-${s.key}`}
                d={`M ${p.cx} ${p.cy} C ${(p.cx + core.cx) / 2} ${p.cy}, ${(p.cx + core.cx) / 2} ${core.cy}, ${core.cx} ${core.cy}`}
                fill="none"
                stroke={live ? s.color : 'rgba(160,150,220,0.18)'}
                strokeWidth={0.8}
                strokeOpacity={live ? 0.55 : 0.25}
                strokeDasharray="3 6"
              />
            );
          })}
          <circle cx={core.cx} cy={core.cy} r={38} fill="none" stroke="rgba(24,223,160,0.35)" strokeWidth={1} className="jbos-breathe" style={{ animationDuration: '4s' }} />
          <circle cx={core.cx} cy={core.cy} r={30} fill="rgba(24,223,160,0.06)" stroke="rgba(24,223,160,0.5)" strokeWidth={1} className="jbos-core-breathe" />
        </svg>

        <div className="absolute flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border border-[#18DFA0]/40 text-center" style={{ left: core.cx - 30, top: core.cy - 30, background: 'radial-gradient(120% 120% at 30% 25%, rgba(24,223,160,0.12), rgba(5,6,11,0.9) 80%)' }}>
          <span className="text-[8px] font-bold tracking-[0.18em] text-slate-400">{coreLabel}</span>
          <span className="text-[8px] font-black tracking-[0.08em] text-[#18DFA0]">CORE</span>
          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase text-[#18DFA0]">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#18DFA0]" /> live
          </span>
        </div>

        {SERVICES.map((s) => {
          const p = SERVICE_SLOT[s.key];
          const live = servicesLive.includes(s.key.toLowerCase()) || servicesLive.some((k) => s.key.startsWith(k));
          const Icon = s.icon;
          return (
            <div key={s.key} className="absolute flex flex-col items-center" style={{ left: p.cx - 14, top: p.cy - 14 }}>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border"
                style={{ borderColor: `${s.color}55`, background: `${s.color}14`, color: live ? s.color : `${s.color}88`, boxShadow: live ? `0 0 10px ${s.color}33` : undefined }}
                title={s.label}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="mt-0.5 text-[7px] uppercase tracking-[0.1em]" style={{ color: live ? s.color : '#4b5563' }}>{s.label}</span>
            </div>
          );
        })}

        <div className="absolute flex flex-col items-center" style={{ left: core.cx + 132, top: core.cy - 44 }}>
          <span className="text-[8px] uppercase tracking-[0.14em] text-gray-600">one live line</span>
          <span className="mt-0.5 h-5 w-px bg-gradient-to-b from-[#18DFA0]/60 to-transparent" />
          <span className="text-[7px] uppercase tracking-[0.12em] text-[#18DFA0]/70">→ project flow</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- QUIET TOP INFORMATION ---------- */

function TaskLoadRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const R = 15;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-10 w-10">
      <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
        <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="20" cy="20" r={R} fill="none" stroke="#18DFA0" strokeWidth="3" strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-slate-200">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function PulseLine({ executions }: { executions: Execution[] }) {
  const dots = 16;
  const colorFor = (i: number) => {
    const ex = executions[i % Math.max(1, executions.length)];
    if (!ex) return 'rgba(255,255,255,0.1)';
    if (ex.status === 'completed' || ex.status === 'done') return '#18DFA0';
    if (ex.status === 'error' || ex.status === 'failed') return '#f43f5e';
    if (ex.status === 'needs-approval') return '#fbbf24';
    return '#9B6CFF';
  };
  return (
    <div className="flex items-end gap-1">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className="w-1 rounded-full first:animate-pulse" style={{ height: 4 + ((i * 7) % 10), background: colorFor(i), opacity: 0.4 + 0.6 * (i === 0 ? 1 : (i % 4) / 3) }} />
      ))}
    </div>
  );
}

/* ---------- HUMAN / AI SIDE ---------- */

function HumanAiSide({ project, tasks, executions, connected, now, onOpenTaskBoard }: {
  project: Project;
  tasks: Task[];
  executions: Execution[];
  connected: Integration[];
  now: number;
  onOpenTaskBoard: () => void;
}) {
  const open = tasks.filter((t) => t.projectId === project.id && !['completed', 'cancelled'].includes(t.status));
  const due = open.filter((t) => t.dueDate && now > 0 && new Date(t.dueDate).getTime() < now);
  const waiting = open.filter((t) => t.status === 'waiting' || t.status === 'todo');
  const urgent = open.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const approvals = executions.filter((e) => e.status === 'needs-approval');
  const liveRuns = executions.filter((e) => ['queued', 'running', 'waiting'].includes(e.status));
  const failed = executions.filter((e) => e.status === 'error' || e.status === 'failed');
  const done = executions.filter((e) => e.status === 'completed' || e.status === 'done');

  const human: { label: string; value: string; tone: string }[] = [
    { label: 'needs a reply', value: String(urgent.length), tone: urgent.length ? '#fbbf24' : '#6b7280' },
    { label: 'due today / overdue', value: String(due.length), tone: due.length ? '#fb7185' : '#6b7280' },
    { label: 'waiting on someone', value: String(waiting.length), tone: waiting.length ? '#9B6CFF' : '#6b7280' },
    { label: 'next meeting', value: project.deadline ? new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'not scheduled', tone: '#6b7280' },
    { label: 'missing docs / files', value: connected.length ? '0 flagged' : 'connect a service first', tone: '#6b7280' },
    { label: 'ready for your approval', value: String(approvals.length), tone: approvals.length ? '#fbbf24' : '#6b7280' },
  ];

  const ai: { label: string; value: number; tone: string }[] = [
    { label: 'running', value: liveRuns.length, tone: '#9B6CFF' },
    { label: 'completed', value: done.length, tone: '#18DFA0' },
    { label: 'ready for approval', value: approvals.length, tone: '#fbbf24' },
    { label: 'blocked / failed', value: failed.length, tone: '#f43f5e' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/8 bg-[#080a11]/90 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Human side — where you come in</p>
          {urgent.length > 0 && <button onClick={onOpenTaskBoard} className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">review now</button>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {human.map((h) => (
            <div key={h.label} className="rounded-xl border border-white/5 px-2.5 py-2">
              <p className="text-sm font-bold tabular-nums" style={{ color: h.tone }}>{h.value}</p>
              <p className="text-[9px] uppercase tracking-[0.1em] text-gray-500">{h.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#080a11]/90 p-4" style={{ boxShadow: failed.length ? '0 0 22px rgba(244,63,94,0.08)' : undefined }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">AI side — already handled</p>
          <span className="flex items-center gap-1.5 text-[9px] text-[#9B6CFF]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9B6CFF]" /> engine attached</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ai.map((a) => (
            <div key={a.label} className="rounded-xl border border-white/5 px-2.5 py-2">
              <p className="text-sm font-bold tabular-nums" style={{ color: a.tone }}>{a.value}</p>
              <p className="text-[9px] uppercase tracking-[0.1em] text-gray-500">{a.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 border-t border-white/5 pt-2 text-[9px] leading-relaxed text-gray-600" style={{ color: 'var(--c-accent-text)' }}>
          status words: ready to run · running · waiting · ready for approval · prepared by AI · blocked · completed · failed — shown inside the flow on each tool node.
        </p>
      </div>
    </div>
  );
}

function ts(v?: string): number {
  if (!v) return 0;
  const n = new Date(v).getTime();
  return Number.isFinite(n) ? n : 0;
}

function fmtTime(v?: string): string {
  const n = ts(v);
  return n > 0 ? new Date(n).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

/* ---------- AI PROJECT START ADVISOR ---------- */

const KEYWORDS: Record<string, string[]> = {
  consultant: ['advice', 'board', 'advisor', 'strategy', 'consult'],
  shadowfounder: ['founder', 'leader', 'founder brain'],
  competitorshadow: ['competitor', 'rival', 'competition'],
  secondbrain: ['memory', 'notes', 'recall', 'search'],
  ghostmode: ['absent', 'vacation', 'quiet', 'delegate'],
  rescuebutton: ['overwhelm', 'crisis', 'panic', 'break'],
  proofreel: ['proof', 'recap', 'evidence', 'highlights'],
  closer: ['close', 'follow up', 'follow-up', 'leads', 'pipeline'],
  calendar: ['meetings', 'calendar', 'schedule', 'time block', 'focus'],
  bookkeeper: ['books', 'bookkeeping', 'account', 'receipts'],
  recruiter: ['hire', 'recruit', 'hiring', 'candidate', 'role'],
  negotiator: ['negotiate', 'vendor', 'price', 'terms'],
  researcher: ['research', 'brief', 'sources', 'market'],
  weeklyops: ['weekly', 'ops report', 'monday', 'review'],
  autorenego: ['renewal', 'renew', 'renegotiate', 'contract'],
  silentresponse: ['competitor', 'counter', 'social'],
  decaydetect: ['churn', 'decay', 'at risk', 'relationship'],
  rootcause: ['root cause', 'why', 'diagnose'],
  pricingexp: ['pricing', 'a/b', 'price test'],
  inbox: ['email', 'inbox', 'mail', 'triage'],
  lifeadmin: ['bills', 'paperwork', 'admin', 'life'],
  moneypeace: ['money', 'budget', 'savings', 'spend'],
  weeklyrecap: ['recap', 'weekly', 'weekend'],
  fixer: ['fix', 'cancel', 'change', 'replacement'],
  'second-eyes': ['contract', 'review', 'eyes', 'terms'],
  nudge: ['reminder', 'nudge', 'follow through'],
};

function ProjectStartAdvisor({
  isNew,
  onAddTool,
  onClose,
}: {
  isNew: boolean;
  onAddTool: (t: ToolDef) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [thinking, setThinking] = useState(false);
  const [sug, setSug] = useState<ToolDef[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const ask = () => {
    if (!q.trim()) return;
    setThinking(true);
    const needle = q.toLowerCase();
    const scored = TOOLS.map((t) => {
      const words = (t.label + ' ' + t.desc + ' ' + (KEYWORDS[t.id] ?? []).join(' ')).toLowerCase();
      let score = 0;
      for (const w of needle.split(/\s+/).filter((x) => x.length > 3)) {
        for (const kw of KEYWORDS[t.id] ?? [t.label]) if (words.includes(kw) || kw.includes(w) || w.includes(kw)) { score += 2; break; }
        if (t.label.toLowerCase().includes(w)) score += 1;
        if (t.desc.toLowerCase().includes(w)) score += 1;
      }
      return { t, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.t);
    window.setTimeout(() => {
      setSug(scored.slice(0, 6));
      setThinking(false);
    }, 650);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#080a11]/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-accent-border)] text-[var(--c-accent-text)]">
          <Boxes className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-100">Project start advisor</p>
          <p className="text-[10px] text-gray-500">AI chats you through what this project should run on.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-white/10 hover:text-white" aria-label="Close advisor">✕</button>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        <div className="max-w-[90%] rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-300">
          {isNew
            ? 'This project was just created. Tell me what it should do and I\u2019ll suggest the workflows, systems and tools to base it on — then add any of them straight into your flow.'
            : 'I can recommend tools for this project\u2019s workflows, systems and services. Describe what you want it to handle.'}
        </div>

        {sug.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">I\u2019d start with these</p>
            <div className="space-y-1.5">
              {sug.map((s) => {
                const ok = added.has(s.id);
                return (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#0c0e16] px-2.5 py-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? 'bg-emerald-400' : 'bg-[var(--c-accent)]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-slate-200">{s.label}</span>
                      <span className="block truncate text-[10px] text-gray-500">{s.desc}</span>
                    </span>
                    <button
                      onClick={() => { if (ok) return; onAddTool(s); setAdded(new Set([...added, s.id])); }}
                      disabled={ok}
                      className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${ok ? 'text-emerald-400' : 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] hover:brightness-110'}`}
                    >
                      {ok ? 'in flow' : '+ flow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {thinking && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--c-accent)]" /> thinking about your project…
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
          placeholder="e.g. launch week, hire a VA, fix my inbox…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#05060b] px-3 py-2 text-xs text-white outline-none focus:border-[var(--c-accent-border)]"
        />
        <button onClick={ask} className="rounded-xl bg-[var(--c-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--c-accent-text)] hover:brightness-110">
          Suggest
        </button>
      </div>
    </div>
  );
}

/* ---------- FREE SPACE — NOTES + ADDED-TODAY / VERIFICATION ---------- */

const FREE_VERIFY_KEY = 'cdg.free.verify';
const FREE_NOTES_KEY = 'cdg.free.notes';

function loadObject(key: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { return {}; }
}
function saveObject(key: string, v: Record<string, string>) {
  try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

function FreeSpaceNotes({ integrations, onOpenIntegrations }: {
  integrations: Integration[];
  onOpenIntegrations: () => void;
}) {
  const [notes, setNotes] = useState(() => loadObject(FREE_NOTES_KEY));
  const [verified, setVerified] = useState(() => loadObject(FREE_VERIFY_KEY));
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const iv = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, []);

  const recents = integrations
    .filter((i) => now > 0 && ts(i.createdAt) > 0 && now - ts(i.createdAt) < 7 * 86400000)
    .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
    .slice(0, 12);
  const today = recents.filter((i) => now > 0 && new Date(ts(i.createdAt)).toDateString() === new Date(now).toDateString());
  const earlier = recents.filter((i) => !today.includes(i));

  const saveNote = (id: string) => {
    const next = { ...notes };
    if (draft.trim()) next[id] = draft.trim();
    else delete next[id];
    setNotes(next);
    saveObject(FREE_NOTES_KEY, next);
    setOpenNote(null);
    setDraft('');
  };
  const toggleVerify = (id: string) => {
    const next = { ...verified };
    if (next[id]) delete next[id];
    else next[id] = '1';
    setVerified(next);
    saveObject(FREE_VERIFY_KEY, next);
  };

  const Row = ({ i }: { i: Integration }) => {
    const isVerified = !!verified[i.id];
    const note = notes[i.id];
    const isOpen = openNote === i.id;
    const isNew = now > 0 && ts(i.createdAt) > 0 && new Date(ts(i.createdAt)).toDateString() === new Date(now).toDateString();
    return (
      <div key={i.id} className={`rounded-xl border px-3 py-2 ${isVerified ? 'border-emerald-400/25 bg-emerald-400/[0.03]' : 'border-white/6 bg-white/[0.02]'}`}>
        <div className="flex items-center gap-2.5">
          <button onClick={() => toggleVerify(i.id)} title={isVerified ? 'Verified — flows can use it' : 'Mark verified to release into flows'} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isVerified ? 'border-emerald-400 text-emerald-300' : 'border-white/10 text-transparent'}`}>
            <Check className="h-3 w-3" />
          </button>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-slate-200">{i.name || i.key || 'New service'}</span>
            <span className="block text-[10px] text-gray-500">{i.category || 'integration'} · {isNew ? 'added today' : 'this week'} · at {fmtTime(i.createdAt)}</span>
            {note && <span className="mt-0.5 block text-[10px] italic text-slate-400">note: {note}</span>}
          </span>
          {!isVerified && isNew && (
            <span className="shrink-0 rounded-full border border-[#19C9D6]/40 bg-[#19C9D6]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#19C9D6]">new · not verified</span>
          )}
          <button onClick={() => { setOpenNote(isOpen ? null : i.id); setDraft(isOpen ? '' : (notes[i.id] ?? '')); }} className="shrink-0 rounded-lg border border-white/10 px-1.5 py-0.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white">
            {isOpen ? '−' : '+'}
          </button>
        </div>
        {isOpen && (
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Why was this added? How will it help the project?"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#05060b] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--c-accent-border)]"
              autoFocus
            />
            <button onClick={() => saveNote(i.id)} className="rounded-lg bg-[var(--c-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--c-accent-text)]">Save</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#080a11]/50 p-4 lg:p-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#19C9D6]">free space</p>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">New workflows &amp; integrations</h2>
        <span className="ml-auto text-[10px] text-gray-500">added here first · verified → they join the map’s live connections</span>
        <button onClick={onOpenIntegrations} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-gray-400 hover:text-white">manage integrations</button>
      </div>

      {recents.length === 0 ? (
        <p className="text-xs text-gray-600">
          Nothing was added in the last 7 days. Connect a service under Integrations or add a tool from the toolkits — new arrivals land here with their exact time, ready for a note and a verify.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#19C9D6]">Added today</p>
            <div className="space-y-2">
              {today.length === 0 && <p className="text-[10px] text-gray-600">nothing new today.</p>}
              {today.map((i) => <Row key={i.id} i={i} />)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Earlier this week</p>
            <div className="space-y-2">
              {earlier.length === 0 && <p className="text-[10px] text-gray-600">nothing else this week.</p>}
              {earlier.map((i) => <Row key={i.id} i={i} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowCanvas(props: {
  project: Project;
  tasks: Task[];
  executions: Execution[];
  connected: Integration[];
  accent: string;
  onBack: () => void;
  onOpenTaskBoard: () => void;
}) {
  const { project, tasks, executions, connected, accent, onBack, onOpenTaskBoard } = props;
  const router = useRouter();
  const { me } = useSession();
  const planTier = kitTierForPlan(me?.plan);
  const [coreLabel] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const iv = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, []);
  const [flow, setFlowState] = useState<Flow>(() => loadFlow(project));
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0, z: 1 };
    const w = Math.min(1200, window.innerWidth - 320);
    return { x: w / 2 - 520, y: 280 - 300, z: 1 };
  });
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 900, h: 560 });
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'working' | 'attention' | 'done'>('all');
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [aiOpen, setAiOpen] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ nodeId: string; sx: number; sy: number; nx: number; ny: number } | null>(null);
  const pan = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const flowRef = useRef(flow);

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  // opened a freshly-created project → open the AI start advisor once
  useEffect(() => {
    try {
      const flag = `cdg.project.new.${project.id}`;
      if (window.localStorage.getItem(flag) === '1') {
        window.localStorage.removeItem(flag);
        window.setTimeout(() => {
          setIsNewProject(true);
          setAiOpen(true);
        }, 120);
      }
    } catch { /* ignore */ }
  }, [project.id]);

  const persist = useCallback((f: Flow) => {
    try { localStorage.setItem(`cdg.flow.${project.id}`, JSON.stringify(f)); } catch { /* ignore */ }
    setFlowState({ nodes: f.nodes.map((n) => ({ ...n })), edges: f.edges });
  }, [project.id]);

  // live container size for the mini-map viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    setSize({ w: el.clientWidth || 900, h: el.clientHeight || 560 });
    return () => ro.disconnect();
  }, []);

  // run / pause / stop simulator — advances tool lifecycle until done/error
  useEffect(() => {
    if (runState !== 'running') return;
    const iv = setInterval(() => {
      const f = flowRef.current;
      const nextNodes = f.nodes.map((n) => {
        if (n.kind !== 'tool') return n;
        const st = n.status ?? 'ready';
        if (st === 'ready') return { ...n, status: Math.random() < 0.72 ? 'working' : 'ready' };
        if (st === 'working') {
          const r = Math.random();
          if (r < 0.42) return { ...n, status: 'done' };
          if (r < 0.5) return { ...n, status: 'error' };
          if (r < 0.62) return { ...n, status: 'needs-approval' };
          return n;
        }
        if (st === 'needs-approval') return { ...n, status: Math.random() < 0.45 ? 'done' : 'needs-approval' };
        if (st === 'error') return n;
        return n;
      });
      const hasLive = nextNodes.some((n) => n.kind === 'tool' && !['done', 'error'].includes(n.status ?? ''));
      persist({ nodes: nextNodes, edges: f.edges });
      if (!hasLive) setRunState('idle');
    }, 1400);
    return () => clearInterval(iv);
  }, [runState, persist]);

  const addToolAt = (t: ToolDef, wx?: number, wy?: number) => {
    setDrawer(false);
    if (flow.nodes.some((n) => n.id === `t:${t.id}`)) { setNotif(`${t.label} is already in the flow.`); window.setTimeout(() => setNotif(null), 2200); return; }
    const placed = flow.nodes.filter((n) => n.kind === 'tool').length;
    const node: FlowNode = {
      id: `t:${t.id}`, label: t.label, kind: 'tool',
      x: wx ?? 560 + (placed % 5 - 2) * 130,
      y: wy ?? 320 + (placed % 3 - 1) * 120,
      status: 'ready',
    };
    persist({
      nodes: [...flow.nodes, node],
      edges: [...flow.edges, { from: 'inbox', to: node.id }, { from: node.id, to: 'decisions' }],
    });
    setSel(node.id);
    setNotif(`${t.label} added to the project flow.`);
    window.setTimeout(() => setNotif(null), 2600);
  };

  const addTool = (t: ToolDef) => addToolAt(t);

  const removeNode = (n: FlowNode) => {
    if (!confirm(`Remove "${n.label}" from this flow?`)) return;
    persist({
      nodes: flow.nodes.filter((x) => x.id !== n.id),
      edges: flow.edges.filter((e) => e.from !== n.id && e.to !== n.id),
    });
    setSel(null);
  };

  const duplicateNode = (n: FlowNode) => {
    const id = `${n.id}:copy`;
    if (flow.nodes.some((x) => x.id === id)) return;
    const node: FlowNode = { ...n, id, x: n.x + 46, y: n.y + 46, status: 'ready', group: n.group };
    persist({
      nodes: [...flow.nodes, node],
      edges: [...flow.edges, { from: 'inbox', to: id }, { from: id, to: 'decisions' }],
    });
    setSel(id);
    setNotif(`Duplicated "${n.label}".`);
    window.setTimeout(() => setNotif(null), 2200);
  };

  const setStatus = (n: FlowNode, s: string) => {
    persist({ nodes: flow.nodes.map((x) => (x.id === n.id ? { ...x, status: s } : x)), edges: flow.edges });
  };

  const groupSelected = () => {
    const selNode = flow.nodes.find((n) => n.id === sel);
    if (!selNode) return;
    const gid = `g:${selNode.id}`;
    persist({ nodes: flow.nodes.map((x) => (x.id === selNode.id ? { ...x, group: gid } : x)), edges: flow.edges });
    setNotif(`Grouped "${selNode.label}".`);
    window.setTimeout(() => setNotif(null), 2200);
  };

  const ungroupSelected = () => {
    const selNode = flow.nodes.find((n) => n.id === sel);
    if (!selNode) return;
    persist({ nodes: flow.nodes.map((x) => (x.id === selNode.id ? { ...x, group: undefined } : x)), edges: flow.edges });
  };

  const runningTools = useMemo(() => {
    const m = new Set<string>();
    executions.forEach((e) => {
      if (['queued', 'running', 'waiting'].includes(e.status)) m.add(e.tool);
    });
    return m;
  }, [executions]);

  const nodeStatus = useCallback((n: FlowNode): string => {
    if (!n.status || n.status === 'ready') {
      if (n.kind === 'tool' && runningTools.has(n.id.replace('t:', ''))) return 'working';
    }
    return n.status ?? 'ready';
  }, [runningTools]);

  const onPointerDownOnNode = (e: React.PointerEvent, n: FlowNode) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { nodeId: n.id, sx: e.clientX, sy: e.clientY, nx: n.x, ny: n.y };
    setSel(n.id);
  };

  const onPointerDownBackground = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSel(null);
    pan.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const z = view.z;
      const nx = d.nx + (e.clientX - d.sx) / z;
      const ny = d.ny + (e.clientY - d.sy) / z;
      persist({ nodes: flow.nodes.map((x) => (x.id === d.nodeId ? { ...x, x: nx, y: ny } : x)), edges: flow.edges });
      return;
    }
    const p = pan.current;
    if (p) {
      setView({ ...view, x: p.vx + (e.clientX - p.sx), y: p.vy + (e.clientY - p.sy) });
    }
  };

  const onDropTool = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DND_MIME);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { id: string };
      const def = TOOLS.find((t) => t.id === parsed.id);
      const r = containerRef.current?.getBoundingClientRect();
      if (!def || !r) return;
      const wx = (e.clientX - r.left - view.x) / view.z;
      const wy = (e.clientY - r.top - view.y) / view.z;
      addToolAt(def, wx, wy);
    } catch { /* ignore */ }
  };

  const onDropToolOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onPointerUp = () => { drag.current = null; pan.current = null; };

  const fit = () => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const xs = flow.nodes.map((n) => n.x);
    const ys = flow.nodes.map((n) => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const z = Math.min(0.9, Math.min(box.width / (maxX - minX + 260), box.height / (maxY - minY + 220)));
    setView({ x: box.width / 2 - ((minX + maxX) / 2) * z, y: box.height / 2 - ((minY + maxY) / 2) * z, z });
  };

  const zoomAt = (dir: number) => {
    setView((v) => {
      const nz = Math.min(2.4, Math.max(0.25, v.z + dir * 0.12));
      const cx = size.w / 2;
      const cy = size.h / 2;
      const rx = (cx - v.x) / v.z;
      const ry = (cy - v.y) / v.z;
      return { z: nz, x: cx - rx * nz, y: cy - ry * nz };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const d = -e.deltaY * 0.0012;
    setView((v) => {
      const nz = Math.min(2.4, Math.max(0.25, v.z + d));
      const cx = size.w / 2;
      const cy = size.h / 2;
      const rx = (cx - v.x) / v.z;
      const ry = (cy - v.y) / v.z;
      return { z: nz, x: cx - rx * nz, y: cy - ry * nz };
    });
  };

  const projectOpenTasks = tasks.filter((t) => t.projectId === project.id && !['completed', 'cancelled'].includes(t.status)).length;
  const projectStat = (s: string) => tasks.filter((t) => t.projectId === project.id && t.status === s).length;
  const needsFocus = tasks.filter((t) => t.projectId === project.id && !['completed', 'cancelled'].includes(t.status) && (t.priority === 'urgent' || t.priority === 'high'));
  const toolCount = flow.nodes.filter((n) => n.kind === 'tool').length;

  const statusLabel = (s?: string) => STATUS_META[s ?? 'ready'].label;
  const toolDefById = (nid: string) => TOOLS.find((t) => t.id === nid);

  const visible = useMemo(() => {
    return (n: FlowNode) => {
      const st = nodeStatus(n);
      if (filter === 'working' && st !== 'working') return false;
      if (filter === 'attention' && st !== 'error' && st !== 'needs-approval') return false;
      if (filter === 'done' && st !== 'done') return false;
      return true;
    };
  }, [filter, nodeStatus]);
  const matchesSearch = (n: FlowNode) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return n.label.toLowerCase().includes(needle);
  };

  const selNode = sel ? flow.nodes.find((x) => x.id === sel) : undefined;
  const selDef = selNode && selNode.kind === 'tool' ? toolDefById(selNode.id.replace('t:', '')) : undefined;

  // group boxes (for render order behind edges)
  const groups = useMemo(() => {
    const map = new Map<string, FlowNode[]>();
    flow.nodes.forEach((n) => { if (n.group) { const arr = map.get(n.group) ?? []; arr.push(n); map.set(n.group, arr); } });
    return [...map.entries()].map(([gid, ns]) => {
      const minX = Math.min(...ns.map((n) => n.x)) - 55;
      const minY = Math.min(...ns.map((n) => n.y)) - 45;
      const maxX = Math.max(...ns.map((n) => n.x)) + 55;
      const maxY = Math.max(...ns.map((n) => n.y)) + 45;
      return { gid, x: minX, y: minY, w: maxX - minX, h: maxY - minY, count: ns.length };
    });
  }, [flow.nodes]);

  // toggle of plane is cheap; count stats for chips
  const statCounts = useMemo(() => {
    let working = 0, attention = 0, done = 0;
    flow.nodes.forEach((n) => {
      const st = nodeStatus(n);
      if (st === 'working') working += 1;
      if (st === 'error' || st === 'needs-approval') attention += 1;
      if (st === 'done') done += 1;
    });
    return { working, attention, done };
  }, [flow.nodes, nodeStatus]);

  const servicesLive = useMemo(() => connected.map((c) => (c.name || c.key || '').toLowerCase()), [connected]);

  // attention "ting — ting — ting" when the project demands attention
  const tinged = useRef(false);
  useEffect(() => {
    if (needsFocus.length > 0 && !tinged.current) {
      tinged.current = true;
      playTing();
    }
    if (needsFocus.length === 0) tinged.current = false;
  }, [needsFocus.length]);

  const addOrbitalTool = (m: OrbitalModuleMeta) => {
    addToolAt({ id: m.id, label: m.label, desc: m.tagline });
  };

  return (
    <div className="space-y-4">
      {/* quiet command strip */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Btn kind="ghost" small onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" /> projects
        </Btn>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: `${accent}44`, color: accent, background: `${accent}14` }}>
          <FolderKanban className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-[var(--text-main)]">{project.name}</h1>
            {project.tier !== 'normal' && <Badge tone={(project.tier === '1600' ? 'purple' : 'blue') as never}>{TIER_LABEL[project.tier ?? ''] ?? project.tier}</Badge>}
            <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'active' ? 'bg-emerald-400' : project.status === 'on_hold' ? 'bg-amber-400' : project.status === 'completed' ? 'bg-[#438BFF]' : 'bg-gray-600'}`} />
          </div>
          <p className="text-[10px] text-gray-500">
            {project.category ?? 'Uncategorised'}
            {project.template && project.template !== 'Blank project' ? ` · ${project.template}` : ''}
            {project.deadline ? ` · due ${new Date(project.deadline).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Btn kind="ghost" small onClick={() => setAiOpen(true)}><Sparkles className="h-3.5 w-3.5" /> Ask AI</Btn>
          <Btn kind="ghost" small onClick={() => setDrawer(true)}><Plus className="h-3.5 w-3.5" /> Add a tool</Btn>
          <Btn kind="ghost" small onClick={() => setEditing(true)}><Wrench className="h-3.5 w-3.5" /> Details</Btn>
        </div>
      </div>

      {/* quiet top information — task load, attention, pulse, ai progress */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-white/5 bg-[#080a11]/70 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <TaskLoadRing done={projectStat('completed')} total={tasks.filter((t) => t.projectId === project.id).length} />
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">task load</p>
            <p className="text-[11px] text-slate-300">{projectOpenTasks} open · {toolCount} tools in the flow</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/5" />
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${needsFocus.length ? 'border-amber-400/50 text-amber-300' : 'border-white/10 text-gray-600'}`}>
            <BellRing className={`h-4 w-4 ${needsFocus.length ? 'animate-pulse' : ''}`} />
          </span>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">attention</p>
            <p className={`text-[11px] ${needsFocus.length ? 'text-amber-300' : 'text-slate-400'}`}>
              {needsFocus.length ? `${needsFocus.length} task${needsFocus.length === 1 ? '' : 's'} need attention` : 'all clear'}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/5" />
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">system pulse</p>
          <PulseLine executions={executions} />
        </div>
        <div className="h-8 w-px bg-white/5" />
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">ai progress</p>
          <p className="text-[11px] text-slate-300">
            <span className="text-[#9B6CFF]">{statCounts.working} running</span> · <span className="text-amber-300">{statCounts.attention} need approval</span> · <span className="text-emerald-400">{statCounts.done} complete</span>
          </p>
        </div>
      </div>

      {/* floating CORE constellation — services → CORE → flow */}
      <CoreBlock servicesLive={servicesLive} coreLabel={coreLabel} />

      {/* yellow attention float — reason + one action */}
      {needsFocus.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/35 bg-amber-400/[0.04] px-4 py-3" style={{ boxShadow: '0 0 24px rgba(251,191,36,0.10)' }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 text-amber-300">
            <BellRing className="h-4 w-4 animate-pulse" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-amber-200">This project needs attention</p>
            <p className="truncate text-[10px] text-amber-200/60">
              {needsFocus.slice(0, 3).map((t) => t.title ?? 'Untitled task').join(' · ')}
            </p>
          </div>
          <Btn small kind="outline" onClick={onOpenTaskBoard}><ExternalLink className="h-3 w-3" /> Review</Btn>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1">
      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-[var(--text-main)]">
            <Boxes className="h-4 w-4 text-[var(--c-accent-text)]" /> Project flow
          </p>

          {/* Run / pause / stop */}
          <div className="ml-2 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => setRunState((s) => (s === 'running' ? 'paused' : 'running'))}
              title={runState === 'running' ? 'Pause the flow' : 'Run the flow'}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                runState === 'running' ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {runState === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{runState === 'running' ? 'Pause' : 'Run'}</span>
            </button>
            <button
              onClick={() => { setRunState('idle'); persist({ nodes: flow.nodes.map((n) => (n.kind === 'tool' ? { ...n, status: 'ready' } : n)), edges: flow.edges }); }}
              title="Stop — reset tools to ready"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${runState !== 'idle' ? 'text-rose-300 hover:bg-rose-500/10' : 'text-gray-500 hover:bg-white/10'}`}
            >
              <Square className="h-3 w-3" /> <span className="hidden sm:inline">Stop</span>
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1">
            {([['all', `All ${flow.nodes.length}`], ['working', `${statCounts.working} working`], ['attention', `${statCounts.attention} attention`], ['done', `${statCounts.done} done`]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${filter === key ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] border border-[var(--c-accent-border)]' : 'text-gray-500 hover:bg-white/5 border border-transparent'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-600" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find node…"
                className="w-28 rounded-lg border border-white/10 bg-[var(--input-bg)] py-1 pl-7 pr-2 text-[11px] text-white outline-none focus:border-[var(--c-accent-border)]"
              />
            </div>
            <span className="text-[10px] text-gray-600 tabular-nums">{Math.round(view.z * 100)}%</span>
            <button onClick={() => zoomAt(1)} className="rounded-md p-1 text-gray-500 hover:text-white hover:bg-white/5" title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button onClick={() => zoomAt(-1)} className="rounded-md p-1 text-gray-500 hover:text-white hover:bg-white/5" title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
            <button onClick={fit} className="rounded-md p-1 text-gray-500 hover:text-white hover:bg-white/5" title="Fit view"><Maximize2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-1.5">
          {STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-gray-600">drag in empty space to pan · drag a node to move it · wheel to zoom · double-click a tool to open it</span>
        </div>

        <div
          ref={containerRef}
          className="relative h-[560px] cursor-grab active:cursor-grabbing overflow-hidden touch-none select-none"
          style={{ background: 'radial-gradient(900px 420px at 50% 40%, var(--c-accent-soft), transparent 70%), #05060b' }}
          onPointerDown={onPointerDownBackground}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onDragOver={onDropToolOver}
          onDrop={onDropTool}
        >
          <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} width={size.w} height={size.h}>
            <defs>
              <pattern id={`grid-${project.id}`} width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.07)" />
              </pattern>
              <marker id={`arrow-${project.id}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill={accent} />
              </marker>
            </defs>

            {/* dotted grid, transforms with the view */}
            <rect x={view.x} y={view.y} width={size.w / view.z + 40} height={size.h / view.z + 40} transform={`translate(${view.x} ${view.y}) scale(${view.z})`} fill={`url(#grid-${project.id})`} />

            {/* group zones */}
            {groups.map((g) => (
              <g key={g.gid} transform={`translate(${g.x * view.z + view.x} ${g.y * view.z + view.y}) scale(${view.z})`}>
                <rect width={g.w} height={g.h} rx={16} fill={`${accent}0d`} stroke={`${accent}40`} strokeDasharray="6 5" />
                <text x={12} y={18} fontSize="10" fill={accent} opacity={0.85}>group · {g.count}</text>
              </g>
            ))}

            {/* curved lavender edges */}
            {flow.edges.map((e, i) => {
              const a = flow.nodes.find((n) => n.id === e.from);
              const b = flow.nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const ax = a.x * view.z + view.x, ay = a.y * view.z + view.y;
              const bx = b.x * view.z + view.x, by = b.y * view.z + view.y;
              const mx = (ax + bx) / 2;
              const selA = sel === a.id, selB = sel === b.id;
              const stA = nodeStatus(a), stB = nodeStatus(b);
              const live = stA === 'working' || stB === 'working';
              return (
                <path
                  key={i}
                  d={`M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`}
                  fill="none"
                  stroke={selA || selB ? accent : live ? `${accent}aa` : `${accent}55`}
                  strokeWidth={selA || selB ? 2.6 : 1.6}
                  strokeDasharray={live ? '6 5' : undefined}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${project.id})`}
                />
              );
            })}
          </svg>

          {flow.nodes.map((n) => {
            const st = nodeStatus(n);
            const x = n.x * view.z + view.x;
            const y = n.y * view.z + view.y;
            const isTool = n.kind === 'tool';
            const inFilter = visible(n);
            const inSearch = matchesSearch(n);
            const meta = STATUS_META[st] ?? STATUS_META.ready;
            const dim = filter !== 'all' && !inFilter ? 0.22 : !inSearch ? 0.35 : 1;
            return (
              <div
                key={n.id}
                onPointerDown={(e) => onPointerDownOnNode(e, n)}
                onDoubleClick={() => {
                  setSel(n.id);
                  if (isTool && selDef) router.push(selDef.page ?? '');
                }}
                title={n.label}
                className="absolute flex cursor-grab flex-col items-center active:cursor-grabbing"
                style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 10, opacity: dim }}
              >
                <div
                  className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-2 text-center shadow-xl backdrop-blur transition-colors ${isTool ? 'h-[86px] w-[118px]' : 'h-[66px] w-[114px]'} ${
                    sel === n.id ? 'bg-[#171722] ring-2' + meta.ring : 'bg-[#110f1d]/90 ring-1 ring-transparent'
                  }`}
                  style={{
                    borderColor: sel === n.id ? accent : st === 'error' ? '#f43f5e66' : `${accent}33`,
                    boxShadow: sel === n.id ? `0 0 26px ${accent}66` : st === 'working' ? `0 0 18px ${accent}33` : undefined,
                  }}
                >
                  <span className={`mb-1 flex h-2.5 w-2.5 items-center justify-center rounded-full ${meta.dot} ${st === 'working' ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{n.label}</span>
                  {isTool && <span className={`mt-0.5 text-center text-[9px] leading-tight ${st === 'error' ? 'text-rose-300' : st === 'done' ? 'text-emerald-300' : 'text-gray-500'}`}>{statusLabel(st)}{sel === n.id ? ' · selected' : ''}</span>}
                </div>
                <span className="mt-1 text-[9px] text-gray-600">{SEAL} · {Math.round(n.x)}, {Math.round(n.y)}</span>
              </div>
            );
          })}

          {/* Mini-map */}
          <div className="absolute bottom-3 right-3 z-20 h-[118px] w-[168px] overflow-hidden rounded-xl border border-white/10 bg-black/60 p-2 backdrop-blur">
            <MiniMap
              nodes={flow.nodes}
              view={view}
              size={size}
              accent={accent}
              onJump={(cx, cy) => setView({ z: view.z, x: size.w / 2 - cx * view.z, y: size.h / 2 - cy * view.z })}
            />
            <p className="pointer-events-none absolute left-2.5 bottom-1.5 text-[9px] text-gray-500">flow map</p>
          </div>

          {/* Inspector */}
          {selNode && (
            <div className="absolute bottom-4 left-4 z-20 w-72 rounded-xl border border-white/10 bg-[#12121c]/95 p-4 backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{selNode.label}</p>
                  <p className="text-[11px] text-gray-500">{selDef?.desc ?? 'Core project flow node.'}</p>
                </div>
                <button onClick={() => setSel(null)} className="text-gray-600 hover:text-white">✕</button>
              </div>
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-600">State</p>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s2) => (
                    <button key={s2} onClick={() => setStatus(selNode, s2)}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${nodeStatus(selNode) === s2 ? 'accent-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s2].dot}`} /> {STATUS_META[s2].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selDef?.page && (
                  <Btn small kind="ghost" onClick={() => router.push(selDef.page!)}><ExternalLink className="h-3 w-3" /> Open tool</Btn>
                )}
                {selNode.id === selNode.group ? null : selNode.group ? (
                  <Btn small kind="ghost" onClick={ungroupSelected}><Layers className="h-3 w-3" /> Ungroup</Btn>
                ) : (
                  <Btn small kind="ghost" onClick={groupSelected}><Layers className="h-3 w-3" /> Group</Btn>
                )}
                <Btn small kind="ghost" onClick={() => duplicateNode(selNode)}><Copy className="h-3 w-3" /> Duplicate</Btn>
                <Btn small kind="danger" onClick={() => removeNode(selNode)}>Remove</Btn>
              </div>
              <p className="mt-2 text-[10px] text-gray-600">Drag nodes · drag the canvas to pan · changes autosave.</p>
            </div>
          )}
        </div>
      </Card>
      </div>
      </div>

      {/* human side / ai side — words, not widgets */}
      <HumanAiSide
        project={project}
        tasks={tasks}
        executions={executions}
        connected={connected}
        now={now}
        onOpenTaskBoard={onOpenTaskBoard}
      />

      {/* special tool kits of these projects — the real orbital designs, fully exposed */}
      <section className="rounded-2xl border border-white/5 bg-[#080a11]/50 p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--c-accent-text)]">toolkits</p>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">Special tool kits of this project</h2>
          <span className="ml-auto text-[10px] text-gray-500">hover a tool · click to open it · add it into the flow with one tap</span>
        </div>
        <OrbitalKits
          tier={planTier}
          coreLabel={coreLabel}
          subtitle="System Intelligence Active"
          onAddTool={addOrbitalTool}
        />
      </section>

      {/* free space — new workflows & integrations land here first with a note and a verify */}
      <FreeSpaceNotes
        integrations={connected}
        onOpenIntegrations={() => router.push('/dashboard/integrations')}
      />

      {/* intake phase — accepted project files + the progress briefing for this project */}
      <div className="mt-6">
        <ProjectIntake projectId={project.id} compact coreLabel={coreLabel} />
      </div>

      {drawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0d0f18] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Add a tool to this flow</h2>
              <button onClick={() => setDrawer(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools…"
                className="w-full rounded-lg border border-white/10 bg-[var(--input-bg)] py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-[var(--c-accent-border)]" />
            </div>
            <div className="space-y-1.5">
              {TOOLS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase())).map((t) => (
                <button key={t.id} onClick={() => addTool(t)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    flow.nodes.some((n) => n.id === `t:${t.id}`) ? 'border-emerald-400/20 bg-emerald-400/5 opacity-50' : 'border-white/8 bg-white/4 hover:border-[var(--c-accent-border)] hover:bg-[var(--c-accent-soft)]'
                  }`}>
                  <Box className="h-4 w-4 shrink-0 text-[var(--c-accent-text)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-gray-200">{t.label}</span>
                    <span className="block text-[10px] text-gray-500">{t.desc}</span>
                  </span>
                  <span className="text-[10px] text-gray-600">{flow.nodes.some((n) => n.id === `t:${t.id}`) ? 'in flow' : 'add'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <Card className="w-full max-w-md p-5" >
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white">Project details</h2>
              {[
                { k: 'Status', v: project.status.replace('_', ' ') },
                { k: 'Category', v: project.category ?? '—' },
                { k: 'Toolkit tier', v: TIER_LABEL[project.tier ?? ''] ?? project.tier ?? 'Standard' },
                { k: 'Template', v: project.template ?? '—' },
                { k: 'Deadline', v: project.deadline ? new Date(project.deadline).toLocaleDateString() : '—' },
                { k: 'Created', v: new Date(project.createdAt).toLocaleDateString() },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">{r.k}</span>
                  <span className="text-xs text-gray-200">{r.v}</span>
                </div>
              ))}
              <Btn kind="outline" className="w-full" onClick={onBack}>Back to all projects</Btn>
            </div>
          </Card>
        </div>
      )}

      {notif && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/90 px-4 py-2 text-xs text-white shadow-2xl">
          {notif}
        </div>
      )}

      {aiOpen && (
        <ProjectStartAdvisor
          isNew={isNewProject}
          onAddTool={(t) => { addToolAt(t); }}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}

function MiniMap(props: {
  nodes: FlowNode[];
  view: View;
  size: { w: number; h: number };
  accent: string;
  onJump: (x: number, y: number) => void;
}) {
  const { nodes, view, size, accent, onJump } = props;
  const W = 152, H = 96, pad = 10;

  const map = useMemo(() => {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    const ox = (W - spanX * scale) / 2;
    const oy = (H - spanY * scale) / 2;
    const toMini = (X: number, Y: number) => ({ x: ox + (X - minX) * scale, y: oy + (Y - minY) * scale });
    const toWorld = (px: number, py: number) => ({ x: minX + (px - ox) / scale, y: minY + (py - oy) / scale });
    return { minX, minY, scale, toMini, toWorld };
  }, [nodes]);

  const vl = -view.x / view.z;
  const vt = -view.y / view.z;
  const vr = vl + size.w / view.z;
  const vb = vt + size.h / view.z;
  const rect = {
    left: map.toMini(vl, vt).x,
    top: map.toMini(vl, vt).y,
    width: (vr - vl) * map.scale,
    height: (vb - vt) * map.scale,
  };

  return (
    <div className="relative h-full w-full cursor-crosshair" onPointerDown={(e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const w = map.toWorld(e.clientX - r.left, e.clientY - r.top);
      onJump(w.x, w.y);
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        {nodes.map((n) => {
          const p = map.toMini(n.x, n.y);
          const isTool = n.kind === 'tool';
          return <circle key={n.id} cx={p.x} cy={p.y} r={isTool ? 3 : 4.5} fill={isTool ? accent : '#ffffff'} opacity={isTool ? 0.85 : 0.95} />;
        })}
      </svg>
      <div className="absolute rounded-md border border-white/40 bg-white/10 pointer-events-none" style={{ left: rect.left, top: rect.top, width: Math.max(8, rect.width), height: Math.max(6, rect.height) }} />
    </div>
  );
}

const TIER_LABEL: Record<string, string> = { normal: 'Standard', '1000': 'The $1,000 Special', '1600': 'The $1,600 Special' };

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const projects = useCollection<Project>('projects', {});
  const tasks = useCollection<Task>('tasks', {});
  const executions = useCollection<Execution>('executions', {});
  const integrations = useCollection<Integration>('integrations', {});

  const project = projects.rows.find((p) => p.id === id);
  const accent = project?.colour || '#8b5cf6';
  const connected = integrations.rows.filter((i) => i.connected || i.status === 'connected');

  if (!project) {
    return (
      <Card className="p-10">
        {projects.loading ? <Spinner label="Loading project…" /> : (
          <Empty title="Project not found" hint="It may have been deleted, or you landed on a bad link." />
        )}
        <div className="text-center"><Btn kind="outline" onClick={() => router.push('/dashboard/projects')}><ArrowLeft className="h-4 w-4" /> Back to projects</Btn></div>
      </Card>
    );
  }

  return (
    <FlowCanvas
      key={project.id}
      project={project}
      tasks={tasks.rows}
      executions={executions.rows}
      connected={connected}
      accent={accent}
      onBack={() => router.push('/dashboard/projects')}
      onOpenTaskBoard={() => router.push('/dashboard/tasks?projectId=' + project.id)}
    />
  );
}