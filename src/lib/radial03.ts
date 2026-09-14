// ---------------------------------------------------------------------------
// RADIAL SYSTEM 03 — $1,600 SPECIAL / PRO PREMIUM OPERATOR RADIAL
// The 19-tool pro-premium operator orbital. Single source of truth for the
// $1,600 board: hub, 19 operator tools, their ring positions, the deep
// navy/violet atmosphere, the purple/magenta crown system (distinct from the
// gold $1,000 crowns), the Proof-of-Work chain and the permission model.
// ---------------------------------------------------------------------------

export type OperatorFamily = 'mind' | 'money' | 'ops' | 'grow' | 'sell';

export interface OperatorTool {
  id: string;
  name: string;
  href: string;
  icon: string;
  accent: string;
  family: OperatorFamily;
  pos: { x: number; y: number };
  flagship: boolean;
  blurb: string;
}

// Pro-premium palette: deep navy/violet base with purple → magenta → pink
// premium accents. The crown is purple/magenta so it clearly reads as the
// $1,600 layer above the gold $1,000 layer.
export const OPERATOR = {
  primary: '#9B6CFF',
  secondary: '#C565FF',
  magenta: '#E883FF',
  pink: '#FF5A91',
  deep: '#241A52',
  crown: '#D06BFF',
  crownHi: '#ED9BFF',
  price: '#B88BFF',
  name: '#CCBDF2',
  cardBg: 'rgba(38,28,72,0.72)',
  cardBorder: 'rgba(155,108,255,0.30)',
  ringInner: 'rgba(155,108,255,0.34)',
  ringOuter: 'rgba(155,108,255,0.16)',
  lineSoft: 'rgba(155,108,255,0.12)',
  lineMid: 'rgba(155,108,255,0.36)',
  lineActive: 'rgba(232,131,255,0.65)',
};

export const FAMILY_LABELS: Record<OperatorFamily, string> = {
  mind: 'Mind & memory',
  money: 'Money & billing',
  ops: 'Operations',
  grow: 'Growth & research',
  sell: 'Sales & revenue',
};

// The central hub — "CAN'T DECIDE GPT / $1600 / PRO PREMIUMS".
export const HUB3 = {
  name: 'CAN\u2019T DECIDE GPT',
  tier: '$1600',
  tag: 'PRO PREMIUMS',
  support: 'For the operator who wants it all.',
  gradient: 'linear-gradient(135deg, #B56BFF 0%, #7C3AED 45%, #4C1D95 100%)',
  glow: 'rgba(155,108,255,0.5)',
};

// Exactly 19 pro-premium tools, laid out on the upper / right / lower / left
// arcs the spec prescribes. Normalized board coordinates (origin = centre,
// x+ right, y+ down). Ring spacing is deterministic so the board is exact.
const RING = 0.76;
const SLOTS = [
  'shadowfounder', 'consultant', 'secondbrain', 'competitorshadow', // upper
  'ghostmode', 'rescuebutton', 'proofreel', 'closer', 'calendar', 'bookkeeper', // right
  'recruiter', 'negotiator', 'researcher', 'weeklyops', // lower
  'autorenego', 'silentresponse', 'decaydetect', 'rootcause', 'pricingexp', // left
];

export const OPERATOR_TOOLS: OperatorTool[] = [
  {
    id: 'consultant', name: 'Consultant Button', href: '/dashboard/consultant', icon: 'Sparkles', family: 'mind',
    accent: '#FF5A91', flagship: false,
    blurb: 'One tap for the board-of-consultants style answer to the question on the table.',
  },
  {
    id: 'shadowfounder', name: 'Shadow Founder', href: '/dashboard/shadowfounder', icon: 'Brain', family: 'mind',
    accent: '#9B6CFF', flagship: true,
    blurb: 'Flagship. A founder-grade co-pilot that briefs the whole operation every morning.',
  },
  {
    id: 'competitorshadow', name: 'Competitor Shadow', href: '/dashboard/competitorshadow', icon: 'Radar', family: 'grow',
    accent: '#5F8CFF', flagship: false,
    blurb: 'Watches competitor moves, pricing and landings, and tells you what they mean for you.',
  },
  {
    id: 'secondbrain', name: 'Second Brain', href: '/dashboard/secondbrain', icon: 'Database', family: 'mind',
    accent: '#20DDB1', flagship: false,
    blurb: 'Everything the operation learns, stored once and retrieved in a second.',
  },
  {
    id: 'ghostmode', name: 'Ghost Mode', href: '/dashboard/ghostmode', icon: 'EyeOff', family: 'ops',
    accent: '#8D6CFF', flagship: false,
    blurb: 'Run actions invisibly — no pings, no notifications, no trail in the feed.',
  },
  {
    id: 'rescuebutton', name: 'Rescue Button', href: '/dashboard/rescuebutton', icon: 'LifeBuoy', family: 'ops',
    accent: '#FF9C35', flagship: false,
    blurb: 'The emergency runbook: assess, contain, communicate, recover. Pressed once.',
  },
  {
    id: 'proofreel', name: 'Proof-of-Work', href: '/dashboard/proofreel', icon: 'ScrollText', family: 'ops',
    accent: '#E883FF', flagship: true,
    blurb: 'Flagship. Every job auto-records its JOB→TOOLS→SOURCES→ACTIONS→DECISIONS→APPROVALS→RESULT→TIME chain.',
  },
  {
    id: 'closer', name: 'The Closer', href: '/dashboard/closer', icon: 'Trophy', family: 'sell',
    accent: '#FF5A91', flagship: false,
    blurb: 'Takes near-won deals across the line with the right follow-up at the right time.',
  },
  {
    id: 'calendar', name: 'The Scheduler', href: '/dashboard/calendar', icon: 'CalendarClock', family: 'ops',
    accent: '#9B6CFF', flagship: false,
    blurb: 'Juggles time-blocks, calls and deep work so the week actually happens.',
  },
  {
    id: 'bookkeeper', name: 'Bookkeeper Lite', href: '/dashboard/bookkeeper', icon: 'BookOpen', family: 'money',
    accent: '#20DDB1', flagship: false,
    blurb: 'Categories transactions, reconciles the month and flags anything odd.',
  },
  {
    id: 'recruiter', name: 'The Recruiter', href: '/dashboard/recruiter', icon: 'Users', family: 'ops',
    accent: '#5F8CFF', flagship: false,
    blurb: 'Screens candidates against the real job at hand, not the keyword list.',
  },
  {
    id: 'negotiator', name: 'The Negotiator', href: '/dashboard/negotiator', icon: 'Scale', family: 'money',
    accent: '#FF9C35', flagship: true,
    blurb: 'Flagship. Prepares the numbers and the walk-away for any negotiation.',
  },
  {
    id: 'researcher', name: 'The Researcher', href: '/dashboard/researcher', icon: 'Search', family: 'grow',
    accent: '#8D6CFF', flagship: false,
    blurb: 'Digs up the answer with sources, dates and the level of certainty attached.',
  },
  {
    id: 'weeklyops', name: 'Weekly Ops', href: '/dashboard/weeklyops', icon: 'ClipboardList', family: 'ops',
    accent: '#E883FF', flagship: false,
    blurb: 'The weekly operating review: what moved, what waited, what gets fixed Monday.',
  },
  {
    id: 'autorenego', name: 'Auto Renegotiate', href: '/dashboard/autorenego', icon: 'RefreshCw', family: 'money',
    accent: '#20DDB1', flagship: false,
    blurb: 'Automatically renegotiates the recurring bills that quietly inflate every year.',
  },
  {
    id: 'silentresponse', name: 'Silent Response', href: '/dashboard/silentresponse', icon: 'MessageSquare', family: 'ops',
    accent: '#9B6CFF', flagship: false,
    blurb: 'Pattern-matched replies handled silently, only escalating when it actually matters.',
  },
  {
    id: 'decaydetect', name: 'Decay Detect', href: '/dashboard/decaydetect', icon: 'TrendingDown', family: 'grow',
    accent: '#FF9C35', flagship: false,
    blurb: 'Catches the metrics that are drifting before they become problems.',
  },
  {
    id: 'rootcause', name: 'Root Cause', href: '/dashboard/rootcause', icon: 'Target', family: 'ops',
    accent: '#FF5A91', flagship: false,
    blurb: 'Pushes past the symptom to the actual failure point, with the fix attached.',
  },
  {
    id: 'pricingexp', name: 'Pricing Experiments', href: '/dashboard/pricingexp', icon: 'PieChart', family: 'sell',
    accent: '#5F8CFF', flagship: false,
    blurb: 'Tests price and packaging changes safely, one segment at a time.',
  },
].map((t, i) => {
  const ang = -Math.PI / 2 + (i / SLOTS.length) * Math.PI * 2;
  return { ...t, pos: { x: Math.cos(ang) * RING, y: Math.sin(ang) * RING } } as OperatorTool;
});

export const OPERATOR_TOOL_MAP = new Map(OPERATOR_TOOLS.map((t) => [t.id, t]));

export const OPERATOR_FLAGSHIPS = OPERATOR_TOOLS.filter((t) => t.flagship).map((t) => t.id);

// Cross-tool activation chains — selecting a tool activates its partners.
export type OperatorRelations = Record<string, string[]>;

export const OPERATOR_RELATIONS: OperatorRelations = {
  shadowfounder: ['secondbrain', 'competitorshadow', 'weeklyops'],
  consultant: ['shadowfounder', 'secondbrain'],
  secondbrain: ['shadowfounder', 'researcher', 'consultant', 'proofreel'],
  competitorshadow: ['pricingexp', 'researcher', 'shadowfounder'],
  ghostmode: ['rescuebutton', 'silentresponse'],
  rescuebutton: ['rootcause', 'proofreel', 'ghostmode'],
  proofreel: ['pricingexp', 'rootcause', 'rescuebutton', 'bookkeeper'],
  closer: ['negotiator', 'pricingexp', 'calendar'],
  calendar: ['weeklyops', 'closer'],
  bookkeeper: ['autorenego', 'proofreel'],
  recruiter: ['weeklyops', 'researcher'],
  negotiator: ['closer', 'autorenego', 'pricingexp', 'bookkeeper'],
  researcher: ['competitorshadow', 'rootcause', 'decaydetect'],
  weeklyops: ['shadowfounder', 'calendar', 'decaydetect', 'recruiter'],
  autorenego: ['bookkeeper', 'negotiator'],
  silentresponse: ['rescuebutton', 'ghostmode'],
  decaydetect: ['rootcause', 'weeklyops', 'researcher'],
  rootcause: ['rescuebutton', 'decaydetect', 'proofreel', 'researcher'],
  pricingexp: ['competitorshadow', 'closer', 'negotiator', 'proofreel'],
};

export const relationsOfOperator = (id: string): OperatorTool[] =>
  (OPERATOR_RELATIONS[id] ?? []).map((rid) => OPERATOR_TOOL_MAP.get(rid)).filter((t): t is OperatorTool => Boolean(t));

// Cross-toolkit ties into Radial 01 / 02.
export interface OperatorTie { label: string; href: string; }
export const OPERATOR_TIES: Record<string, OperatorTie[]> = {
  secondbrain: [
    { label: 'Memory', href: '/dashboard/memory' },
    { label: 'Second Eyes', href: '/dashboard/radial02' },
  ],
  proofreel: [
    { label: 'Audit Ledger', href: '/dashboard/operations/audit' },
    { label: 'Activity History', href: '/dashboard/activity' },
  ],
  closer: [{ label: 'CRM & Sales', href: '/dashboard/crm' }],
  bookkeeper: [{ label: 'Finance', href: '/dashboard/finance' }],
  calendar: [{ label: 'Tasks', href: '/dashboard/tasks' }],
  silentresponse: [{ label: 'Inbox Triage', href: '/dashboard/inbox' }],
  weeklyops: [{ label: 'Tasks', href: '/dashboard/tasks' }],
};
export const tiesOfOperator = (id: string): OperatorTie[] => OPERATOR_TIES[id] ?? [];

// Proof-of-Work chain — the exact record a job leaves behind.
export const POW_CHAIN = ['JOB', 'TOOLS', 'SOURCES', 'ACTIONS', 'DECISIONS', 'APPROVALS', 'RESULT', 'TIME'] as const;

// Permission model.
export const OPERATOR_MODES = ['View', 'Suggest', 'Prepare', 'Approve', 'Execute', 'Auto-Execute'] as const;

// Node states rendered live in the inspector.
export const OPERATOR_STATES = [
  'Ready', 'Working', 'Waiting', 'Needs Approval', 'Connected', 'Not Connected', 'Completed', 'Failed', 'Locked',
] as const;

// Toolkit tier descriptor for /dashboard/toolkits — tier 3 now shipped.
export interface ToolkitTier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  status: 'active' | 'planned' | 'pending';
  tagline: string;
  included: string[];
  missing: string[];
  cta: string;
  href: string;
}

export const TIER_3: ToolkitTier = {
  id: 'prokit3',
  name: 'Radial System 03',
  price: '$1,600',
  priceNote: 'one-time + activation',
  status: 'active',
  tagline: 'The $1,600 SPECIAL RADIAL — 19 pro-premium operator tools for the operator who wants it all.',
  included: [
    'Exactly 19 pro operator tools, all live: Consultant Button, Shadow Founder, Competitor Shadow, Second Brain, Ghost Mode, Rescue Button, Proof-of-Work, The Closer, The Scheduler, Bookkeeper Lite, The Recruiter, The Negotiator, The Researcher, Weekly Ops, Auto Renegotiate, Silent Response, Decay Detect, Root Cause, Pricing Experiments',
    'CAN\u2019T DECIDE GPT / $1600 / PRO PREMIUMS hub on a deep navy-violet energy field',
    'Double purple orbital rings and purple/magenta crowns — visually distinct from the gold $1,000 layer',
    'Cross-tool activation chains that light up when you select a tool (Shadow Founder\u2192Second Brain\u2192Competitor Shadow, Closer\u2192Negotiator\u2192Pricing Experiments, Rescue\u2192Root Cause\u2192Proof-of-Work)',
    'Proof-of-Work chain on every job: JOB\u2192TOOLS\u2192SOURCES\u2192ACTIONS\u2192DECISIONS\u2192APPROVALS\u2192RESULT\u2192TIME',
    'Full permission model: View / Suggest / Prepare / Approve / Execute / Auto-Execute',
    'Live multi-state nodes: Ready, Working, Waiting, Needs Approval, Connected, Not Connected, Completed, Failed, Locked',
    'Dedicated board at /dashboard/radial03 with all 19 workspaces wired in',
  ],
  missing: [],
  cta: 'Explore the $1,600 radial',
  href: '/dashboard/radial03',
};