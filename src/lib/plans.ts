// Site plan registry — single source of truth for the two specials.
// Pure data + small workspace helpers so both API routes and client pages share it.

export interface PlanSpecials {
  label: string;
  lead: string;
  tools: string[];
}

export interface SitePlan {
  id: string;
  name: string;
  price: number;
  cadence: string;
  tagline: string;
  seats: string;
  features: string[];
  notIncluded: string[];
  specials: PlanSpecials;
  cta: string;
  featured: boolean;
  bonus?: string;
  note?: string;
}

const LIFE_TOOLS = [
  "Life Admin Autopilot",
  "The Inbox Triage",
  "Money Peace of Mind",
  "The Errand Brain",
  "Family/Household Coordinator",
  "The Decision Assistant",
  "Weekly Personal Recap",
  "The Fixer",
  "The Second Set of Eyes",
  "The Nudge",
  "The Buffer",
];

const OPERATOR_TOOLS = [
  "Shadow Founder",
  "Competitor Shadow",
  "Second Brain",
  "Ghost Mode",
  "Rescue Button",
  "Proof-of-Work",
  "The Closer",
  "The Scheduler",
  "Bookkeeper Lite",
  "The Recruiter",
  "The Negotiator",
  "The Researcher",
  "Weekly Ops",
  "Auto Renegotiate",
  "Silent Response",
  "Decay Detect",
  "Root Cause",
  "Pricing Experiments",
  "Consultant Button",
];

export const SITE_PLANS: SitePlan[] = [
  {
    id: "essential",
    name: "The $1,000 Special",
    price: 1000,
    cadence: "/month",
    tagline: "Essentials pack — the core operating system with basic tools & services, plus every $1,000 special included.",
    seats: "1 seat",
    features: [
      "Universal AI access (GPT-4, Claude, Gemini, Groq)",
      "Performer — describe it, it runs it",
      "Connect — Instagram, Facebook, LinkedIn, X, TikTok, YouTube, Google",
      "Business Memory — persistent context on everything",
      "Automation Studio — natural-language automations",
      "Core dashboard — Home, Tasks, Projects, Tool Board",
      "Slack, Gmail, Notion, GitHub + core integrations",
      "Standard security — encrypted sessions, activity logs",
    ],
    notIncluded: [
      "J Worker (browser + API automations)",
      "Executive Command Center",
      "Sales, Marketing, Customer, Finance, HR, Ops & Analytics modules",
      "Website builder + admin panel & team seats",
      "Custom integrations & advanced automations",
      "The 19 pro operator tools",
    ],
    specials: {
      label: "$1,000 Specials — included free",
      lead: "11 premium life tools — every one included in the $1,000 plan",
      tools: LIFE_TOOLS,
    },
    cta: "Get the $1,000 Special",
    featured: false,
  },
  {
    id: "pro",
    name: "The $1,600 Special",
    price: 1600,
    cadence: "/month",
    tagline: "Everything in the essentials pack, plus the $1,600 special with over $1,500 of new operator tools.",
    seats: "Everything + teams",
    features: [
      "Everything in the $1,000 Essentials pack",
      "J Worker — dual-engine automation (browser + API)",
      "Executive Command Center — pricing, renegotiation, competitor shadow",
      "All modules — Sales, Marketing, Customer, Finance, HR, Ops, Analytics, Reports",
      "Website builder, admin panel & team seats",
      "Custom integrations & advanced automations",
      "Priority support",
    ],
    notIncluded: [],
    specials: {
      label: "$1,600 Specials — operator stack",
      lead: "19 pro-premium operator tools — the new $1,500 toolset, all included",
      tools: OPERATOR_TOOLS,
    },
    cta: "Get the $1,600 Special",
    featured: true,
    bonus: "Over $1,500 of new tools included",
    note: "Upgraded from the $1,550 special.",
  },
];

export const DEFAULT_PLAN_ID = "pro";

export function findPlan(id: string): SitePlan | undefined {
  return SITE_PLANS.find((p) => p.id === id);
}

export function getWorkspacePlan(ws: { settings?: Record<string, unknown> }): string {
  const raw = ws.settings?.plan;
  return typeof raw === "string" && findPlan(raw) ? raw : DEFAULT_PLAN_ID;
}

export function setWorkspacePlan(ws: { settings?: Record<string, unknown> }, planId: string): void {
  ws.settings = { ...(ws.settings ?? {}), plan: planId };
}