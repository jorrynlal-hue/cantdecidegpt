'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, BarChart2, BarChart3, BookOpen, Bot, Brain, BrainCircuit, CalendarCheck2, CalendarClock, CalendarDays,
  CircleDollarSign, CircleHelp, Compass, Cpu, Crown, DollarSign, Eye, FileText, Film, FlaskConical, Gauge, Ghost, Globe2, Handshake,
  HeartHandshake, Home, Inbox, KeyRound, LifeBuoy, Link2, ListTodo, Lock, Megaphone, MessageCircleWarning, Monitor,
  PiggyBank, PlaneTakeoff, Radar, RefreshCw, RotateCcw, ScanSearch, Scale, Settings, Shield, ShieldCheck, Sparkles,
  Target, Truck, UserRound, UserSearch, Users, Wallet, Waypoints, Workflow, Wrench, Zap,
} from 'lucide-react';

const cn = (...cls: Array<string | false | undefined | null>) => cls.filter(Boolean).join(' ');

type ModuleId = string;

export interface ModuleMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  tagline: string;
  desc: string;
  color: string;
  ring: string;
  category: string;
  featured?: boolean;
}

const MODULES: ModuleMeta[] = [
  { id: 'executive', label: 'Executive', icon: Gauge, tagline: 'Executive Command Center', desc: 'The state of the whole company in one decision surface.', color: '#FF555C', ring: 'rgba(255,86,92,0.35)', category: 'govern', featured: true },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, tagline: 'Platform Admin Console', desc: 'Org, access, and platform controls for admins.', color: '#FF555C', ring: 'rgba(255,86,92,0.35)', category: 'govern' },
  { id: 'security', label: 'Security', icon: KeyRound, tagline: 'Security & compliance', desc: 'Threats detected and contained before you see them.', color: '#FF555C', ring: 'rgba(255,86,92,0.35)', category: 'govern' },
  { id: 'settings', label: 'Settings', icon: Settings, tagline: 'Organization & administration', desc: 'Org profile, team, and plan — plus real billing.', color: '#FF555C', ring: 'rgba(255,86,92,0.35)', category: 'govern' },
  { id: 'team', label: 'Team', icon: UserRound, tagline: 'Members, roles & seats', desc: 'Invite teammates, manage roles, switch accounts.', color: '#FFD700', ring: 'rgba(255,215,0,0.35)', category: 'govern', featured: true },
  { id: 'ai', label: 'AI', icon: Brain, tagline: 'AI Provider Hub', desc: 'Bring your own keys; route and monitor every model.', color: '#A764FF', ring: 'rgba(102,116,255,0.35)', category: 'command', featured: true },
  { id: 'tasks', label: 'Tasks', icon: CalendarCheck2, tagline: 'Task Calendar & execution', desc: 'Plan and run tasks on the calendar.', color: '#8174FF', ring: 'rgba(102,116,255,0.35)', category: 'command' },
  { id: 'projects', label: 'Projects', icon: Activity, tagline: 'Portfolio health & delivery', desc: 'Portfolio health, progress, and delivery risk.', color: '#5588FF', ring: 'rgba(102,116,255,0.35)', category: 'command' },
  { id: 'automation', label: 'Automation', icon: Workflow, tagline: 'Automation Studio', desc: 'Design workflows; AI executes, humans approve.', color: '#408DFF', ring: 'rgba(102,116,255,0.35)', category: 'command', featured: true },
  { id: 'integrations', label: 'Integrations', icon: Globe2, tagline: 'Integration Hub', desc: 'Connect the tools you already run.', color: '#7C6CFF', ring: 'rgba(102,116,255,0.35)', category: 'command' },
  { id: 'memory', label: 'Memory', icon: Bot, tagline: 'Business Memory', desc: 'Every meeting, contract, and decision, searchable.', color: '#6674FF', ring: 'rgba(102,116,255,0.35)', category: 'command', featured: true },
  { id: 'performer', label: 'Performer', icon: Sparkles, tagline: 'Describe it. It runs it.', desc: 'One chat orchestrates every module into an uninterrupted workflow.', color: '#B86CFF', ring: 'rgba(102,116,255,0.35)', category: 'command', featured: true },
  { id: 'website', label: 'Website', icon: Monitor, tagline: 'Website Optimization', desc: 'Audit, fix, and track search and AI readiness.', color: '#FF9A22', ring: 'rgba(255,156,50,0.35)', category: 'delivery' },
  { id: 'operations', label: 'Operations', icon: Truck, tagline: 'Delivery and daily execution', desc: 'Tickets, vendors, and daily delivery, executed by agents.', color: '#FF9B2C', ring: 'rgba(255,156,50,0.35)', category: 'delivery' },
  { id: 'finance', label: 'Finance', icon: Wallet, tagline: 'Revenue, cash, and risk', desc: 'Cash, receivables, and risk — reconciled continuously.', color: '#FF9A22', ring: 'rgba(255,156,50,0.35)', category: 'delivery' },
  { id: 'connect', label: 'Connect', icon: Link2, tagline: 'Your sites, socials & inboxes', desc: 'Your entire online presence linked and managed.', color: '#FF9A22', ring: 'rgba(255,156,50,0.35)', category: 'delivery', featured: true },
  { id: 'hr', label: 'HR', icon: Users, tagline: 'People, hiring, performance', desc: 'Headcount, recruiting, time off, and performance.', color: '#FFAA28', ring: 'rgba(255,156,50,0.35)', category: 'delivery' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, tagline: 'Campaigns & Social Command Center', desc: 'Plan, approve, publish, and measure every channel.', color: '#16E0A0', ring: 'rgba(24,217,160,0.35)', category: 'revenue' },
  { id: 'customers', label: 'Customers', icon: HeartHandshake, tagline: 'CRM & Global Customer Map', desc: 'Health, risk, and relationships across your book of business.', color: '#1BDDA3', ring: 'rgba(24,217,160,0.35)', category: 'revenue', featured: true },
  { id: 'sales', label: 'Sales', icon: Target, tagline: 'Pipeline, forecast, and revenue', desc: 'Deals, forecasts, and revenue ops, tracked automatically.', color: '#19DFA2', ring: 'rgba(24,217,160,0.35)', category: 'revenue' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, tagline: 'Metrics, reports, and funnels', desc: 'Every metric, one query away, always current.', color: '#13DFA0', ring: 'rgba(24,217,160,0.35)', category: 'revenue' },
  { id: 'reports', label: 'Reports', icon: FileText, tagline: 'Revenue, customer, operations & financial reports', desc: 'Comprehensive business reports with export and scheduling.', color: '#18DFA0', ring: 'rgba(24,217,160,0.35)', category: 'revenue' },
  { id: 'attribution', label: 'Attribution', icon: Waypoints, tagline: 'Sales Attribution & Research', desc: 'Which posts drove sales, who to target, and how to convert.', color: '#13DFA0', ring: 'rgba(24,217,160,0.35)', category: 'revenue', featured: true },
  { id: 'jworker', label: 'J Worker', icon: Cpu, tagline: 'AI Task Engine', desc: 'Connect AI services, automate tasks, dual engine.', color: '#A764FF', ring: 'rgba(167,100,255,0.35)', category: 'command', featured: true },
  { id: 'lifeadmin', label: 'Life Admin', icon: CalendarClock, tagline: 'Life Admin Autopilot', desc: 'Manages your life paperwork so you don\u2019t have to remember to.', color: '#FF6B9D', ring: 'rgba(255,107,157,0.35)', category: 'premium', featured: true },
  { id: 'inbox', label: 'Inbox Triage', icon: Inbox, tagline: 'The Inbox Triage', desc: 'Emails sorted, replies drafted, spam killed.', color: '#C084FC', ring: 'rgba(192,132,252,0.35)', category: 'premium', featured: true },
  { id: 'moneypeace', label: 'Money Peace', icon: PiggyBank, tagline: 'Money Peace of Mind', desc: 'A monthly plain-English memo — a friend checking in.', color: '#34D399', ring: 'rgba(52,211,153,0.35)', category: 'premium', featured: true },
  { id: 'errands', label: 'Errand Brain', icon: ListTodo, tagline: 'The Errand Brain', desc: 'Messy to-do list sequenced, booked, reminded autonomously.', color: '#FBBF24', ring: 'rgba(251,191,36,0.35)', category: 'premium', featured: true },
  { id: 'household', label: 'Household', icon: Home, tagline: 'Family/Household Coordinator', desc: 'Shared calendar, bills split, groceries restocked — quietly.', color: '#F472B6', ring: 'rgba(244,114,182,0.35)', category: 'premium', featured: true },
  { id: 'decisions', label: 'Decision Aid', icon: Scale, tagline: 'The Decision Assistant', desc: 'Feed it options, get a clear recommendation.', color: '#60A5FA', ring: 'rgba(96,165,250,0.35)', category: 'premium', featured: true },
  { id: 'weeklyrecap', label: 'Weekly Recap', icon: RotateCcw, tagline: 'Weekly Personal Recap', desc: 'What you got done, what\u2019s been sitting, one thing worth doing.', color: '#A78BFA', ring: 'rgba(167,139,250,0.35)', category: 'premium', featured: true },
  { id: 'fixer', label: 'The Fixer', icon: Wrench, tagline: 'The Fixer', desc: 'Type what\u2019s annoying you — it handles the call, chat, or email.', color: '#FB923C', ring: 'rgba(251,146,60,0.35)', category: 'premium', featured: true },
  { id: 'secondeyes', label: 'Second Eyes', icon: Eye, tagline: 'The Second Set of Eyes', desc: 'Forward any contract or bill — get a clear paragraph.', color: '#2DD4BF', ring: 'rgba(45,212,191,0.35)', category: 'premium', featured: true },
  { id: 'nudge', label: 'The Nudge', icon: Compass, tagline: 'The Nudge', desc: 'Watches what you keep not doing — pushes one thing, zero guilt.', color: '#F87171', ring: 'rgba(248,113,113,0.35)', category: 'premium', featured: true },
  { id: 'buffer', label: 'The Buffer', icon: Shield, tagline: 'The Buffer', desc: 'Stressful message lands — draft reply, calm tone, ready to send.', color: '#818CF8', ring: 'rgba(129,140,248,0.35)', category: 'premium', featured: true },
  { id: 'shadowfounder', label: 'Shadow Founder', icon: Ghost, tagline: 'The Shadow Founder', desc: 'Nightly memo in the voice of a seasoned operator.', color: '#E879F9', ring: 'rgba(232,121,249,0.35)', category: 'pro-premium', featured: true },
  { id: 'competitorshadow', label: 'Competitor Shadow', icon: Radar, tagline: 'Competitor Shadow Mode', desc: 'Tracks pricing, hires, website changes — surfaces only what matters.', color: '#F43F5E', ring: 'rgba(244,63,94,0.35)', category: 'pro-premium', featured: true },
  { id: 'secondbrain', label: 'Second Brain', icon: BrainCircuit, tagline: 'The Second Brain Interview', desc: 'Monthly voice interview that retunes every module to how you think.', color: '#A78BFA', ring: 'rgba(167,139,250,0.35)', category: 'pro-premium', featured: true },
  { id: 'ghostmode', label: 'Ghost Mode', icon: PlaneTakeoff, tagline: 'Ghost Mode', desc: 'Flip a switch, it runs the business while you\u2019re gone.', color: '#22D3EE', ring: 'rgba(34,211,238,0.35)', category: 'pro-premium', featured: true },
  { id: 'rescuebutton', label: 'Rescue Button', icon: LifeBuoy, tagline: 'The Rescue Button', desc: 'Overwhelmed? One tap triages everything into a 3-item list.', color: '#EF4444', ring: 'rgba(239,68,68,0.35)', category: 'pro-premium', featured: true },
  { id: 'proofreel', label: 'Proof-of-Work', icon: Film, tagline: 'Proof-of-Work Reel', desc: 'Auto-generated monthly highlight reel.', color: '#F97316', ring: 'rgba(249,115,22,0.35)', category: 'pro-premium', featured: true },
  { id: 'closer', label: 'The Closer', icon: CircleDollarSign, tagline: 'The Closer', desc: 'Autonomous follow-up engine — chases leads, invoices, no-shows.', color: '#10B981', ring: 'rgba(16,185,129,0.35)', category: 'pro-premium', featured: true },
  { id: 'scheduler', label: 'The Scheduler', icon: CalendarDays, tagline: 'The Scheduler', desc: 'Owns your calendar — negotiates, blocks focus, rebalances.', color: '#6366F1', ring: 'rgba(99,102,241,0.35)', category: 'pro-premium', featured: true },
  { id: 'bookkeeperlite', label: 'Bookkeeper Lite', icon: BookOpen, tagline: 'The Bookkeeper Lite', desc: 'Categorizes transactions, flags anomalies, plain-English memo.', color: '#14B8A6', ring: 'rgba(20,184,166,0.35)', category: 'pro-premium', featured: true },
  { id: 'recruiter', label: 'The Recruiter', icon: UserSearch, tagline: 'The Recruiter', desc: 'Describe a role in one sentence — it drafts, screens, shortlists 3.', color: '#8B5CF6', ring: 'rgba(139,92,246,0.35)', category: 'pro-premium', featured: true },
  { id: 'negotiator', label: 'The Negotiator', icon: Handshake, tagline: 'The Negotiator', desc: 'Handles vendor/client back-and-forth within your boundaries.', color: '#0EA5E9', ring: 'rgba(14,165,233,0.35)', category: 'pro-premium', featured: true },
  { id: 'researcher', label: 'The Researcher', icon: FlaskConical, tagline: 'The Researcher', desc: 'One-line brief to structured list with contacts.', color: '#06B6D4', ring: 'rgba(6,182,212,0.35)', category: 'pro-premium', featured: true },
  { id: 'weeklyops', label: 'Weekly Ops', icon: BarChart2, tagline: 'Weekly Ops Report', desc: 'Monday brief: handled, needs a decision, one flagged risk.', color: '#84CC16', ring: 'rgba(132,204,22,0.35)', category: 'pro-premium', featured: true },
  { id: 'autorenego', label: 'Auto Renegotiate', icon: RefreshCw, tagline: 'Autonomous Renegotiation', desc: 'Actively renegotiates vendor contracts and SaaS rates.', color: '#F59E0B', ring: 'rgba(245,158,11,0.35)', category: 'pro-premium', featured: true },
  { id: 'silentresponse', label: 'Silent Response', icon: MessageCircleWarning, tagline: 'Silent Competitor Response', desc: 'Competitor moves → drafted counter-offer, ready for one-tap.', color: '#EC4899', ring: 'rgba(236,72,153,0.35)', category: 'pro-premium', featured: true },
  { id: 'decaydetect', label: 'Decay Detect', icon: ScanSearch, tagline: 'Relationship Decay Detection', desc: 'Predicts which relationships are dying before they churn.', color: '#F472B6', ring: 'rgba(244,114,182,0.35)', category: 'pro-premium', featured: true },
  { id: 'rootcause', label: 'Root Cause', icon: CircleHelp, tagline: 'Cross-Module Root Cause', desc: 'Revenue dipped? Traces it across CRM, finance, ops.', color: '#38BDF8', ring: 'rgba(56,189,248,0.35)', category: 'pro-premium', featured: true },
  { id: 'pricingexperiments', label: 'Pricing Experiments', icon: DollarSign, tagline: 'Autonomous Pricing', desc: 'A/B tests pricing on real traffic, auto-adopts the winner.', color: '#22C55E', ring: 'rgba(34,197,94,0.35)', category: 'pro-premium', featured: true },
  { id: 'consultantbutton', label: 'Consultant Button', icon: Zap, tagline: '$500/hr Consultant', desc: 'One button: opinionated, consultant-grade advice.', color: '#D946EF', ring: 'rgba(217,70,239,0.35)', category: 'pro-premium', featured: true },
];

const MODULE_MAP = new Map(MODULES.map((m) => [m.id, m]));

const BUSINESS_MODULES = MODULES.filter((m) => m.category !== 'premium' && m.category !== 'pro-premium');
const PREMIUM_MODULES = MODULES.filter((m) => m.category === 'premium');
const PRO_PREMIUM_MODULES = MODULES.filter((m) => m.category === 'pro-premium');

const STATUS_COLORS: Record<string, string> = {
  healthy: '#34d399',
  warning: '#fbbf24',
  critical: '#ef4444',
  active: '#60a5fa',
  ai: '#a78bfa',
};

const CORE_HOVER_DATA: Record<string, { lines: string[]; status: string }> = {
  executive: { lines: ['12 priorities today', '4 decisions pending', '3 recommendations'], status: 'active' },
  sales: { lines: ['$84.2K pipeline', '7 active deals', '2 closing this week'], status: 'healthy' },
  marketing: { lines: ['12 campaigns active', '$18.4K attributed revenue', '3 actions recommended'], status: 'active' },
  customers: { lines: ['94% satisfaction rate', '3 at-risk accounts', '12 new leads'], status: 'warning' },
  finance: { lines: ['Revenue: $84,200', 'Expenses: $21,400', 'Margin: 74.6%'], status: 'healthy' },
  operations: { lines: ['18 tasks in progress', '94% on-time rate', '2 vendors pending'], status: 'healthy' },
  hr: { lines: ['12 team members', '1 open position', '98% retention'], status: 'healthy' },
  projects: { lines: ['5 active projects', '2 at risk', '87% delivery rate'], status: 'warning' },
  automation: { lines: ['18 automations running', '99.2% success rate', '3 workflows queued'], status: 'active' },
  ai: { lines: ['3 AI providers active', '847 API calls today', 'Cost: $2.40'], status: 'ai' },
  memory: { lines: ['2,847 entries indexed', '12 new this week', '98% search accuracy'], status: 'ai' },
  analytics: { lines: ['24 reports generated', '3 anomalies detected', 'Trends: ↑12%'], status: 'healthy' },
  reports: { lines: ['Revenue report ready', '128 customers tracked', 'Export available'], status: 'healthy' },
  website: { lines: ['99.8% uptime', '2.1s load time', 'SEO score: 94'], status: 'healthy' },
  integrations: { lines: ['8 connected', '2 need setup', 'Last sync: 2m ago'], status: 'active' },
  security: { lines: ['0 threats detected', 'All keys rotated', 'Last audit: 3d ago'], status: 'healthy' },
  settings: { lines: ['Organization verified', '3 pending updates', 'Billing active'], status: 'healthy' },
  performer: { lines: ['47 workflows completed', '98% success rate', 'Avg time: 12s'], status: 'ai' },
  connect: { lines: ['6 properties linked', 'All accounts active', 'Last post: 2h ago'], status: 'active' },
  admin: { lines: ['Platform healthy', '12 members active', 'No issues'], status: 'healthy' },
  tasks: { lines: ['8 tasks today', '3 completed', '2 overdue'], status: 'warning' },
  jworker: { lines: ['Dual engine active', 'Chrome + API ready', 'Pro exclusive'], status: 'ai' },
  team: { lines: ['8 members active', '2 pending invites', '10 seats total'], status: 'healthy' },
  attribution: { lines: ['8 posts tracked', '$51,800 revenue', '4.2% avg CVR'], status: 'healthy' },
};

const PREMIUM_DATA: Record<string, { lines: string[]; status: string }> = {
  lifeadmin: { lines: ['3 subscriptions monitored', '1 price hike detected', '1 trial expiring soon'], status: 'active' },
  inbox: { lines: ['3 need you', '12 handled auto', '5 replies drafted'], status: 'active' },
  moneypeace: { lines: ['Takeout up 18%', 'On track to save $2,400', '1 unused sub found'], status: 'warning' },
  errands: { lines: ['7 tasks sequenced', '3 booked auto', '2 need you'], status: 'healthy' },
  household: { lines: ['4 calendars synced', 'Bills split 50/50', 'Groceries restocked'], status: 'healthy' },
  decisions: { lines: ['2 decisions pending', 'Insurance compared', 'Recommendation ready'], status: 'active' },
  weeklyrecap: { lines: ['14 tasks done', '2 sitting 2+ weeks', '1 weekend suggestion'], status: 'healthy' },
  fixer: { lines: ['2 issues handled', 'Gym cancel in progress', '1 waiting on company'], status: 'active' },
  secondeyes: { lines: ['1 contract reviewed', '2 red flags found', '1 bill dispute ready'], status: 'warning' },
  nudge: { lines: ['1 task nudged today', 'Passport renewal queued', 'Zero guilt, zero spam'], status: 'healthy' },
  buffer: { lines: ['1 stress reply drafted', 'Tone calmed & ready', 'Sent on your approval'], status: 'active' },
};

const PRO_PREMIUM_DATA: Record<string, { lines: string[]; status: string }> = {
  shadowfounder: { lines: ['Ghost profile active', '3 ventures scouted quietly', 'Zero trace left'], status: 'active' },
  competitorshadow: { lines: ['5 rivals tracked', '2 price changes detected', 'Weekly intel brief ready'], status: 'active' },
  secondbrain: { lines: ['247 notes captured', '12 linked insights', 'Recall ready on demand'], status: 'healthy' },
  ghostmode: { lines: ['Flight + stay booked', 'Identity shielded', 'Itinerary synced'], status: 'active' },
  rescuebutton: { lines: ['1 crisis defused today', 'Avg response 42s', 'Escalation armed'], status: 'healthy' },
  proofreel: { lines: ['9 wins captured on film', 'Reel auto-edited', 'Share link live'], status: 'healthy' },
  closer: { lines: ['3 deals in pipeline', 'Follow-up sent auto', '$12k about to close'], status: 'active' },
  scheduler: { lines: ['18 meetings placed', '2 conflicts resolved', 'Focus blocks protected'], status: 'healthy' },
  bookkeeperlite: { lines: ['41 txns categorized', '1 duplicate flagged', 'Books balanced'], status: 'warning' },
  recruiter: { lines: ['14 candidates sourced', '3 screened overnight', '1 interview set'], status: 'active' },
  negotiator: { lines: ['Counter-offer drafted', 'Anchor set 15% higher', 'Script ready to send'], status: 'active' },
  researcher: { lines: ['6 sources vetted', 'Brief compiled', 'Citations checked'], status: 'healthy' },
  weeklyops: { lines: ['Ops score 87/100', '3 bottlenecks found', 'Next week plan ready'], status: 'healthy' },
  autorenego: { lines: ['2 contracts due', 'Renewal paused', 'Savings projected $1,900'], status: 'warning' },
  silentresponse: { lines: ['4 competitor moves tracked', 'Counter-offer drafted same day', 'Awaiting one-tap send'], status: 'active' },
  decaydetect: { lines: ['1 client cooling off', 'Engagement down 22%', 'Win-back drafted'], status: 'warning' },
  rootcause: { lines: ['Issue traced to source', '3 fixes ranked', 'Postmortem filed'], status: 'healthy' },
  pricingexperiments: { lines: ['Test B winning +11%', '2 price points live', 'Rollout suggested'], status: 'active' },
  consultantbutton: { lines: ['Expert matched', 'Callback in 10 min', 'Context pre-loaded'], status: 'healthy' },
};

const ZONE_META = [
  { label: 'GOVERN', color: '#FF565C', x: '8%', y: '8%' },
  { label: 'COMMAND', color: '#6674FF', x: '78%', y: '8%' },
  { label: 'DELIVERY', color: '#FF9C32', x: '8%', y: '88%' },
  { label: 'REVENUE', color: '#18D9A0', x: '78%', y: '88%' },
] as const;

function planFilterFor(tier?: string): string[] | undefined {
  if (tier === '1600') return undefined;
  const core = BUSINESS_MODULES.map((m) => m.id);
  if (tier === '1000') return [...core, ...PREMIUM_MODULES.map((m) => m.id)];
  return core;
}

const STEPS_FOR_CATEGORY: Record<string, string[]> = {
  govern: ['Review the current state shown by the module', 'Approve the pending decisions', 'Apply the change and it ripples through the map'],
  command: ['Connect your AI / service providers', 'Describe the outcome in plain words', 'Let agents execute and stop at your approvals'],
  delivery: ['Queue the work into the module', 'Press run (or let it run on schedule)', 'Approve the handoff when it lands'],
  revenue: ['Point the module at the channel', 'Watch it attribute and report', 'Scale what works, stop what doesn\u2019t'],
  premium: ['Switch the tool on', 'Feed it the messy list once', 'Review the quiet, sorted answers it gives'],
  'pro-premium': ['Enable the module in this flagship kit', 'Give it a single instruction', 'Read its daily memo and give the one-tap yes'],
};

function stepsFor(m: ModuleMeta): string[] {
  return STEPS_FOR_CATEGORY[m.category] ?? STEPS_FOR_CATEGORY.command;
}

function linesFor(m: ModuleMeta): string[] {
  const pool = m.category === 'pro-premium' ? PRO_PREMIUM_DATA : m.category === 'premium' ? PREMIUM_DATA : CORE_HOVER_DATA;
  return pool[m.id]?.lines ?? ['Watching this module', 'Waiting for signal', 'One instruction away'];
}

const darkBox = 'rounded-xl border border-white/10 bg-[rgba(16,19,28,0.96)] shadow-[0_10px_34px_rgba(0,0,0,0.5)]';

/* ---------------- CORE ORBITAL ---------------- */

const CX = 350;
const CY = 310;
const ORBIT_R = 270;
const CORES = placeholderPositions(BUSINESS_MODULES, CX, CY, ORBIT_R);
const PREM_POS = placeholderPositions(PREMIUM_MODULES, 250, 250, 200);
const PRO_POS = placeholderPositions(PRO_PREMIUM_MODULES, 300, 300, 250);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function placeholderPositions(modules: any[], cx: number, cy: number, r: number) {
  const step = (2 * Math.PI) / modules.length;
  return modules.map((m, i) => {
    const a = -Math.PI / 2 + i * step;
    return { m, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

function CoreRings() {
  return (
    <>
      <circle cx={CX} cy={CY} r={130} fill="none" stroke="#2276D9" strokeWidth={1} strokeOpacity={0.18} className="jbos-breathe" style={{ animationDuration: '4s' }} />
      <circle cx={CX} cy={CY} r={190} fill="none" stroke="#3155A8" strokeWidth={1} strokeOpacity={0.14} className="jbos-breathe" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
      <circle cx={CX} cy={CY} r={250} fill="none" stroke="#385A91" strokeWidth={1} strokeOpacity={0.1} className="jbos-breathe" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <circle cx={CX} cy={CY} r={300} fill="none" stroke="#385A91" strokeWidth={1} strokeOpacity={0.06} className="jbos-breathe" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
    </>
  );
}

function CoreActiveRing() {
  return (
    <g className="jbos-active-ring" style={{ transformOrigin: `${CX}px ${CY}px` }}>
      <circle cx={CX} cy={CY} r={220} fill="none" stroke="#2276D9" strokeWidth={1} strokeOpacity={0.12} />
      <circle cx={CX} cy={CY} r={220} fill="none" stroke="url(#activeRingGrad)" strokeWidth={1.5} strokeDasharray="80 1300" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={3} fill="#47C9FF" opacity={0.9}>
        <animateMotion dur="34s" repeatCount="indefinite" path={`M${CX},${CY - 220} A220,220 0 1 1 ${CX - 0.01},${CY - 220}`} />
      </circle>
    </g>
  );
}

function CoreNode({
  m,
  x,
  y,
  isHovered,
  isLocked,
  onOpen,
  onHover,
}: {
  m: ModuleMeta;
  x: number;
  y: number;
  isHovered: boolean;
  isLocked: boolean;
  onOpen: (m: ModuleMeta) => void;
  onHover: (m: ModuleId | null) => void;
}) {
  const featured = m.featured && !isLocked;
  const status = CORE_HOVER_DATA[m.id]?.status ?? 'healthy';
  const Icon = m.icon;
  return (
    <g className="group" style={isLocked ? { opacity: 0.3 } : undefined}>
      {featured && (
        <>
          <circle cx={x} cy={y} r={40} fill="none" stroke="url(#crownGlowGrad)" strokeWidth={1.5} strokeOpacity={isHovered ? 0.7 : 0.35} className="jbos-breathe" style={{ animationDuration: '3s' }} />
          <circle cx={x} cy={y} r={36} fill="rgba(167,100,255,0.08)" stroke="rgba(167,100,255,0.3)" strokeWidth={0.5} />
        </>
      )}
      <foreignObject x={x - 32} y={y - 32} width={64} height={64}>
        <button
          onClick={() => onOpen(m)}
          onMouseEnter={() => onHover(m.id)}
          onMouseLeave={() => onHover(null)}
          className={cn(
            isLocked
              ? 'flex h-16 w-16 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] opacity-50'
              : featured
                ? 'flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(167,100,255,0.4)] bg-gradient-to-b from-[rgba(167,100,255,0.15)] to-[rgba(167,100,255,0.05)] shadow-[0_0_20px_rgba(167,100,255,0.15)]'
                : 'flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[rgba(40,44,55,0.95)] to-[rgba(30,33,42,0.95)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
            isLocked ? '' : 'transition-transform hover:-translate-y-0.5 hover:scale-105',
          )}
        >
          {isLocked ? (
            <Lock className="h-5 w-5 text-white/20" />
          ) : (
            <>
              <Icon className="h-5 w-5" style={{ color: m.color }} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[status] ?? '#34d399', boxShadow: `0 0 6px ${(STATUS_COLORS[status] ?? '#34d399')}55` }} />
            </>
          )}
        </button>
      </foreignObject>
      {featured && (
        <foreignObject x={x + 16} y={y - 40} width={24} height={24}>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_8px_rgba(255,215,0,0.5)]">
            <Crown className="h-3 w-3 text-[#1a0a2e]" strokeWidth={2.5} />
          </div>
        </foreignObject>
      )}
      <text x={x} y={y + 38} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '11px', fontWeight: featured ? 700 : 500, fill: isLocked ? '#666' : featured ? '#C9A0FF' : isHovered ? '#fff' : '#9AAAC4', transition: 'fill 0.2s' }}>
        {m.label}
      </text>
      {featured && (
        <text x={x} y={y + 50} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '7px', fontWeight: 700, fill: 'rgba(167,100,255,0.6)', letterSpacing: '0.12em' }}>
          {isLocked ? 'LOCKED' : 'PRO EXCLUSIVE'}
        </text>
      )}
      {isLocked && (
        <text x={x} y={y + 50} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '7px', fontWeight: 700, fill: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
          LOCKED
        </text>
      )}
    </g>
  );
}

function CoreCenter({ onOpen, coreLabel, subtitle }: { onOpen: (m: ModuleMeta) => void; coreLabel: string; subtitle: string }) {
  return (
    <foreignObject x={CX - 70} y={CY - 70} width={140} height={140}>
      <button
        onClick={() => onOpen(MODULE_MAP.get('executive') ?? BUSINESS_MODULES[0])}
        className="jbos-core-gradient jbos-core-glow jbos-core-breathe absolute left-0 top-0 z-20 flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full"
      >
        <span className="text-[10px] font-bold tracking-[0.22em] text-slate-500">{coreLabel}</span>
        <span className="text-[22px] font-bold tracking-[0.10em] text-slate-200">CORE</span>
        <span className="mt-0.5 flex items-center gap-1 text-[8px] text-[#18DFA0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#18DFA0] shadow-[0_0_6px_rgba(24,223,160,0.5)]" />
          LIVE
        </span>
        <span className="text-[7px] text-slate-500">{subtitle}</span>
      </button>
    </foreignObject>
  );
}

function KitTooltip({
  hovered,
  onOpen,
  planFilter,
}: {
  hovered: ModuleId | null;
  onOpen: (m: ModuleMeta) => void;
  planFilter?: string[];
}) {
  const data = hovered ? (CORE_HOVER_DATA[hovered] ?? PREMIUM_DATA[hovered] ?? PRO_PREMIUM_DATA[hovered]) : null;
  const meta = hovered ? MODULE_MAP.get(hovered) : null;
  if (!hovered || !data || !meta) return null;
  const isLocked = !!planFilter && !planFilter.includes(hovered);
  const status = data.status;
  return (
    <div className={`pointer-events-auto absolute left-1/2 top-4 z-30 w-60 -translate-x-1/2 p-3.5 shadow-xl backdrop-blur-md ${darkBox}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: isLocked ? '#666' : STATUS_COLORS[status] }} />
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.tagline}</span>
        {isLocked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">
            <Lock className="h-2 w-2" /> Locked
          </span>
        )}
        {meta.featured && !isLocked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[rgba(255,215,0,0.25)] bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(167,100,255,0.15)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#FFD700]">
            <Crown className="h-2 w-2" /> Pro
          </span>
        )}
      </div>
      <span className="mb-2 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase" style={{ background: isLocked ? 'rgba(102,102,102,0.1)' : `${STATUS_COLORS[status] ?? '#34d399'}18`, color: isLocked ? '#666' : STATUS_COLORS[status] ?? '#34d399' }}>
        {isLocked ? 'locked' : status}
      </span>
      <ul className="mb-2.5 space-y-1">
        {data.lines.map((l, i) => (
          <li key={i} className="text-[11px] text-slate-400">{l}</li>
        ))}
      </ul>
      {isLocked ? (
        <div className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.02] py-1.5 text-[10px] font-semibold text-white/30">
          <Lock className="h-3 w-3" /> Upgrade to unlock
        </div>
      ) : (
        <button
          onClick={() => onOpen(meta)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(40,44,55,0.95)] py-1.5 text-[10px] font-semibold text-slate-400 transition hover:border-[rgba(255,255,255,0.15)] hover:text-slate-200"
        >
          Open {meta.label}
        </button>
      )}
    </div>
  );
}

export function OrbitalCore({
  onOpen,
  planFilter,
  coreLabel,
  subtitle,
}: {
  onOpen: (m: ModuleMeta) => void;
  planFilter?: string[];
  coreLabel: string;
  subtitle: string;
}) {
  const [hovered, setHovered] = useState<ModuleId | null>(null);
  return (
    <div className="flex justify-center">
      <div className="relative h-[620px] w-full max-w-[700px]">
        <div className="jbos-grid-bg absolute inset-0 opacity-15" />
        <svg viewBox="0 0 700 620" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="activeRingGrad">
              <stop offset="0%" stopColor="#1E75FF" />
              <stop offset="40%" stopColor="#4B5CFF" />
              <stop offset="70%" stopColor="#7B42F2" />
              <stop offset="100%" stopColor="#19CFFF" />
            </linearGradient>
            <linearGradient id="crownGlowGrad">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#A764FF" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          <CoreRings />
          <CoreActiveRing />
          {CORES.map(({ m, x, y }) => (
            <line key={`line-${m.id}`} x1={CX} y1={CY} x2={x} y2={y} stroke={m.ring} strokeWidth={0.8} strokeOpacity={hovered === m.id ? 0.35 : 0.15} strokeDasharray="2 6" style={{ transition: 'stroke-opacity 0.3s' }} />
          ))}
          {CORES.map(({ m, x, y }) => (
            <CoreNode
              key={m.id}
              m={m}
              x={x}
              y={y}
              isHovered={hovered === m.id}
              isLocked={!!planFilter && !planFilter.includes(m.id)}
              onOpen={onOpen}
              onHover={setHovered}
            />
          ))}
          <CoreCenter onOpen={onOpen} coreLabel={coreLabel} subtitle={subtitle} />
        </svg>
        {ZONE_META.map((z) => (
          <span key={z.label} className="pointer-events-none absolute text-[8px] font-bold uppercase tracking-[0.18em]" style={{ left: z.x, top: z.y, color: `${z.color}66` }}>
            {z.label}
          </span>
        ))}
        <KitTooltip hovered={hovered} onOpen={onOpen} planFilter={planFilter} />
      </div>
    </div>
  );
}

/* ---------------- PREMIUM ORBITAL ---------------- */

function PremiumRings() {
  return (
    <>
      <circle cx={250} cy={250} r={100} fill="none" stroke="#FF6B9D" strokeWidth={1} strokeOpacity={0.15} className="jbos-breathe" style={{ animationDuration: '4s' }} />
      <circle cx={250} cy={250} r={150} fill="none" stroke="#C084FC" strokeWidth={1} strokeOpacity={0.12} className="jbos-breathe" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
      <circle cx={250} cy={250} r={200} fill="none" stroke="#818CF8" strokeWidth={1} strokeOpacity={0.08} className="jbos-breathe" style={{ animationDuration: '6s', animationDelay: '1s' }} />
    </>
  );
}

function PremiumActiveRing() {
  return (
    <g className="jbos-active-ring" style={{ transformOrigin: '250px 250px' }}>
      <circle cx={250} cy={250} r={175} fill="none" stroke="url(#premiumRingGrad)" strokeWidth={1.5} strokeDasharray="60 1000" strokeLinecap="round" />
      <circle cx={250} cy={250} r={2} fill="#FF6B9D" opacity={0.9}>
        <animateMotion dur="28s" repeatCount="indefinite" path="M250,75 A175,175 0 1 1 249.99,75" />
      </circle>
    </g>
  );
}

function PremiumNode({ m, x, y, isHovered, isLocked, onOpen, onHover }: {
  m: ModuleMeta; x: number; y: number; isHovered: boolean; isLocked: boolean;
  onOpen: (m: ModuleMeta) => void; onHover: (m: ModuleId | null) => void;
}) {
  const Icon = m.icon;
  return (
    <g className="group" style={isLocked ? { opacity: 0.3 } : undefined}>
      {!isLocked && (
        <>
          <circle cx={x} cy={y} r={32} fill="none" stroke="url(#premiumGlowGrad)" strokeWidth={1.2} strokeOpacity={isHovered ? 0.6 : 0.3} className="jbos-breathe" style={{ animationDuration: '3s' }} />
          <circle cx={x} cy={y} r={28} fill="rgba(255,107,157,0.06)" stroke="rgba(255,107,157,0.25)" strokeWidth={0.5} />
        </>
      )}
      <foreignObject x={x - 26} y={y - 26} width={52} height={52}>
        <button
          onClick={() => onOpen(m)}
          onMouseEnter={() => onHover(m.id)}
          onMouseLeave={() => onHover(null)}
          className={cn(
            isLocked
              ? 'flex h-[52px] w-[52px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] opacity-50'
              : 'flex h-[52px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(255,107,157,0.3)] bg-gradient-to-b from-[rgba(255,107,157,0.12)] to-[rgba(255,107,157,0.04)] shadow-[0_0_16px_rgba(255,107,157,0.12)] transition-transform hover:-translate-y-0.5 hover:scale-105',
          )}
        >
          {isLocked ? <Lock className="h-4 w-4 text-white/20" /> : <Icon className="h-4 w-4" style={{ color: m.color }} />}
        </button>
      </foreignObject>
      {!isLocked && (
        <foreignObject x={x + 12} y={y - 32} width={20} height={20}>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_6px_rgba(255,215,0,0.5)]">
            <Crown className="h-2.5 w-2.5 text-[#1a0a2e]" strokeWidth={2.5} />
          </div>
        </foreignObject>
      )}
      <text x={x} y={y + 34} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '9px', fontWeight: isLocked ? 500 : 700, fill: isLocked ? '#666' : isHovered ? '#fff' : '#FFB4C8', transition: 'fill 0.2s' }}>
        {m.label}
      </text>
      {!isLocked && (
        <text x={x} y={y + 44} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '6px', fontWeight: 700, fill: 'rgba(255,215,0,0.6)', letterSpacing: '0.12em' }}>
          $1000 PLAN
        </text>
      )}
    </g>
  );
}

function PremiumCenter({ onOpen }: { onOpen: (m: ModuleMeta) => void }) {
  return (
    <foreignObject x={192} y={192} width={116} height={116}>
      <button
        onClick={() => onOpen(PREMIUM_MODULES[0])}
        className="jbos-core-breathe absolute left-0 top-0 z-20 flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,157,0.2) 0%, rgba(255,107,157,0.05) 60%, transparent 80%)',
          border: '1px solid rgba(255,107,157,0.25)',
          boxShadow: '0 0 30px rgba(255,107,157,0.15), inset 0 0 20px rgba(255,107,157,0.05)',
        }}
      >
        <span className="text-[8px] font-bold tracking-[0.22em] text-[#FF6B9D]">CDG</span>
        <span className="text-[13px] font-black tracking-[0.06em] text-[#FFD700]">$1000</span>
        <span className="text-[8px] font-bold tracking-[0.12em] text-[#FF6B9D]">PREMIUMS</span>
        <span className="mt-1 max-w-[90px] text-center text-[6px] leading-tight" style={{ color: 'rgba(255,180,200,0.6)' }}>
          For any normal to high thinker individual
        </span>
      </button>
    </foreignObject>
  );
}

function PremiumTooltip({ hovered, onOpen, planFilter }: { hovered: ModuleId | null; onOpen: (m: ModuleMeta) => void; planFilter?: string[] }) {
  const data = hovered ? PREMIUM_DATA[hovered] : null;
  const meta = hovered ? MODULE_MAP.get(hovered) : null;
  if (!hovered || !data || !meta) return null;
  const isLocked = !!planFilter && !planFilter.includes(hovered);
  const status = data.status;
  return (
    <div className={`pointer-events-auto absolute left-1/2 top-3 z-30 w-56 -translate-x-1/2 p-3 shadow-xl backdrop-blur-md ${darkBox}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: isLocked ? '#666' : STATUS_COLORS[status] }} />
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.tagline}</span>
        {isLocked ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">
            <Lock className="h-2 w-2" /> Locked
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[rgba(255,215,0,0.25)] bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(167,100,255,0.15)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#FFD700]">
            <Crown className="h-2 w-2" /> Premium
          </span>
        )}
      </div>
      <ul className="mb-2.5 space-y-1">
        {data.lines.map((l, i) => (
          <li key={i} className="text-[11px] text-slate-400">{l}</li>
        ))}
      </ul>
      {isLocked ? (
        <div className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.02] py-1.5 text-[10px] font-semibold text-white/30">
          <Lock className="h-3 w-3" /> Upgrade to unlock
        </div>
      ) : (
        <button
          onClick={() => onOpen(meta)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(40,44,55,0.95)] py-1.5 text-[10px] font-semibold text-slate-400 transition hover:border-[rgba(255,255,255,0.15)] hover:text-slate-200"
        >
          Open {meta.label}
        </button>
      )}
    </div>
  );
}

export function OrbitalPremium({ onOpen, planFilter }: { onOpen: (m: ModuleMeta) => void; planFilter?: string[] }) {
  const [hovered, setHovered] = useState<ModuleId | null>(null);
  return (
    <div className="flex justify-center">
      <div className="relative h-[500px] w-full max-w-[500px]">
        <div className="jbos-grid-bg absolute inset-0 opacity-10" />
        <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="premiumRingGrad">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="40%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="premiumGlowGrad">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
          </defs>
          <PremiumRings />
          <PremiumActiveRing />
          {PREM_POS.map(({ m, x, y }) => (
            <line key={`line-${m.id}`} x1={250} y1={250} x2={x} y2={y} stroke={m.ring} strokeWidth={0.8} strokeOpacity={hovered === m.id ? 0.4 : 0.15} strokeDasharray="2 6" style={{ transition: 'stroke-opacity 0.3s' }} />
          ))}
          {PREM_POS.map(({ m, x, y }) => (
            <PremiumNode
              key={m.id}
              m={m}
              x={x}
              y={y}
              isHovered={hovered === m.id}
              isLocked={!!planFilter && !planFilter.includes(m.id)}
              onOpen={onOpen}
              onHover={setHovered}
            />
          ))}
          <PremiumCenter onOpen={onOpen} />
        </svg>
        <PremiumTooltip hovered={hovered} onOpen={onOpen} planFilter={planFilter} />
      </div>
    </div>
  );
}

/* ---------------- PRO PREMIUM ORBITAL ---------------- */

function ProRings() {
  return (
    <>
      <circle cx={300} cy={300} r={120} fill="none" stroke="#E879F9" strokeWidth={1} strokeOpacity={0.15} className="jbos-breathe" style={{ animationDuration: '4s' }} />
      <circle cx={300} cy={300} r={185} fill="none" stroke="#D946EF" strokeWidth={1} strokeOpacity={0.12} className="jbos-breathe" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
      <circle cx={300} cy={300} r={250} fill="none" stroke="#A78BFA" strokeWidth={1} strokeOpacity={0.08} className="jbos-breathe" style={{ animationDuration: '6s', animationDelay: '1s' }} />
    </>
  );
}

function ProActiveRing() {
  return (
    <g className="jbos-active-ring" style={{ transformOrigin: '300px 300px' }}>
      <circle cx={300} cy={300} r={215} fill="none" stroke="url(#proPremiumRingGrad)" strokeWidth={1.5} strokeDasharray="60 1000" strokeLinecap="round" />
      <circle cx={300} cy={300} r={2} fill="#E879F9" opacity={0.9}>
        <animateMotion dur="28s" repeatCount="indefinite" path="M300,85 A215,215 0 1 1 299.99,85" />
      </circle>
    </g>
  );
}

function ProNode({ m, x, y, isHovered, isLocked, onOpen, onHover }: {
  m: ModuleMeta; x: number; y: number; isHovered: boolean; isLocked: boolean;
  onOpen: (m: ModuleMeta) => void; onHover: (m: ModuleId | null) => void;
}) {
  const Icon = m.icon;
  return (
    <g className="group" style={isLocked ? { opacity: 0.3 } : undefined}>
      {!isLocked && (
        <>
          <circle cx={x} cy={y} r={32} fill="none" stroke="url(#proPremiumGlowGrad)" strokeWidth={1.2} strokeOpacity={isHovered ? 0.6 : 0.3} className="jbos-breathe" style={{ animationDuration: '3s' }} />
          <circle cx={x} cy={y} r={28} fill="rgba(232,121,249,0.06)" stroke="rgba(232,121,249,0.25)" strokeWidth={0.5} />
        </>
      )}
      <foreignObject x={x - 26} y={y - 26} width={52} height={52}>
        <button
          onClick={() => onOpen(m)}
          onMouseEnter={() => onHover(m.id)}
          onMouseLeave={() => onHover(null)}
          className={cn(
            isLocked
              ? 'flex h-[52px] w-[52px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] opacity-50'
              : 'flex h-[52px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(232,121,249,0.3)] bg-gradient-to-b from-[rgba(232,121,249,0.12)] to-[rgba(232,121,249,0.04)] shadow-[0_0_16px_rgba(232,121,249,0.12)] transition-transform hover:-translate-y-0.5 hover:scale-105',
          )}
        >
          {isLocked ? <Lock className="h-4 w-4 text-white/20" /> : <Icon className="h-4 w-4" style={{ color: m.color }} />}
        </button>
      </foreignObject>
      {!isLocked && (
        <foreignObject x={x + 12} y={y - 32} width={20} height={20}>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#E879F9] to-[#D946EF] shadow-[0_0_6px_rgba(232,121,249,0.5)]">
            <Crown className="h-2.5 w-2.5 text-[#2e1065]" strokeWidth={2.5} />
          </div>
        </foreignObject>
      )}
      <text x={x} y={y + 34} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '9px', fontWeight: isLocked ? 500 : 700, fill: isLocked ? '#666' : isHovered ? '#fff' : '#F0ABFC', transition: 'fill 0.2s' }}>
        {m.label}
      </text>
      {!isLocked && (
        <text x={x} y={y + 44} textAnchor="middle" className="pointer-events-none select-none" style={{ fontSize: '6px', fontWeight: 700, fill: 'rgba(232,121,249,0.6)', letterSpacing: '0.12em' }}>
          $1600 PLAN
        </text>
      )}
    </g>
  );
}

function ProCenter({ onOpen }: { onOpen: (m: ModuleMeta) => void }) {
  return (
    <foreignObject x={238} y={238} width={124} height={124}>
      <button
        onClick={() => onOpen(PRO_PREMIUM_MODULES[0])}
        className="jbos-core-breathe absolute left-0 top-0 z-20 flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(232,121,249,0.2) 0%, rgba(217,70,239,0.05) 60%, transparent 80%)',
          border: '1px solid rgba(232,121,249,0.25)',
          boxShadow: '0 0 30px rgba(232,121,249,0.15), inset 0 0 20px rgba(232,121,249,0.05)',
        }}
      >
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[8px] font-bold tracking-[0.22em] text-[#E879F9]">CDG</span>
          <span className="text-[13px] font-black tracking-[0.06em] text-[#D946EF]">$1600</span>
          <span className="text-[8px] font-bold tracking-[0.22em] text-[#E879F9]">PRO</span>
        </div>
        <span className="text-[8px] font-bold tracking-[0.12em] text-[#E879F9]">PREMIUMS</span>
        <span className="mt-1 max-w-[100px] text-center text-[6px] leading-tight" style={{ color: 'rgba(240,171,252,0.6)' }}>
          For the operator who wants it all
        </span>
      </button>
    </foreignObject>
  );
}

function ProTooltip({ hovered, onOpen, planFilter }: { hovered: ModuleId | null; onOpen: (m: ModuleMeta) => void; planFilter?: string[] }) {
  const data = hovered ? PRO_PREMIUM_DATA[hovered] : null;
  const meta = hovered ? MODULE_MAP.get(hovered) : null;
  if (!hovered || !data || !meta) return null;
  const isLocked = !!planFilter && !planFilter.includes(hovered);
  const status = data.status;
  return (
    <div className={`pointer-events-auto absolute left-1/2 top-3 z-30 w-56 -translate-x-1/2 p-3 shadow-xl backdrop-blur-md ${darkBox}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: isLocked ? '#666' : STATUS_COLORS[status] }} />
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.tagline}</span>
        {isLocked ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">
            <Lock className="h-2 w-2" /> Locked
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[rgba(232,121,249,0.25)] bg-gradient-to-r from-[rgba(232,121,249,0.15)] to-[rgba(217,70,239,0.15)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#E879F9]">
            <Crown className="h-2 w-2" /> Pro Premium
          </span>
        )}
      </div>
      <ul className="mb-2.5 space-y-1">
        {data.lines.map((l, i) => (
          <li key={i} className="text-[11px] text-slate-400">{l}</li>
        ))}
      </ul>
      {isLocked ? (
        <div className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.02] py-1.5 text-[10px] font-semibold text-white/30">
          <Lock className="h-3 w-3" /> Upgrade to unlock
        </div>
      ) : (
        <button
          onClick={() => onOpen(meta)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(40,44,55,0.95)] py-1.5 text-[10px] font-semibold text-slate-400 transition hover:border-[rgba(255,255,255,0.15)] hover:text-slate-200"
        >
          Open {meta.label}
        </button>
      )}
    </div>
  );
}

export function OrbitalProPremium({ onOpen, planFilter }: { onOpen: (m: ModuleMeta) => void; planFilter?: string[] }) {
  const [hovered, setHovered] = useState<ModuleId | null>(null);
  return (
    <div className="flex justify-center">
      <div className="relative h-[600px] w-full max-w-[600px]">
        <div className="jbos-grid-bg absolute inset-0 opacity-10" />
        <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="proPremiumRingGrad">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="40%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <linearGradient id="proPremiumGlowGrad">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="50%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#E879F9" />
            </linearGradient>
          </defs>
          <ProRings />
          <ProActiveRing />
          {PRO_POS.map(({ m, x, y }) => (
            <line key={`line-${m.id}`} x1={300} y1={300} x2={x} y2={y} stroke={m.ring} strokeWidth={0.8} strokeOpacity={hovered === m.id ? 0.4 : 0.15} strokeDasharray="2 6" style={{ transition: 'stroke-opacity 0.3s' }} />
          ))}
          {PRO_POS.map(({ m, x, y }) => (
            <ProNode
              key={m.id}
              m={m}
              x={x}
              y={y}
              isHovered={hovered === m.id}
              isLocked={!!planFilter && !planFilter.includes(m.id)}
              onOpen={onOpen}
              onHover={setHovered}
            />
          ))}
          <ProCenter onOpen={onOpen} />
        </svg>
        <ProTooltip hovered={hovered} onOpen={onOpen} planFilter={planFilter} />
      </div>
    </div>
  );
}

/* ---------------- TOOL DETAIL MODAL ---------------- */

function ToolDetailModal({
  tool,
  planFilter,
  onClose,
  onAddTool,
}: {
  tool: ModuleMeta | null;
  planFilter?: string[];
  onClose: () => void;
  onAddTool?: (m: ModuleMeta) => void;
}) {
  const router = useRouter();
  if (!tool) return null;
  const locked = !!planFilter && !planFilter.includes(tool.id);
  const Icon = tool.icon;
  const isBusiness = tool.category !== 'premium' && tool.category !== 'pro-premium';
  const chip = isBusiness ? { label: 'CORE KIT · $0', color: tool.category === 'govern' ? '#FF565C' : tool.category === 'command' ? '#6674FF' : tool.category === 'delivery' ? '#FF9C32' : '#18D9A0' }
    : tool.category === 'premium' ? { label: '$1000 PREMIUMS', color: '#FF6B9D' }
    : { label: '$1600 PRO PREMIUMS', color: '#E879F9' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className={`w-full max-w-md p-5 ${darkBox}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border" style={{ borderColor: `${tool.color}55`, background: `${tool.color}14` }}>
            <Icon className="h-6 w-6" style={{ color: tool.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-slate-100">{tool.label}</p>
            <p className="text-xs" style={{ color: tool.color }}>{tool.tagline}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: `${chip.color}55`, color: chip.color }}>{chip.label}</span>
              {locked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <Lock className="h-2.5 w-2.5" /> Locked on this tier
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(24,223,160,0.25)] bg-[rgba(24,223,160,0.1)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#18DFA0]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#18DFA0]" /> Available
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">What it is</p>
            <p className="text-xs leading-relaxed text-slate-300">{tool.desc}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">How to use it</p>
            <ol className="space-y-1">
              {stepsFor(tool).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/10 text-[8px] text-slate-500">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">How it helps right now</p>
            <ul className="space-y-1">
              {linesFor(tool).map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: tool.color }} />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {locked && (
            <span className="mr-auto text-[10px] text-amber-400/80">This tool belongs to a higher toolkit.</span>
          )}
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
            Close
          </button>
          {!locked && onAddTool && (
            <button
              onClick={() => { onAddTool(tool); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0a0f14]"
              style={{ background: tool.color }}
            >
              <Zap className="h-3.5 w-3.5" /> Add into this flow
            </button>
          )}
          {!locked && !onAddTool && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0a0f14]"
              style={{ background: tool.color }}
            >
              <Zap className="h-3.5 w-3.5" /> Add it inside a project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- FULL KIT EXPORT ---------------- */

export function OrbitalKits({
  tier,
  coreLabel,
  subtitle,
  onAddTool,
  which = 'all',
}: {
  tier?: string;
  coreLabel: string;
  subtitle: string;
  onAddTool?: (m: ModuleMeta) => void;
  which?: 'core' | 'premium' | 'pro' | 'all';
}) {
  const [detail, setDetail] = useState<ModuleMeta | null>(null);
  const planFilter = planFilterFor(tier);
  const pf = planFilter;
  const showCore = which === 'all' || which === 'core';
  const showPremium = which === 'all' || which === 'premium';
  const showPro = which === 'all' || which === 'pro';
  return (
    <div className="relative">
      <div className="flex flex-col gap-10">
        {showCore && (
          <section>
            <KitHeading index="01" label="CORE TOOLKIT" sub="The business operating system — everything your company runs on, wired to the centre." color="#2276D9" />
            <OrbitalCore onOpen={setDetail} planFilter={pf} coreLabel={coreLabel} subtitle={subtitle} />
          </section>
        )}
        {showPremium && (
          <section>
            <KitHeading index="02" label="$1,000 PREMIUMS" sub="For any normal to high thinker individual — life admin that sorts itself." color="#FF6B9D" />
            <OrbitalPremium onOpen={setDetail} planFilter={pf} />
          </section>
        )}
        {showPro && (
          <section>
            <KitHeading index="03" label="$1,600 PRO PREMIUMS" sub="For the operator who wants it all — every flagship module, fully exposed." color="#E879F9" />
            <OrbitalProPremium onOpen={setDetail} planFilter={pf} />
          </section>
        )}
      </div>
      <ToolDetailModal tool={detail} planFilter={pf} onClose={() => setDetail(null)} onAddTool={onAddTool} />
    </div>
  );
}

function KitHeading({ index, label, sub, color }: { index: string; label: string; sub: string; color: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-3 px-2">
      <span className="text-[10px] font-black tracking-[0.2em]" style={{ color }}>{index}</span>
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">{label}</h3>
      <span className="hidden text-[10px] text-slate-500 sm:block">{sub}</span>
    </div>
  );
}

export type { ModuleMeta as OrbitalModuleMeta };