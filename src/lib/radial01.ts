// ---------------------------------------------------------------------------
// RADIAL SYSTEM 01 — NORMAL RADIAL TOOLKIT
// The 24-tool orbital command center. This is the single source of truth for
// the radial board, its color families, orbits, premium crowns and the
// relationship (connection) engine.
// ---------------------------------------------------------------------------

import { TIER_2 } from '@/lib/radial02';

export type RadialFamily = 'system' | 'intelligence' | 'work' | 'growth' | 'delivery';

export interface FamilyMeta {
  id: RadialFamily;
  label: string;
  color: string;
  soft: string;
  crown: boolean;
}

export const FAMILIES: Record<RadialFamily, FamilyMeta> = {
  system: { id: 'system', label: 'System', color: '#FF4D61', soft: 'rgba(255,77,97,0.14)', crown: false },
  intelligence: { id: 'intelligence', label: 'Intelligence', color: '#9B6CFF', soft: 'rgba(155,108,255,0.16)', crown: true },
  work: { id: 'work', label: 'Work', color: '#438BFF', soft: 'rgba(67,139,255,0.16)', crown: false },
  growth: { id: 'growth', label: 'Growth', color: '#00D9B2', soft: 'rgba(0,217,178,0.14)', crown: false },
  delivery: { id: 'delivery', label: 'Delivery', color: '#FF9D21', soft: 'rgba(255,157,33,0.15)', crown: false },
};

export interface RadialTool {
  id: string;
  name: string;
  href: string;
  icon: string;
  family: RadialFamily;
  deg: number;
  layer: 'inner' | 'outer';
  premium: boolean;
  blurb: string;
}

export const CORE = {
  name: 'CAN\u2019T DECIDE GPT CORE',
  short: 'CORE',
  tagline: 'Business intelligence active \u00b7 24 tools synced',
  gradient: 'linear-gradient(135deg, #20D9C3 0%, #19C9D6 55%, #2486EA 100%)',
};

// 24 tools in uniform orbital order (360/23 = consistent angular spacing),
// starting at 12 o\u2019clock and running clockwise so the placement clusters
// match the spec: Exec top, Admin/Security/Settings upper-right, AI/Tasks/
// Projects/right, Automation/Integrations/Memory right-lower, Performer/
// Website/Operations bottom, Finance/Connect/HR bottom-left,
// Marketing/Customers left-lower, Sales/Analytics/Reports left,
// Attribution/AI Worker upper-left. CORE = center (position 24).
export const BOARD_TOOLS: RadialTool[] = [
  { id: 'executive', name: 'Executive', href: '/dashboard/executive', icon: 'Gauge', family: 'intelligence', deg: 0, layer: 'outer', premium: true, blurb: 'The state of the whole company in one decision surface.' },
  { id: 'admin', name: 'Admin', href: '/dashboard/admin', icon: 'ShieldCheck', family: 'system', deg: 15.65, layer: 'inner', premium: false, blurb: 'Org, access, and platform controls for admins.' },
  { id: 'security', name: 'Security', href: '/dashboard/security', icon: 'KeyRound', family: 'system', deg: 31.3, layer: 'outer', premium: false, blurb: 'Threats detected and contained before you see them.' },
  { id: 'settings', name: 'Settings', href: '/dashboard/settings', icon: 'Settings', family: 'system', deg: 46.96, layer: 'inner', premium: false, blurb: 'Org profile, team, plan, and real billing.' },
  { id: 'ai', name: 'AI', href: '/dashboard/ai', icon: 'BrainCircuit', family: 'intelligence', deg: 62.61, layer: 'outer', premium: true, blurb: 'Provider hub: bring your own keys, route and monitor every model.' },
  { id: 'tasks', name: 'Tasks', href: '/dashboard/tasks', icon: 'CalendarCheck2', family: 'work', deg: 78.26, layer: 'inner', premium: false, blurb: 'Task calendar and execution. Plan and run tasks with your AI workforce.' },
  { id: 'projects', name: 'Projects', href: '/dashboard/projects', icon: 'FolderKanban', family: 'work', deg: 93.91, layer: 'outer', premium: false, blurb: 'Portfolio health, progress, and delivery risk.' },
  { id: 'automation', name: 'Automation', href: '/dashboard/automation', icon: 'Workflow', family: 'intelligence', deg: 109.57, layer: 'inner', premium: true, blurb: 'Design workflows; AI executes, humans approve.' },
  { id: 'integrations', name: 'Integrations', href: '/dashboard/integrations', icon: 'Globe2', family: 'work', deg: 125.22, layer: 'outer', premium: false, blurb: 'Connect the tools you already run.' },
  { id: 'memory', name: 'Memory', href: '/dashboard/memory', icon: 'Database', family: 'intelligence', deg: 140.87, layer: 'inner', premium: true, blurb: 'Every meeting, contract, and decision, searchable.' },
  { id: 'performer', name: 'Performer', href: '/dashboard/performer', icon: 'Sparkles', family: 'intelligence', deg: 156.52, layer: 'outer', premium: true, blurb: 'Describe it. It runs it. One prompt orchestrates every module.' },
  { id: 'website', name: 'Website', href: '/dashboard/website', icon: 'Monitor', family: 'delivery', deg: 172.17, layer: 'inner', premium: false, blurb: 'Audit, fix, and track search and AI readiness.' },
  { id: 'operations', name: 'Operations', href: '/dashboard/operations', icon: 'Truck', family: 'delivery', deg: 187.83, layer: 'outer', premium: false, blurb: 'Tickets, vendors, and daily delivery, executed by agents.' },
  { id: 'finance', name: 'Finance', href: '/dashboard/finance', icon: 'Wallet', family: 'delivery', deg: 203.48, layer: 'inner', premium: false, blurb: 'Cash, receivables, and risk \u2014 reconciled continuously.' },
  { id: 'connect', name: 'Connect', href: '/dashboard/connect', icon: 'Link2', family: 'delivery', deg: 219.13, layer: 'outer', premium: true, blurb: 'Your sites, socials and inboxes linked and managed.' },
  { id: 'hr', name: 'HR', href: '/dashboard/hr', icon: 'Users', family: 'delivery', deg: 234.78, layer: 'inner', premium: false, blurb: 'Headcount, recruiting, time off, and performance.' },
  { id: 'marketing', name: 'Marketing', href: '/dashboard/marketing', icon: 'Megaphone', family: 'growth', deg: 250.43, layer: 'outer', premium: false, blurb: 'Plan, approve, publish, and measure every channel.' },
  { id: 'customers', name: 'Customers', href: '/dashboard/customers', icon: 'HeartHandshake', family: 'growth', deg: 266.09, layer: 'inner', premium: true, blurb: 'CRM and global customer map: health, risk, and relationships.' },
  { id: 'sales', name: 'Sales', href: '/dashboard/sales', icon: 'Target', family: 'growth', deg: 281.74, layer: 'outer', premium: false, blurb: 'Deals, forecasts, and revenue ops, tracked automatically.' },
  { id: 'analytics', name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3', family: 'growth', deg: 297.39, layer: 'inner', premium: false, blurb: 'Every metric, one query away, always current.' },
  { id: 'reports', name: 'Reports', href: '/dashboard/reports', icon: 'FileText', family: 'growth', deg: 313.04, layer: 'outer', premium: false, blurb: 'Revenue, customer, operations and financial reports.' },
  { id: 'attribution', name: 'Attribution', href: '/dashboard/attribution', icon: 'Waypoints', family: 'growth', deg: 328.7, layer: 'inner', premium: true, blurb: 'Which posts drove sales, who to target, and how to convert.' },
  { id: 'aiworker', name: 'AI Worker', href: '/dashboard/aiworker', icon: 'Bot', family: 'intelligence', deg: 344.35, layer: 'outer', premium: true, blurb: 'AI task engine: connect AI services, automate tasks, dual engine.' },
];

export const BOARD_TOOL_MAP = new Map(BOARD_TOOLS.map((t) => [t.id, t]));

export const PREMIUM_TOOLS = BOARD_TOOLS.filter((t) => t.premium).map((t) => t.id);

// Relationship engine — connects each tool to its live peers. Selecting any
// tool illuminates its connection lines with that tool's color and a moving
// light pulse (1.5s).
export type Relations = Record<string, string[]>;

export const RELATIONS: Relations = {
  ai: ['aiworker', 'memory', 'executive', 'analytics', 'automation'],
  aiworker: ['ai', 'automation', 'tasks', 'customers', 'memory'],
  customers: ['sales', 'marketing', 'connect', 'attribution', 'analytics', 'aiworker'],
  sales: ['customers', 'marketing', 'analytics', 'reports', 'automation'],
  marketing: ['customers', 'website', 'attribution', 'sales', 'reports'],
  analytics: ['reports', 'marketing', 'customers', 'finance', 'ai'],
  reports: ['analytics', 'sales', 'executive', 'performer'],
  attribution: ['marketing', 'customers', 'analytics', 'website', 'sales'],
  finance: ['analytics', 'reports', 'executive', 'automation'],
  website: ['marketing', 'analytics', 'customers', 'attribution', 'automation'],
  connect: ['customers', 'marketing', 'integrations', 'security'],
  executive: ['ai', 'finance', 'sales', 'analytics', 'operations', 'hr'],
  automation: ['tasks', 'projects', 'aiworker', 'executive', 'integrations'],
  memory: ['ai', 'performer', 'executive', 'aiworker'],
  performer: ['memory', 'ai', 'analytics', 'reports'],
  operations: ['tasks', 'projects', 'hr', 'finance', 'website'],
  hr: ['operations', 'finance', 'executive'],
  admin: ['security', 'settings', 'integrations'],
  security: ['admin', 'settings', 'connect'],
  settings: ['admin', 'security', 'integrations'],
  integrations: ['settings', 'automation', 'connect', 'ai'],
  tasks: ['projects', 'automation', 'operations', 'aiworker'],
  projects: ['tasks', 'automation', 'operations', 'sales'],
};

export const relationsOf = (id: string): RadialTool[] =>
  (RELATIONS[id] ?? []).map((rid) => BOARD_TOOL_MAP.get(rid)).filter((t): t is RadialTool => Boolean(t));

// Orbital radii (fraction of the board half-size): inner ring and outer ring.
// Alternating by index keeps same-ring neighbours 2 steps apart so cards never
// collide while angular spacing stays uniform.
export const orbitRadius = (layer: 'inner' | 'outer') =>
  layer === 'inner' ? 0.3 : 0.47;

export const orbit = (t: RadialTool) => {
  const theta = (deg2rad(t.deg) + Math.PI / 2) * -1 + Math.PI / 2;
  const rad = orbitRadius(t.layer);
  return {
    x: Math.cos(theta) * rad,
    y: Math.sin(theta) * rad,
    rad,
    color: FAMILIES[t.family].color,
  };
};

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

// Toolkit tiers (comparison page). Tier 1 is the full Normal Radial 01 spec.
// Tier 2 and Tier 3 are intentional placeholders — their specifications are
// intentionally not invented; only names, positioning and pricing exist.
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

export const TOOLKIT_TIERS: ToolkitTier[] = [
  {
    id: 'normal',
    name: 'Radial System 01',
    price: '$0',
    priceNote: 'included with all workspaces',
    status: 'active',
    tagline: 'Normal Radial Toolkit \u2014 the full 24-tool orbital command center.',
    included: [
      '24 tools across System, Intelligence, Work, Growth and Delivery',
      'CAN\u2019T DECIDE GPT CORE with live sync',
      'Relationship engine: tool-to-tool connections with live pulse',
      '8 PRO EXCLUSIVE crowns + Connection, Attribution, AI Worker',
      'Landscape dashboard shell: header, sidebar, canvas, inspector, status bar',
      '5 new live workspaces: Tasks, Projects, Customers, Sales, AI Worker',
    ],
    missing: [],
    cta: 'Explore the toolkit',
    href: '/dashboard/radial',
  },
  {
    ...TIER_2,
    priceNote: TIER_2.priceNote,
    included: [
      ...TIER_2.included,
      'Layered on the same CAN\u2019T DECIDE GPT ecosystem as Radial System 01 \u2014 same design system, distinct tier and purpose',
    ],
  },
  {
    id: 'operatorkit',
    name: 'Expansion 2',
    price: '$1,600',
    priceNote: 'one-time + activation',
    status: 'pending',
    tagline: 'Operator toolkit \u2014 specification pending. Nothing invented yet.',
    included: [],
    missing: [
      'Tool inventory not yet specified',
      'No features listed \u2014 will be added when the spec is written',
    ],
    cta: 'Spec pending',
    href: '/dashboard/toolkits',
  },
];