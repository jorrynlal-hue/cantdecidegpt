// Radial CORE hub tool definitions — the single source of truth for the operating system.

export interface HubTool {
  id: string;
  name: string;
  href: string;
  icon: string;
  clock: number;
  layer: 'inner' | 'outer';
  premium: boolean;
  blurb: string;
}

// Clock positions: 12 o'clock is the top (Executive). Clockwise: 1, 2, 3 ... 11.
// The 24 tools in orbital order, starting from upper-left (Reports region):
export const HUB_TOOLS: HubTool[] = [
  { id: 'attribution', name: 'Attribution', href: '/dashboard/attribution', icon: 'Waypoints', clock: 10.75, layer: 'outer', premium: true, blurb: 'Source tracking and attribution intelligence across every generated asset.' },
  { id: 'ai-worker', name: 'AI Worker', href: '/dashboard/ai-worker', icon: 'Cpu', clock: 11.25, layer: 'inner', premium: true, blurb: 'Autonomous execution agent that runs workflows on your behalf.' },
  { id: 'executive', name: 'Executive', href: '/dashboard/executive', icon: 'Gauge', clock: 12, layer: 'outer', premium: true, blurb: 'Executive intelligence, decision support and high-level business overview.' },
  { id: 'admin', name: 'Admin', href: '/dashboard/admin', icon: 'ShieldCheck', clock: 1, layer: 'inner', premium: false, blurb: 'System administration and governance controls.' },
  { id: 'security', name: 'Security', href: '/dashboard/security', icon: 'KeyRound', clock: 1.5, layer: 'outer', premium: false, blurb: 'Access controls, permissions and audit integrity.' },
  { id: 'settings', name: 'Settings', href: '/dashboard/settings', icon: 'Settings', clock: 2, layer: 'inner', premium: false, blurb: 'Workspace, AI provider and appearance configuration.' },
  { id: 'team', name: 'Team', href: '/dashboard/team', icon: 'Users', clock: 2.5, layer: 'outer', premium: true, blurb: 'Members, roles and collaboration across the workspace.' },
  { id: 'ai', name: 'AI', href: '/dashboard/ai', icon: 'BrainCircuit', clock: 3, layer: 'inner', premium: true, blurb: 'AI assistant, content generation and the full intelligence suite.' },
  { id: 'tasks', name: 'Tasks', href: '/dashboard/tasks', icon: 'ListChecks', clock: 3.5, layer: 'outer', premium: false, blurb: 'Task management: create, prioritize, track and complete work.' },
  { id: 'insights', name: 'Insights', href: '/dashboard/insights', icon: 'Activity', clock: 4, layer: 'inner', premium: false, blurb: 'Intelligence analytics, derived notes and system observations.' },
  { id: 'automation', name: 'Automation', href: '/dashboard/automation', icon: 'Workflow', clock: 4.5, layer: 'outer', premium: true, blurb: 'Workflow builder and autonomous execution engine.' },
  { id: 'integrations', name: 'Integrations', href: '/dashboard/integrations', icon: 'Globe2', clock: 5, layer: 'inner', premium: false, blurb: 'Connectors and delivery relays to external services.' },
  { id: 'memory', name: 'Memory', href: '/dashboard/memory', icon: 'Database', clock: 5.5, layer: 'outer', premium: true, blurb: 'Persistent system memory: knowledge, documents and context.' },
  { id: 'performer', name: 'Performer', href: '/dashboard/performer', icon: 'Sparkles', clock: 5.75, layer: 'inner', premium: true, blurb: 'Performance and optimization intelligence for the whole system.' },
  { id: 'website', name: 'Website', href: '/dashboard/website', icon: 'Monitor', clock: 6, layer: 'outer', premium: false, blurb: 'Web presence and content publishing management.' },
  { id: 'operations', name: 'Operations', href: '/dashboard/operations', icon: 'Truck', clock: 6.5, layer: 'inner', premium: false, blurb: 'Work queue, approvals, policies and execution control plane.' },
  { id: 'finance', name: 'Finance', href: '/dashboard/finance', icon: 'Wallet', clock: 7, layer: 'outer', premium: false, blurb: 'Invoices, transactions and financial position.' },
  { id: 'connect', name: 'Connect', href: '/dashboard/connect', icon: 'Link', clock: 7.5, layer: 'inner', premium: true, blurb: 'Unified communication layer: mail, notifications and conversation.' },
  { id: 'hr', name: 'HR', href: '/dashboard/hr', icon: 'Users2', clock: 8, layer: 'outer', premium: false, blurb: 'People operations: members and workload distribution.' },
  { id: 'marketing', name: 'Marketing', href: '/dashboard/marketing', icon: 'Megaphone', clock: 8.5, layer: 'inner', premium: false, blurb: 'Campaigns, posts and outbound marketing.' },
  { id: 'customers', name: 'Customers', href: '/dashboard/customers', icon: 'Heart', clock: 9, layer: 'outer', premium: true, blurb: 'Customer intelligence and relationship management.' },
  { id: 'sales', name: 'Sales', href: '/dashboard/sales', icon: 'Target', clock: 9.5, layer: 'inner', premium: false, blurb: 'Deal pipeline and sales execution.' },
  { id: 'analytics', name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3', clock: 10, layer: 'outer', premium: false, blurb: 'Full analytics dashboard over live workspace data.' },
  { id: 'reports', name: 'Reports', href: '/dashboard/reports', icon: 'FileText', clock: 10.5, layer: 'inner', premium: false, blurb: 'Audit-ready reporting on the entire ecosystem.' },
];

// Exactly 10 premium PRO EXCLUSIVE tools.
export const PREMIUM_IDS = new Set(HUB_TOOLS.filter((t) => t.premium).map((t) => t.id));

// ---------------------------------------------------------------------------
// Restored tools carried over from the old JBOS/ABOS operating system so that
// nothing that previously existed is left out of this site and theme.
// ---------------------------------------------------------------------------

export type RestoredZone = 'business' | 'life';

export interface RestoredTool {
  id: string;
  name: string;
  href: string;
  icon: string;
  zone: RestoredZone;
  blurb: string;
}

export const ZONE_LABELS: Record<RestoredZone, string> = {
  business: 'Business Pro',
  life: 'Personal Life',
};

// 31 restored tools: 20 business + 11 personal life.
export const RESTORED_TOOLS: RestoredTool[] = [
  { id: 'projects', name: 'Projects', href: '/dashboard/projects', icon: 'FolderKanban', zone: 'business', blurb: 'Portfolio health and delivery: every project, its progress and its blockers.' },
  { id: 'scheduler', name: 'Scheduler', href: '/dashboard/scheduler', icon: 'CalendarClock', zone: 'business', blurb: 'Day planner: schedule, focus blocks and a sequenced weekly plan.' },
  { id: 'closer', name: 'Closer', href: '/dashboard/closer', icon: 'Handshake', zone: 'business', blurb: 'Deal closer: follow-up pushes on deals and invoices that need landing.' },
  { id: 'recruiter', name: 'Recruiter', href: '/dashboard/recruiter', icon: 'UserPlus', zone: 'business', blurb: 'Talent recruiter: role briefs, screening questions and hiring pipeline.' },
  { id: 'bookkeeper', name: 'Bookkeeper', href: '/dashboard/bookkeeper', icon: 'Calculator', zone: 'business', blurb: 'Bookkeeper Lite: plain-English financial summaries from live records.' },
  { id: 'rootcause', name: 'Root Cause', href: '/dashboard/rootcause', icon: 'Search', zone: 'business', blurb: 'Digs from a symptom to the underlying cause before you act.' },
  { id: 'weeklyops', name: 'Weekly Ops', href: '/dashboard/weeklyops', icon: 'ClipboardList', zone: 'business', blurb: 'The Monday morning operating brief: what moved and what needs you.' },
  { id: 'proofreel', name: 'Proof Reel', href: '/dashboard/proofreel', icon: 'Clapperboard', zone: 'business', blurb: 'The month\u2019s wins, compiled automatically into a shareable reel.' },
  { id: 'decaydetect', name: 'Decay Detect', href: '/dashboard/decaydetect', icon: 'HeartCrack', zone: 'business', blurb: 'Flags relationships and accounts that are going cold before they vanish.' },
  { id: 'pricingexp', name: 'Pricing Experiments', href: '/dashboard/pricingexp', icon: 'FlaskConical', zone: 'business', blurb: 'A/B pricing ideas with guardrails, tracking and a recommendation.' },
  { id: 'autorenego', name: 'Auto-Renegotiate', href: '/dashboard/autorenego', icon: 'Repeat', zone: 'business', blurb: 'Renewal campaigns for subscriptions, contracts and recurring costs.' },
  { id: 'negotiator', name: 'Negotiator', href: '/dashboard/negotiator', icon: 'Scale', zone: 'business', blurb: 'Fair-but-firm draft positions and scripts for any negotiation.' },
  { id: 'silentresponse', name: 'Silent Response', href: '/dashboard/silentresponse', icon: 'MessageSquareOff', zone: 'business', blurb: 'Calm, composed replies to the messages that make you want to react.' },
  { id: 'shadowfounder', name: 'Shadow Founder', href: '/dashboard/shadowfounder', icon: 'Moon', zone: 'business', blurb: 'The nightly operating memo that reviews the day while you sleep.' },
  { id: 'competitorshadow', name: 'Competitor Shadow', href: '/dashboard/competitorshadow', icon: 'Radar', zone: 'business', blurb: 'A watchlist on competitors with change alerts and counter-moves.' },
  { id: 'secondbrain', name: 'Second Brain', href: '/dashboard/secondbrain', icon: 'Brain', zone: 'business', blurb: 'Monthly memory retention interview so nothing important is lost.' },
  { id: 'consultant', name: 'Consultant Button', href: '/dashboard/consultant', icon: 'Briefcase', zone: 'business', blurb: 'Instant senior-consultant level advice on whatever you are facing.' },
  { id: 'ghostmode', name: 'Ghost Mode', href: '/dashboard/ghostmode', icon: 'Ghost', zone: 'business', blurb: 'Hands-off automation with a leave-behind memo for the machine.' },
  { id: 'rescuebutton', name: 'Rescue Button', href: '/dashboard/rescuebutton', icon: 'LifeBuoy', zone: 'business', blurb: 'One-tap triage of everything waiting on you, in priority order.' },
  { id: 'researcher', name: 'Researcher', href: '/dashboard/researcher', icon: 'Microscope', zone: 'business', blurb: 'Deep-dive, structured briefs on any person, market or topic.' },
  { id: 'lifeadmin', name: 'Life Admin', href: '/dashboard/lifeadmin', icon: 'FileCheck', zone: 'life', blurb: 'Renewals, paperwork and the life backlog you keep postponing.' },
  { id: 'moneypeace', name: 'Money Peace', href: '/dashboard/moneypeace', icon: 'PiggyBank', zone: 'life', blurb: 'Your finances explained in plain, calm language. No jargon.' },
  { id: 'errands', name: 'Errand Brain', href: '/dashboard/errands', icon: 'ShoppingBag', zone: 'life', blurb: 'Every errand sequenced into one efficient run.' },
  { id: 'household', name: 'Household', href: '/dashboard/household', icon: 'Home', zone: 'life', blurb: 'Shared home responsibilities kept fair and visible.' },
  { id: 'decisions', name: 'Decisions', href: '/dashboard/decisions', icon: 'Compass', zone: 'life', blurb: 'Structure hard calls instead of looping on them.' },
  { id: 'weeklyrecap', name: 'Weekly Recap', href: '/dashboard/weeklyrecap', icon: 'CalendarCheck', zone: 'life', blurb: 'Your week, summarized so you actually remember it.' },
  { id: 'fixer', name: 'Fixer', href: '/dashboard/fixer', icon: 'Wrench', zone: 'life', blurb: 'Annoying thing, clear resolution. Steps and message drafts included.' },
  { id: 'secondeyes', name: 'Second Eyes', href: '/dashboard/secondeyes', icon: 'Eye', zone: 'life', blurb: 'A second read of anything before you hit send or sign.' },
  { id: 'nudge', name: 'Nudge', href: '/dashboard/nudge', icon: 'Bell', zone: 'life', blurb: 'Gentle pushes on the thing you keep skipping.' },
  { id: 'buffer', name: 'Buffer', href: '/dashboard/buffer', icon: 'Shield', zone: 'life', blurb: 'A cool head between you and the message that got to you.' },
  { id: 'inbox', name: 'Inbox', href: '/dashboard/inbox', icon: 'Inbox', zone: 'life', blurb: 'Inbox zero: triage, prioritize and auto-draft replies.' },
];

export const ALL_TOOLS: (HubTool | RestoredTool)[] = [...HUB_TOOLS, ...RESTORED_TOOLS];

export const hubTotal = () => HUB_TOOLS.length + RESTORED_TOOLS.length;

export interface HubCheck {
  total: number;
  premium: number;
  standard: number;
  uniqueNames: boolean;
  uniqueIds: boolean;
  iconCoverage: boolean;
  hrefCoverage: boolean;
  all24: boolean;
}

export function assertHub(): HubCheck {
  const names = HUB_TOOLS.map((t) => t.name);
  const ids = HUB_TOOLS.map((t) => t.id);
  const icons = HUB_TOOLS.map((t) => t.icon);
  const premium = HUB_TOOLS.filter((t) => t.premium).length;
  const check: HubCheck = {
    total: HUB_TOOLS.length,
    premium,
    standard: HUB_TOOLS.length - premium,
    uniqueNames: new Set(names).size === names.length,
    uniqueIds: new Set(ids).size === ids.length,
    iconCoverage: icons.every(Boolean) && new Set(icons).size === icons.length,
    hrefCoverage: new Set(HUB_TOOLS.map((t) => t.href)).size === HUB_TOOLS.length,
    all24: HUB_TOOLS.length === 24,
  };
  return check;
}

export interface AllCheck {
  radialTotal: number;
  premium: number;
  restoredTotal: number;
  business: number;
  life: number;
  allTotal: number;
  uniqueHrefs: boolean;
  uniqueNames: boolean;
}

export function assertAllTools(): AllCheck {
  const all = ALL_TOOLS;
  const hrefs = all.map((t) => t.href);
  const names = all.map((t) => t.name);
  return {
    radialTotal: HUB_TOOLS.length,
    premium: HUB_TOOLS.filter((t) => t.premium).length,
    restoredTotal: RESTORED_TOOLS.length,
    business: RESTORED_TOOLS.filter((t) => t.zone === 'business').length,
    life: RESTORED_TOOLS.filter((t) => t.zone === 'life').length,
    allTotal: all.length,
    uniqueHrefs: new Set(hrefs).size === hrefs.length,
    uniqueNames: new Set(names).size === names.length,
  };
}