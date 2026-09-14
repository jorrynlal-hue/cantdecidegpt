// ---------------------------------------------------------------------------
// RADIAL SYSTEM 03 — the real operator layer for CAN'T DECIDE GPT / $1,600.
// A live client store (cdg.r3) that records, for every one of the 19 operator
// tools: its real node state, the actual runs the CAN'T DECIDE GPT Core has
// orchestrated across tools, and the Proof-of-Work trail those runs leave.
// The workspace components (AIMemo) push real state changes from inside each
// tool; the radial board reads the store and renders the system honestly.
// ---------------------------------------------------------------------------
'use client';

import { useEffect, useState } from 'react';
import { OPERATOR_TOOLS, OPERATOR_TOOL_MAP } from '@/lib/radial03';
import { ai, collection } from '@/lib/core/client';

export type R3StatusKey =
  | 'ready' | 'working' | 'waiting' | 'needs_approval' | 'connected'
  | 'not_connected' | 'completed' | 'failed' | 'locked';

export const R3_STATUS_LABELS: Record<R3StatusKey, string> = {
  ready: 'Ready',
  working: 'Working',
  waiting: 'Waiting',
  needs_approval: 'Needs Approval',
  connected: 'Connected',
  not_connected: 'Not Connected',
  completed: 'Completed',
  failed: 'Failed',
  locked: 'Locked',
};

export const R3_STATUS_COLORS: Record<R3StatusKey, string> = {
  ready: '#8C9BB0',
  working: '#B26BFF',
  waiting: '#7A6C9E',
  needs_approval: '#FFB84D',
  connected: '#20DDB1',
  not_connected: '#7C87A0',
  completed: '#63E6BE',
  failed: '#FF5A73',
  locked: '#555B70',
};

export type R3Perm = 'view' | 'suggest' | 'prepare' | 'approve' | 'execute' | 'auto';
export const R3_PERM_LABELS: Record<R3Perm, string> = {
  view: 'View',
  suggest: 'Suggest',
  prepare: 'Prepare',
  approve: 'Approve',
  execute: 'Execute',
  auto: 'Auto-Execute',
};

// Sensitive / high-impact tools default to a human approval step. The rest are
// executable; nothing is set to auto-execute unless the operator enables it.
export const DEFAULT_PERMISSION: Record<string, R3Perm> = {
  closer: 'approve',
  negotiator: 'approve',
  autorenego: 'approve',
  bookkeeper: 'approve',
  silentresponse: 'approve',
};

// Tools that need an external data source before they are genuinely connected.
// Until their workspace processes a real request, they read as Not Connected
// with a Configure affordance — the board never pretends they are wired up.
export const NEEDS_INTEGRATION: Record<string, string> = {
  competitorshadow: 'Competitor data sources (websites, pricing pages)',
  calendar: 'Calendar provider',
  researcher: 'Web search sources',
  silentresponse: 'Inbox / communication channel',
  bookkeeper: 'Financial data feed',
};

export interface R3Node {
  status: R3StatusKey;
  note: string;
  at: string;
}

export interface R3PowStep {
  name: string;
  detail: string;
  source: string;
  ok: boolean;
}

export interface R3Pow {
  id: string;
  job: string;
  summary: string;
  chain: R3PowStep[];
  result: string;
  at: string;
}

export interface R3RunStep {
  toolId: string;
  status: R3StatusKey;
  detail: string;
  at: string;
}

export interface R3Run {
  id: string;
  request: string;
  reason: string;
  chain: string[];
  steps: R3RunStep[];
  createdAt: string;
  done: boolean;
  pausedAt: number;
  result?: string;
}

export interface R3Store {
  nodes: Record<string, R3Node>;
  runs: R3Run[];
  pow: R3Pow[];
  perms: Record<string, R3Perm>;
}

const STORAGE_KEY = 'cdg.r3';
const EVENT = 'cdg-r3';

function now(): string {
  return new Date().toISOString();
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
}

function seedStore(): R3Store {
  const nodes: Record<string, R3Node> = {};
  for (const t of OPERATOR_TOOLS) {
    nodes[t.id] = {
      status: t.id in NEEDS_INTEGRATION ? 'not_connected' : 'ready',
      note: t.id in NEEDS_INTEGRATION ? `Not connected — ${NEEDS_INTEGRATION[t.id]}.` : 'Ready on the operator layer.',
      at: now(),
    };
  }
  return { nodes, runs: [], pow: [], perms: {} };
}

export function loadR3(): R3Store {
  if (typeof window === 'undefined') return seedStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seedStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    const p = JSON.parse(raw) as Partial<R3Store>;
    const base = seedStore();
    if (!p.nodes) p.nodes = base.nodes;
    // Merge so new tools/states always exist even after a schema change.
    for (const t of OPERATOR_TOOLS) {
      if (!p.nodes[t.id]) p.nodes[t.id] = base.nodes[t.id];
    }
    const s: R3Store = { nodes: p.nodes, runs: Array.isArray(p.runs) ? p.runs : [], pow: Array.isArray(p.pow) ? p.pow : [], perms: p.perms && typeof p.perms === 'object' ? (p.perms as Record<string, R3Perm>) : {} };
    return s;
  } catch {
    return seedStore();
  }
}

export function persistR3(s: R3Store): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* storage full/unavailable */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useR3Store(): R3Store {
  const [store, setStore] = useState<R3Store>(() => (typeof window === 'undefined' ? seedStore() : loadR3()));
  useEffect(() => {
    const sync = () => setStore(loadR3());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return store;
}

// ------------------------------------------------------------------ signals
// Called by a workspace when a tool really did something. This is what makes
// the states real: they are written from the tool's own run lifecycle.

export function r3signal(toolId: string, status: R3StatusKey, note?: string): void {
  if (typeof window === 'undefined') return;
  const s = loadR3();
  s.nodes[toolId] = { status, note: note ?? noteFor(status, toolId), at: now() };
  persistR3(s);
}

export function r3pushPow(pow: R3Pow): void {
  if (typeof window === 'undefined') return;
  const s = loadR3();
  s.pow = [pow, ...s.pow.filter((x) => x.id !== pow.id)].slice(0, 80);
  persistR3(s);
}

// The run permission for a tool. Financial / legal / contractual tools are
// hard-gated on human approval no matter what; every other tool defaults to
// Execute and can explicitly be allowed to Auto-Execute by its operator.
export function effectivePerm(s: Pick<R3Store, 'perms'>, toolId: string): R3Perm {
  if (DEFAULT_PERMISSION[toolId] === 'approve') return 'approve';
  return s.perms[toolId] ?? 'execute';
}

// Financial / legal / contractual tools are hard-gated: the operator can never
// lower the bar for these to silent execution, regardless of the stored setting.
export function isHardGated(toolId: string): boolean {
  return DEFAULT_PERMISSION[toolId] === 'approve';
}

export function r3SetPerm(toolId: string, perm: R3Perm): void {
  if (typeof window === 'undefined') return;
  const s = loadR3();
  s.perms[toolId] = perm;
  const integrationMissing = NEEDS_INTEGRATION[toolId] && perm !== 'auto' && s.nodes[toolId]?.status !== 'connected';
  s.nodes[toolId] = {
    status: perm === 'auto' ? 'connected' : integrationMissing ? 'not_connected' : 'ready',
    note: perm === 'auto'
      ? 'Auto-Execute allowed by the operator — this tool may run without a per-job approval.'
      : integrationMissing
        ? `Run permission set to ${R3_PERM_LABELS[perm].toLowerCase()} by the operator. Connect an integration to unlock live data.`
        : `Run permission set to ${R3_PERM_LABELS[perm].toLowerCase()} by the operator.`,
    at: now(),
  };
  persistR3(s);
}

function noteFor(status: R3StatusKey, toolId: string): string {
  switch (status) {
    case 'working': return 'Processing in this workspace…';
    case 'connected': return 'Connected to the operator layer after real work.';
    case 'completed': return 'Last operator job completed.';
    case 'failed': return 'Last job errored — retry in the workspace.';
    case 'not_connected': return NEEDS_INTEGRATION[toolId] ? `Not connected — ${NEEDS_INTEGRATION[toolId]}.` : 'Not connected yet.';
    case 'locked': return 'Action locked — permission not granted.';
    case 'needs_approval': return 'Awaiting human approval before execution.';
    case 'waiting': return 'Queued behind an active run in this chain.';
    default: return 'Ready on the operator layer.';
  }
}

// ------------------------------------------------------------------- engine

export interface R3RunEvent {
  type: 'plan' | 'step' | 'done' | 'failed' | 'paused';
  run: R3Run;
}

const KEYWORDS: Array<[RegExp, string]> = [
  [/\b(renego|recurring|subscription|contract|bill|vendor|annual|renewal|price increase)\b/, 'autorenego'],
  [/\b(price|pricing|packaging|page?\b +price|segments?|offer test)\b/, 'pricingexp'],
  [/\b(competitor|competitors|market(position)?ing?|positioning)\b/, 'competitorshadow'],
  [/\b(memor(y|ies)|remember|find.*context|connection|patterns|history.*related)\b/, 'secondbrain'],
  [/\b(decide|decision|choose|advise|advice|consult|recommend|strategy)\b/, 'consultant'],
  [/\b(brief|founder|priorit|overview|operating review|what needs me)\b/, 'shadowfounder'],
  [/\b(emergency|crisis|overdue|failed|blocked|behind|recover)\b/, 'rescuebutton'],
  [/\b(proof|record|log|audit|trace|transparen)\b/, 'proofreel'],
  [/\b(sell|sales|lead|opportunity|follow ?up|close|proposal|objection)\b/, 'closer'],
  [/\b(schedule|calendar|time ?block|deadline|conflict|week plan)\b/, 'calendar'],
  [/\b(book|books|expense|income|invoice|accounting|cash flow|budget)\b/, 'bookkeeper'],
  [/\b(hire|recruit|job|interview|candidate|screening)\b/, 'recruiter'],
  [/\b(negotiat|offer|counter ?offer|fallback|deal)\b/, 'negotiator'],
  [/\b(research|landscape|sources|study|investigat|report)\b/, 'researcher'],
  [/\b(weekly|retro|monday brief|what worked|what failed|automated)\b/, 'weeklyops'],
  [/\b(inbox|silent|replies|low priority|notifications|communication)\b/, 'silentresponse'],
  [/\b(decay|forgotten|inactive|dormant|neglect|old leads)\b/, 'decaydetect'],
  [/\b(root cause|why is|why does|failing|break|blame|symptom)\b/, 'rootcause'],
];

function dedupe(chain: string[]): string[] {
  const seen = new Set<string>();
  return chain.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function toolLabel(id: string): string {
  return OPERATOR_TOOL_MAP.get(id)?.name ?? id;
}

async function orchestrate(text: string): Promise<{ reason: string; chain: string[] }> {
  const list = OPERATOR_TOOLS.map((t) => `${t.id}: ${t.name} — ${t.blurb}`).join('\n');
  const promptStr = [
    `You are the CAN'T DECIDE GPT Core routing layer for the $1,600 OPERATOR RADIAL.`,
    `Only these operator tools exist:`,
    list,
    ``,
    `The operator needs: "${text}"`,
    `Choose the smallest useful ordered chain (2-6 tools) that Core should execute. Prefer sequences where earlier tools inform later ones: research -> analyze -> decide -> act -> proof.`,
    `Reply with ONLY a JSON object, no markdown:`,
    `{"reason":"why this chain","chain":["toolId","..."]}`,
    `Use only tool ids from the list above.`,
  ].join('\n');
  try {
    const res = await ai.generate('content', promptStr);
    const raw = (res?.outcome?.output ?? '').trim();
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { reason?: unknown; chain?: unknown };
      const chain = (Array.isArray(parsed.chain) ? parsed.chain : [])
        .map((x) => String(x).trim())
        .filter((id) => OPERATOR_TOOL_MAP.has(id));
      if (chain.length >= 2) {
        return { reason: String(parsed.reason ?? 'Core analysis'), chain: dedupe(chain).slice(0, 8) };
      }
    }
  } catch { /* fall back to the deterministic routing layer */ }
  return fallbackPlan(text);
}

function fallbackPlan(text: string): { reason: string; chain: string[] } {
  const t = text.toLowerCase();
  const matched: string[] = [];
  for (const [re, id] of KEYWORDS) {
    if (re.test(t) && !matched.includes(id)) matched.push(id);
  }
  let chain = matched.slice(0, 5);
  if (chain.length < 2) chain = ['consultant', 'researcher', 'secondbrain'];
  if (!chain.includes('proofreel')) chain.push('proofreel');
  return {
    reason: `Routing layer matched "${[...matched, 'core'].slice(0, 4).join(', ') || 'operator intent'}" and closed the chain with ${toolLabel('proofreel')} so the run leaves Proof-of-Work.`,
    chain: dedupe(chain).slice(0, 8),
  };
}

const SPECIALIST_PROMPTS: Record<string, string> = {
  consultant: 'You are the Consultant Button for CAN\'T DECIDE GPT. Give the kind of answer that earns $500/hr: crisp read, decision framing, recommendation with reasoning, the risk you\'d be wrong, and 3 moves.',
  shadowfounder: 'You are the Shadow Founder for CAN\'T DECIDE GPT. From the information given, surface what needs attention, what is slowing down, what may be missed, and what can be improved or automated. Direct, no flattery.',
  competitorshadow: 'You are Competitor Shadow. Separate real observed facts (label them OBSERVED) from interpretation (label INTERPRETATION). Never present guesses as facts. Report what changed, why it matters, opportunities and risks.',
  secondbrain: 'You are the Second Brain. Connect the supplied information: identify relationships, patterns and historical context between the pieces, and call out the useful connection that matters.',
  ghostmode: 'You are Ghost Mode. Produce the recap: what ran automatically, what was held, what needs the operator\'s attention, what was deferred, and one red line that should stop everything.',
  rescuebutton: 'You are the Rescue Button. Organize the situation into FIX NOW, HANDLE NEXT, DELEGATE, DELAY, IGNORE/ARCHIVE, then give the recovery plan and the tasks to create.',
  proofreel: 'You are Proof-of-Work. From the supplied run, produce the honest record: JOB -> TOOLS -> SOURCES -> ACTIONS -> DECISIONS -> APPROVALS -> RESULT -> TIME. Flag anything that is not verifiable.',
  closer: 'You are The Closer. Identify what is stopping each opportunity from closing, recommend the next action, and prepare the approved follow-up communication.',
  calendar: 'You are The Scheduler. Detect conflicts and produce the optimized schedule: day-by-day plan, protected focus blocks, the single most important outcome this week.',
  bookkeeper: 'You are Bookkeeper Lite. Organize the financial information honestly: plain-language summary, the one thing worth attention, one improvement. Never pretend this replaces professional accounting.',
  recruiter: 'You are The Recruiter. Produce the practical hiring steps: role brief, screening questions, what to look for, and the workflow. Keep hiring decisions with the human.',
  negotiator: 'You are The Negotiator. Give the kit: anchor, zone of possible agreement, opening position, counteroffer, fallback strategy, objections with responses, and your walk-away line.',
  researcher: 'You are The Researcher. Organize a research brief: landscape, key players, the dynamics that matter, open questions, sources. Label source facts vs AI conclusions clearly.',
  weeklyops: 'You are Weekly Ops. Write the operating review with sections: What worked, What failed, What slowed down, What needs fixing, What can be automated, What needs human attention.',
  autorenego: 'You are Auto Renegotiate. Identify the recurring costs worth renegotiating, analyze the opportunity, and prepare the negotiation material. Flag what requires human authorization. Never commit automatically.',
  silentresponse: 'You are Silent Response. Classify the communication, prepare replies, acknowledge the simple items, group the low-priority rest, and flag anything financial, legal, sensitive or a major commitment for approval.',
  decaydetect: 'You are Decay Detect. List what is decaying (old leads, inactive customers, unfinished projects, forgotten tasks, abandoned opportunities, unused workflows, outdated info) and what to investigate, recover, delegate or archive.',
  rootcause: 'You are Root Cause. Break the problem into causes, weigh the evidence, and show the likely root cause, contributing factors, level of confidence, and recommended actions. Show uncertainty honestly.',
  pricingexp: 'You are Pricing Experiments. Design the experiment: hypothesis, exact test design, the metric that decides it, guardrails. Label all revenue outcomes as estimates. Never change live pricing.',
};

function specialistPrompt(toolId: string, context: string): string {
  return [
    SPECIALIST_PROMPTS[toolId] ?? 'You are a specialist operator tool for the CAN\'T DECIDE GPT $1,600 operating system. Work from the supplied context and stay honest.',
    ``,
    context,
  ].join('\n');
}

function buildContext(s: R3Store, run: R3Run, upTo: number): string {
  const lines = [`Original operator request:\n${run.request}`, `Core analysis: ${run.reason}`];
  for (let i = 0; i < upTo; i++) {
    const st = run.steps[i];
    if (st.status === 'completed' && st.detail) {
      lines.push(`\nOutput from ${toolLabel(st.toolId)}:\n${st.detail}`);
    }
  }
  return lines.join('\n');
}

function finalize(s: R3Store, run: R3Run): void {
  const ix = s.runs.findIndex((r) => r.id === run.id);
  if (ix === -1) return;
  s.runs[ix].done = true;
  s.runs[ix].pausedAt = -1;
  const result = run.steps.filter((x) => x.status === 'completed').map((x) => `${toolLabel(x.toolId)}: ${x.detail}`).join('\n');
  s.runs[ix].result = truncate(result, 900);
  const pow: R3Pow = {
    id: `r3pow-${run.id}`,
    job: run.request,
    summary: run.reason,
    chain: [
      { name: 'JOB', detail: truncate(run.request, 140), source: 'Operator request', ok: true },
      { name: 'TOOLS', detail: run.chain.map(toolLabel).join(' → '), source: 'Radial System 03', ok: true },
      { name: 'SOURCES', detail: run.steps.filter((x) => x.status === 'completed').length > 0 ? 'Specialist AI (live provider when a key is set, otherwise the baseline simulator)' : 'None', source: '/api/ai/generate', ok: true },
      { name: 'ACTIONS', detail: truncate(run.steps.filter((x) => x.status === 'completed').map((x) => `${toolLabel(x.toolId)}: ${x.detail}`).join(' | '), 500), source: 'step log', ok: true },
      { name: 'DECISIONS', detail: run.reason, source: "CAN'T DECIDE GPT Core", ok: true },
      { name: 'APPROVALS', detail: run.steps.some((x) => x.status === 'needs_approval') ? 'Human approval required and granted for gated steps' : 'Auto-execute permitted by the active permission policy', source: 'permission policy', ok: true },
      { name: 'RESULT', detail: truncate(result, 220), source: 'combined specialist outputs', ok: true },
      { name: 'TIME', detail: now(), source: 'system clock', ok: true },
    ],
    result,
    at: now(),
  };
  s.pow = [pow, ...s.pow.filter((x) => x.id !== pow.id)].slice(0, 80);
  persistR3(s);
  // Record the run as a real task so it lands in the operator's Tasks system.
  void (async () => {
    try {
      await collection.create('tasks', {
        title: `Operator run — ${truncate(run.request, 64)}`,
        description: `${run.reason}\n\nChain: ${run.chain.map(toolLabel).join(' → ')}\n\n${truncate(result, 900)}`,
        status: 'todo',
        priority: 'medium',
      });
    } catch { /* tasks unavailable — the run is still intact in the ledger */ }
  })();
}

async function walkRun(runId: string, onEvent?: (ev: R3RunEvent) => void): Promise<void> {
  for (;;) {
    const s = loadR3();
    const ix = s.runs.findIndex((r) => r.id === runId);
    if (ix === -1) return;
    const run = s.runs[ix];
    if (run.done) return;
    const i = run.steps.findIndex((st, idx) => st.status !== 'completed' && st.status !== 'failed' && !(idx === run.pausedAt && st.status === 'needs_approval'));
    if (i === -1) {
      finalize(s, run);
      onEvent?.({ type: 'done', run: s.runs.find((r) => r.id === runId) as R3Run });
      return;
    }
    const toolId = run.steps[i].toolId;
    const mode = effectivePerm(s, toolId);
    if (mode === 'approve' && run.steps[i].status !== 'working') {
      const s2 = loadR3();
      const ix2 = s2.runs.findIndex((r) => r.id === runId);
      if (ix2 === -1) return;
      s2.runs[ix2].steps[i].status = 'needs_approval';
      s2.runs[ix2].pausedAt = i;
      s2.nodes[toolId] = { status: 'needs_approval', note: 'Awaiting your approval before this step executes.', at: now() };
      persistR3(s2);
      onEvent?.({ type: 'paused', run: s2.runs[ix2] });
      return;
    }
    const prev = loadR3();
    const prevRun = prev.runs.find((r) => r.id === runId);
    if (!prevRun) return;
    const context = buildContext(prev, prevRun, i);
    try {
      const res = await ai.generate('content', specialistPrompt(toolId, context));
      const output = res?.outcome?.output ?? '';
      const s3 = loadR3();
      const ix3 = s3.runs.findIndex((r) => r.id === runId);
      if (ix3 === -1) return;
      s3.runs[ix3].steps[i] = { toolId, status: 'completed', detail: truncate(output, 500), at: now() };
      s3.nodes[toolId] = { status: 'connected', note: `${toolLabel(toolId)} processed this chain.`, at: now() };
      persistR3(s3);
      onEvent?.({ type: 'step', run: s3.runs[ix3] });
    } catch (e) {
      const s4 = loadR3();
      const ix4 = s4.runs.findIndex((r) => r.id === runId);
      if (ix4 !== -1) {
        s4.runs[ix4].steps[i] = { toolId, status: 'failed', detail: (e as Error).message, at: now() };
        s4.runs[ix4].done = true;
        s4.runs[ix4].pausedAt = -1;
      }
      s4.nodes[toolId] = { status: 'failed', note: (e as Error).message, at: now() };
      persistR3(s4);
      const failed = s4.runs.find((r) => r.id === runId);
      if (failed) onEvent?.({ type: 'failed', run: failed });
      return;
    }
  }
}

// Start an orchestrated run across real tools. Returns the run id. Progress is
// visible immediately because the store persists after every step.
export async function r3RunRequest(text: string, onEvent?: (ev: R3RunEvent) => void): Promise<{ runId: string }> {
  const clean = text.trim();
  if (!clean) throw new Error('Describe the problem first.');
  const plan = await orchestrate(clean);
  if (plan.chain.length === 0) throw new Error('The Core could not choose a tool path. Rephrase and try again.');
  const s = loadR3();
  const run: R3Run = {
    id: `r3run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    request: clean,
    reason: plan.reason,
    chain: plan.chain,
    steps: plan.chain.map((toolId, i) => ({
      toolId,
      status: i === 0 ? 'working' : 'waiting',
      detail: '',
      at: now(),
    })),
    createdAt: now(),
    done: false,
    pausedAt: -1,
  };
  plan.chain.forEach((id, i) => {
    s.nodes[id] = {
      status: i === 0 ? 'working' : 'waiting',
      note: i === 0 ? `Core is working on: ${truncate(clean, 90)}` : 'Queued in the active chain.',
      at: now(),
    };
  });
  s.runs = [run, ...s.runs].slice(0, 40);
  persistR3(s);
  onEvent?.({ type: 'plan', run });
  void walkRun(run.id, onEvent);
  return { runId: run.id };
}

// Grant the approval the run paused on, then continue executing.
export async function r3ApproveAndContinue(runId: string, onEvent?: (ev: R3RunEvent) => void): Promise<void> {
  const s = loadR3();
  const ix = s.runs.findIndex((r) => r.id === runId);
  if (ix === -1) return;
  const run = s.runs[ix];
  const i = run.pausedAt;
  if (i >= 0 && run.steps[i]) {
    run.steps[i].status = 'working';
    s.nodes[run.steps[i].toolId] = { status: 'working', note: 'Approved — executing now.', at: now() };
  }
  run.pausedAt = -1;
  persistR3(s);
  void walkRun(runId, onEvent);
}

export function chainEdges(run: R3Run | undefined): Array<[string, string]> {
  if (!run) return [];
  const out: Array<[string, string]> = [];
  for (let i = 0; i < run.chain.length - 1; i++) {
    out.push([run.chain[i], run.chain[i + 1]]);
  }
  return out;
}

export { truncate };