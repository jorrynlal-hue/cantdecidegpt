// ---------------------------------------------------------------------------
// RADIAL SYSTEM 02 — $1,000 SPECIAL / PREMIUM HUMAN LIFE RADIAL
// The 10-tool premium personal-life orbital. Single source of truth for the
// premium board: hub, the 10 premium tools, their positions, the pink/magenta
// energy-field card system and the relationship chains.
// ---------------------------------------------------------------------------

export type PremiumFamily = 'mind' | 'money' | 'home' | 'care' | 'time';

export interface PremiumTool {
  id: string;
  name: string;
  href: string;
  icon: string;
  accent: string;
  family: PremiumFamily;
  pos: { x: number; y: number };
  flagship: boolean;
  blurb: string;
}

// Premium palette per spec: primary pink, plus secondary colors reserved for
// tool icons only (cards and rings stay pink/magenta).
export const PREMIUM = {
  primary: '#FF5A91',
  secondary: '#D94D8A',
  purple: '#8D6CFF',
  blue: '#5F8CFF',
  green: '#20DDB1',
  orange: '#FF9C35',
  crown: '#FFC400',
  crownHi: '#FFD84A',
  price: '#E0B300',
  name: '#F2B4C9',
  cardBg: 'rgba(58,30,48,0.65)',
  cardBorder: 'rgba(255,92,145,0.25)',
  ringInner: 'rgba(255,78,137,0.32)',
  ringOuter: 'rgba(255,78,137,0.14)',
  lineSoft: 'rgba(255,80,140,0.10)',
  lineMid: 'rgba(255,80,140,0.32)',
  lineActive: 'rgba(255,80,140,0.55)',
};

export const FAMILY_LABELS: Record<PremiumFamily, string> = {
  mind: 'Mind',
  money: 'Money',
  home: 'Home',
  care: 'Care',
  time: 'Time',
};

// The central hub — "CAN'T DECIDE GPT / $1000 / PREMIUMS".
export const HUB = {
  name: 'CAN\u2019T DECIDE GPT',
  tier: '$1000',
  tag: 'PREMIUMS',
  support: 'For any normal to high thinker individual.',
  gradient: 'linear-gradient(135deg, #FF4F8B 0%, #B94678 55%, #5D315A 100%)',
  glow: 'rgba(255,79,139,0.45)',
};

// Exactly 10 premium tools. Positions are normalized board coordinates
// (origin = center, x+ right, y+ down) so the asymmetric spec layout is
// explicit: Buffer upper-left, Life Admin top-center, Inbox Triage
// upper-right, Money Peace right-upper, Errand Brain right-middle,
// Household lower-right, Decision Aid bottom-right, Weekly Recap bottom-left,
// The Fixer lower-left, Second Eyes left-lower.
export const PREMIUM_TOOLS: PremiumTool[] = [
  {
    id: 'buffer', name: 'The Buffer', href: '/dashboard/buffer', icon: 'Layers', family: 'care',
    accent: PREMIUM.blue, pos: { x: -0.56, y: -0.6 }, flagship: false,
    blurb: 'Take the heat out of any reply before it leaves you \u2014 calm, firm, future-you approved.',
  },
  {
    id: 'lifeadmin', name: 'Life Admin', href: '/dashboard/lifeadmin', icon: 'ClipboardList', family: 'time',
    accent: PREMIUM.secondary, pos: { x: 0, y: -0.74 }, flagship: false,
    blurb: 'The paperwork, renewals, memberships and small print of life, handled so you don\u2019t carry it.',
  },
  {
    id: 'inbox', name: 'Inbox Triage', href: '/dashboard/inbox', icon: 'Inbox', family: 'time',
    accent: PREMIUM.purple, pos: { x: 0.56, y: -0.6 }, flagship: false,
    blurb: 'Draft every reply, sort every thread, and stop the stack of unread from owning your head.',
  },
  {
    id: 'moneypeace', name: 'Money Peace', href: '/dashboard/moneypeace', icon: 'Wallet', family: 'money',
    accent: PREMIUM.green, pos: { x: 0.72, y: -0.28 }, flagship: false,
    blurb: 'Your finances explained in plain, calm language \u2014 the real number, the real concern, one step.',
  },
  {
    id: 'errands', name: 'Errand Brain', href: '/dashboard/errands', icon: 'Map', family: 'home',
    accent: PREMIUM.orange, pos: { x: 0.78, y: 0.12 }, flagship: false,
    blurb: 'Sequence every errand into one sensible run, grouped by area, with no second trip.',
  },
  {
    id: 'household', name: 'Household', href: '/dashboard/household', icon: 'Home', family: 'home',
    accent: PREMIUM.green, pos: { x: 0.62, y: 0.52 }, flagship: false,
    blurb: 'A fair week plan for the people in the house \u2014 delegated, automated, or dropped.',
  },
  {
    id: 'decisionaid', name: 'Decision Aid', href: '/dashboard/decisions', icon: 'Scale', family: 'mind',
    accent: PREMIUM.purple, pos: { x: 0.28, y: 0.66 }, flagship: true,
    blurb: 'The flagship. Options, factors, regret question \u2014 then an actual pick with reasons.',
  },
  {
    id: 'weeklyrecap', name: 'Weekly Recap', href: '/dashboard/weeklyrecap', icon: 'CalendarClock', family: 'time',
    accent: PREMIUM.blue, pos: { x: -0.28, y: 0.66 }, flagship: false,
    blurb: 'A calm Sunday read of the week: what moved, what waited, what deserves next Monday.',
  },
  {
    id: 'fixer', name: 'The Fixer', href: '/dashboard/fixer', icon: 'Wrench', family: 'care',
    accent: PREMIUM.orange, pos: { x: -0.62, y: 0.52 }, flagship: false,
    blurb: 'The likeliest cause, the cheapest ordered fix, and how to stop it coming back.',
  },
  {
    id: 'secondeyes', name: 'Second Eyes', href: '/dashboard/secondeyes', icon: 'Eye', family: 'mind',
    accent: PREMIUM.secondary, pos: { x: -0.78, y: 0.12 }, flagship: true,
    blurb: 'The flagship. A calm second pair of eyes on decisions before you commit.',
  },
];

export const PREMIUM_TOOL_MAP = new Map(PREMIUM_TOOLS.map((t) => [t.id, t]));

export const PREMIUM_FLAGSHIPS = PREMIUM_TOOLS.filter((t) => t.flagship).map((t) => t.id);

// Relationship chains (spec): premium tools talk to each other along these
// routes. Edges reference tool ids in the 10-tool board.
export type PremiumRelations = Record<string, string[]>;

export const PREMIUM_RELATIONS: PremiumRelations = {
  inbox: ['buffer', 'lifeadmin', 'weeklyrecap'],
  buffer: ['inbox', 'lifeadmin'],
  lifeadmin: ['inbox', 'weeklyrecap', 'household', 'moneypeace'],
  weeklyrecap: ['inbox', 'lifeadmin', 'moneypeace'],
  moneypeace: ['lifeadmin', 'buffer', 'weeklyrecap'],
  household: ['fixer', 'errands', 'lifeadmin'],
  errands: ['household', 'fixer', 'lifeadmin'],
  fixer: ['household', 'errands', 'inbox'],
  secondeyes: ['decisionaid'],
  decisionaid: ['secondeyes', 'inbox', 'weeklyrecap'],
};

export const relationsOfPremium = (id: string): PremiumTool[] =>
  (PREMIUM_RELATIONS[id] ?? []).map((rid) => PREMIUM_TOOL_MAP.get(rid)).filter((t): t is PremiumTool => Boolean(t));

// Cross-toolkit ties to Radial System 01 (Memory, Tasks). These are the only
// premium links that reach into the normal toolkit.
export interface PremiumTie { label: string; href: string; }

export const PREMIUM_TIES: Record<string, PremiumTie[]> = {
  decisionaid: [
    { label: 'Memory', href: '/dashboard/memory' },
    { label: 'Tasks', href: '/dashboard/tasks' },
  ],
  secondeyes: [
    { label: 'Memory', href: '/dashboard/memory' },
    { label: 'Tasks', href: '/dashboard/tasks' },
  ],
  inbox: [{ label: 'Tasks', href: '/dashboard/tasks' }],
  weeklyrecap: [{ label: 'Tasks', href: '/dashboard/tasks' }],
};

export const tiesOfPremium = (id: string): PremiumTie[] => PREMIUM_TIES[id] ?? [];

// Toolkit tier descriptor used by /dashboard/toolkits. Tier 2 is now the
// shipped Premium Human Life Radial; Tier 3 stays intentionally pending.
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

export const TIER_2: ToolkitTier = {
  id: 'prokit',
  name: 'Radial System 02',
  price: '$1,000',
  priceNote: 'one-time + activation',
  status: 'active',
  tagline: 'Premium Human Life Radial \u2014 the 10-tool personal-life orbital for the parts of life you don\u2019t want to constantly think about.',
  included: [
    'Exactly 10 premium tools, all live: The Buffer, Life Admin, Inbox Triage, Money Peace, Errand Brain, Household, Decision Aid, Weekly Recap, The Fixer, Second Eyes',
    'CAN\u2019T DECIDE GPT / $1000 / PREMIUMS hub with magenta energy field',
    'Double pink orbital rings, gold crowns and \u201c$1000 PLAN\u201d price labels on every tool',
    'Connection architecture: puzzle, time, money and care chains (Inbox\u2192Buffer\u2192Life Admin\u2192Weekly Recap, Second Eyes\u2192Decision Aid\u2192Memory\u2192Tasks, Money Peace\u2192Life Admin\u2192Buffer\u2192Weekly Recap)',
    'Active-work animation: pink pulse travels to the hub, the hub illuminates, the result path returns',
    'AI + Human Control: Suggest / Prepare / Ask / Execute modes on the tools that need them',
    'Memory-aware behaviour \u2014 asks \u201cis that still true for this decision?\u201d instead of blindly reusing preferences',
    'Dedicated premium board at /dashboard/radial02 with all 10 workspaces wired in',
  ],
  missing: [],
  cta: 'Explore the premium radial',
  href: '/dashboard/radial02',
};