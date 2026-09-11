// Human ↔ AI Work Layer — strategy catalog (Work Engine §, Execution Control, AI Workforce,
// Model Router, Skills, Work Memory, Decision Receipt, Teach AI).
// Pure, versioned contracts. No server store imports so both engine and UI can use them.
import { WorkItem, ControlMode, RiskClass, Actor, PolicyRef, STAGE_LABELS, STAGE_ORDER } from './types';

// ------------------------------------------------------------------ Execution Control
// Five user-facing execution modes plus the flagship Auto mode. These are the modes the
// strategy doc names, mapped onto the existing ControlMode dial underneath.
export type ExecutionMode = 'ai_only' | 'ai_to_human' | 'human_to_ai' | 'ai_and_human' | 'auto';

export const EXECUTION_MODES: ExecutionMode[] = ['ai_only', 'ai_to_human', 'human_to_ai', 'ai_and_human', 'auto'];

export const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  ai_only: 'AI only',
  ai_to_human: 'AI → Human',
  human_to_ai: 'Human → AI',
  ai_and_human: 'AI + Human',
  auto: 'Auto',
};

export const EXECUTION_MODE_META: Record<ExecutionMode, { label: string; short: string; desc: string; default_control: ControlMode }> = {
  ai_only: {
    label: 'AI only',
    short: 'AI',
    desc: 'AI does the whole job from start to finish. You get the result.',
    default_control: 'bounded_autonomy',
  },
  ai_to_human: {
    label: 'AI → Human',
    short: 'AI→You',
    desc: 'AI does the work, then hands it to a human to review, decide, or finish.',
    default_control: 'human_approves',
  },
  human_to_ai: {
    label: 'Human → AI',
    short: 'You→AI',
    desc: 'You set the direction or do the part only you can, then AI executes the rest.',
    default_control: 'supervised',
  },
  ai_and_human: {
    label: 'AI + Human',
    short: 'Both',
    desc: 'AI and a person work together on every step of the job.',
    default_control: 'human_approves',
  },
  auto: {
    label: 'Auto',
    short: 'Auto',
    desc: 'The system decides per step who should do the work — AI, a person, or both.',
    default_control: 'human_approves',
  },
};

// Resolve a user-facing execution mode to the underlying control-plane mode.
export function controlModeFor(executionMode: ExecutionMode, item: Pick<WorkItem, 'risk_classification' | 'external_side_effects'>): ControlMode {
  if (executionMode !== 'auto') return EXECUTION_MODE_META[executionMode].default_control;
  return autoControlMode(item);
}

// Auto decision: risk + side effects choose the safest mode that still gets work done.
export function autoControlMode(item: { risk_classification: RiskClass; external_side_effects: string[] }): ControlMode {
  const risk = item.risk_classification;
  const hasSideEffects = item.external_side_effects.length > 0;
  if (risk === 'critical' || risk === 'high') return hasSideEffects ? 'human_approves' : 'supervised';
  if (risk === 'medium') return hasSideEffects ? 'ai_prepares' : 'supervised';
  return 'bounded_autonomy';
}

export interface ExecutionControlSummary {
  execution_mode: ExecutionMode;
  control_mode: ControlMode;
  auto_reason?: string;
}

export function executionSummaryFor(item: WorkItem): ExecutionControlSummary {
  const mode: ExecutionMode = item.execution_mode || 'auto';
  const control = controlModeFor(mode, item);
  const reason =
    mode === 'auto'
      ? `Auto picked ${control} for ${item.risk_classification} risk${item.external_side_effects.length ? ' with external side effects' : ''}.`
      : undefined;
  return { execution_mode: mode, control_mode: control, auto_reason: reason };
}

// ------------------------------------------------------------------ AI Workforce
// Eight specialized workers the user can route work to. Each maps to workplace skills.
export interface WorkForceAgent {
  id: string;
  title: string;
  role: 'Researcher' | 'Analyst' | 'Writer' | 'Developer' | 'Operator' | 'Planner' | 'Reviewer' | 'Strategist';
  description: string;
  capabilities: string[];
  skills: string[];
  providerKind: 'chat' | 'content' | 'code';
  temp: string;
}

export const WORKFORCE_AGENTS: WorkForceAgent[] = [
  {
    id: 'w-researcher',
    title: 'Researcher',
    role: 'Researcher',
    description: 'Gathers source information, resolves entities, and assembles context for a task.',
    capabilities: ['context', 'research'],
    skills: ['research', 'data analysis'],
    providerKind: 'chat',
    temp: 'curious, source-aware',
  },
  {
    id: 'w-analyst',
    title: 'Analyst',
    role: 'Analyst',
    description: 'Turns raw data into interpretation: patterns, risks, and numbers that matter.',
    capabilities: ['analysis', 'data'],
    skills: ['data analysis', 'finance'],
    providerKind: 'chat',
    temp: 'precise, quantitative',
  },
  {
    id: 'w-writer',
    title: 'Writer',
    role: 'Writer',
    description: 'Produces deliverables: drafts, documents, marketing copy, and reports.',
    capabilities: ['delivery', 'writing'],
    skills: ['writing', 'marketing'],
    providerKind: 'content',
    temp: 'clear, on-voice',
  },
  {
    id: 'w-developer',
    title: 'Developer',
    role: 'Developer',
    description: 'Writes code, configures integrations, and ships technical work inside guardrails.',
    capabilities: ['engineering', 'code'],
    skills: ['coding'],
    providerKind: 'code',
    temp: 'rigorous, verifiable',
  },
  {
    id: 'w-operator',
    title: 'Operator',
    role: 'Operator',
    description: 'Executes defined actions through tools with idempotency and full logging.',
    capabilities: ['operations', 'execution'],
    skills: ['operations', 'admin'],
    providerKind: 'chat',
    temp: 'reliable, step-by-step',
  },
  {
    id: 'w-planner',
    title: 'Planner',
    role: 'Planner',
    description: 'Builds the structured plan: actions, outputs, dependencies, and stop conditions.',
    capabilities: ['coordination', 'planning'],
    skills: ['operations', 'admin'],
    providerKind: 'chat',
    temp: 'structured, dependency-aware',
  },
  {
    id: 'w-reviewer',
    title: 'Reviewer',
    role: 'Reviewer',
    description: 'Checks proposed work against policy, quality, risk, and expected outcome.',
    capabilities: ['policy', 'review'],
    skills: ['operations', 'customer support'],
    providerKind: 'chat',
    temp: 'skeptical, evidence-first',
  },
  {
    id: 'w-strategist',
    title: 'Strategist',
    role: 'Strategist',
    description: 'Decides direction when a task is ambiguous: what outcome actually matters.',
    capabilities: ['strategy', 'coordination'],
    skills: ['operations', 'recruiting'],
    providerKind: 'chat',
    temp: 'big-picture, decisive',
  },
];

// Find the best-suited workforce agent for a capability set.
export function agentsForCapabilities(capabilities: string[]): WorkForceAgent[] {
  if (!capabilities.length) return [WORKFORCE_AGENTS[0]];
  const score = (a: WorkForceAgent) => capabilities.filter((c) => a.capabilities.includes(c)).length;
  return WORKFORCE_AGENTS.slice().sort((a, b) => score(b) - score(a)).slice(0, 2);
}

// ------------------------------------------------------------------ Skills
export interface Skill {
  id: string;
  name: string;
  blurb: string;
  tools: string[];
  capabilities: string[];
  workforce: string[];
}

export const SKILLS: Skill[] = [
  { id: 'research', name: 'Research', blurb: 'Find, verify, and compress information into usable sources.', tools: ['research', 'summarize'], capabilities: ['research', 'context'], workforce: ['w-researcher', 'w-analyst'] },
  { id: 'sales', name: 'Sales', blurb: 'Qualify leads, draft outreach, and keep the pipeline moving.', tools: ['crm', 'email'], capabilities: ['sales', 'delivery'], workforce: ['w-writer', 'w-strategist'] },
  { id: 'marketing', name: 'Marketing', blurb: 'Campaigns, copy, and content that reaches the right people.', tools: ['marketing', 'content', 'image'], capabilities: ['marketing', 'delivery'], workforce: ['w-writer', 'w-analyst'] },
  { id: 'finance', name: 'Finance', blurb: 'Invoices, budgets, and matching numbers with reality.', tools: ['finance'], capabilities: ['finance', 'analysis'], workforce: ['w-analyst', 'w-operator'] },
  { id: 'coding', name: 'Coding', blurb: 'Build, debug, and ship software within guardrails.', tools: ['code'], capabilities: ['engineering', 'code'], workforce: ['w-developer'] },
  { id: 'design', name: 'Design', blurb: 'Create visual assets and structure them into products.', tools: ['image'], capabilities: ['design', 'delivery'], workforce: ['w-writer'] },
  { id: 'writing', name: 'Writing', blurb: 'Clear documents, reports, and communication.', tools: ['writing', 'docs'], capabilities: ['writing', 'delivery'], workforce: ['w-writer'] },
  { id: 'data analysis', name: 'Data analysis', blurb: 'Turn numbers into decisions.', tools: ['analyze', 'analytics'], capabilities: ['analysis', 'data'], workforce: ['w-analyst'] },
  { id: 'customer support', name: 'Customer support', blurb: 'Answer, resolve, and follow up with customers.', tools: ['inbox', 'email'], capabilities: ['support', 'coordination'], workforce: ['w-reviewer', 'w-operator'] },
  { id: 'recruiting', name: 'Recruiting', blurb: 'Source, screen, and coordinate people.', tools: ['team', 'humans'], capabilities: ['people', 'coordination'], workforce: ['w-strategist', 'w-operator'] },
  { id: 'operations', name: 'Operations', blurb: 'Run the plans, track execution, and keep things moving.', tools: ['work', 'automation'], capabilities: ['operations', 'execution'], workforce: ['w-operator', 'w-planner'] },
  { id: 'admin', name: 'Admin', blurb: 'Handle the everyday logistics that keep work organized.', tools: ['inbox', 'calendar'], capabilities: ['admin', 'coordination'], workforce: ['w-operator', 'w-planner'] },
];

// ------------------------------------------------------------------ Model Router
// Maps a provider kind + configured provider to the model that would actually run.
export interface ModelRoute {
  kind: string;
  capability: string;
  provider: string;
  model: string;
  baseline: boolean;
  ready: boolean;
}

export const CAPABILITY_PROVIDER_KIND: Record<string, 'chat' | 'content' | 'code' | 'image'> = {
  context: 'chat',
  research: 'chat',
  analysis: 'chat',
  data: 'chat',
  writing: 'content',
  delivery: 'content',
  marketing: 'content',
  code: 'code',
  engineering: 'code',
  design: 'image',
  finance: 'chat',
  operations: 'chat',
  review: 'chat',
  strategy: 'chat',
  support: 'chat',
  people: 'chat',
  coordination: 'chat',
  admin: 'chat',
  sales: 'chat',
};

// ------------------------------------------------------------------ Work Memory
// The seven memory categories the Work Memory layer stores (people, decisions, preferences,
// projects, knowledge, rules, patterns).
export type MemoryCategory = 'people' | 'decisions' | 'preferences' | 'projects' | 'knowledge' | 'rules' | 'patterns';

export const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; blurb: string }[] = [
  { id: 'people', label: 'People', blurb: 'Who is involved, their roles, and how they work.' },
  { id: 'decisions', label: 'Decisions', blurb: 'Choices made and the reason behind them.' },
  { id: 'preferences', label: 'Preferences', blurb: 'How you like things done — taught to the AI.' },
  { id: 'projects', label: 'Projects', blurb: 'Active work, goals, and current state.' },
  { id: 'knowledge', label: 'Knowledge', blurb: 'Processes, notes, and references.' },
  { id: 'rules', label: 'Rules', blurb: 'Standing instructions the AI always follows.' },
  { id: 'patterns', label: 'Patterns', blurb: 'Repeated shapes the AI recognizes and reuses.' },
];

export const MEMORY_CATEGORY_KIND: Record<MemoryCategory, 'note' | 'process' | 'instruction' | 'reference' | 'knowledge'> = {
  people: 'knowledge',
  decisions: 'reference',
  preferences: 'instruction',
  projects: 'process',
  knowledge: 'knowledge',
  rules: 'instruction',
  patterns: 'note',
};

// ------------------------------------------------------------------ Teach AI
// Teach AI scope: Always / For this project / Only this time.
export type TeachScope = 'always' | 'project' | 'once';

export const TEACH_SCOPES: { id: TeachScope; label: string; desc: string }[] = [
  { id: 'always', label: 'Always', desc: 'Remember this as a standing rule for everything.' },
  { id: 'project', label: 'For this project', desc: 'Apply this within the current project context.' },
  { id: 'once', label: 'Only this time', desc: 'Use it now; do not store.' },
];

// ------------------------------------------------------------------ Decision Receipt
// A durable, human-readable receipt for a completed work item: action, why, what was used,
// confidence, who approved, executed by, when.
export interface DecisionReceipt {
  receipt_id: string;
  workitem_id: string;
  title: string;
  action_taken: string;
  why: string;
  information_used: string[];
  confidence: 'high' | 'medium' | 'low';
  human_approval: { required: boolean; granted: boolean; approver?: string };
  executed_by: string;
  risk_class: RiskClass;
  controls: PolicyRef[];
  sealed_at: string;
}

export function decisionReceiptFor(item: WorkItem): DecisionReceipt {
  const approval = item.approvals.find((a) => a.status === 'approved');
  const personApproved = item.approvals.some((a) => a.status === 'approved' && a.decided_by?.type === 'person');
  const executedSteps = item.execution_steps.filter((s) => s.status === 'completed');
  const executors = new Set(item.execution_steps.map((s) => s.performed_by?.display).filter(Boolean) as string[]);
  const controls = item.applicable_policies.filter((p) => p.decision !== 'allow' || item.evidence.some((e) => e.kind === 'policy_check'));
  const exit = item.actual_outcome || item.expected_outcome;
  const info = item.evidence.filter((e) => e.kind !== 'record' && e.kind !== 'approval').map((e) => e.label).slice(0, 6);
  const confidence: DecisionReceipt['confidence'] =
    item.final_outcome === 'success' ? (executedSteps.length >= item.proposed_plan.length ? 'high' : 'medium') : item.final_outcome === 'partial' ? 'medium' : 'low';

  return {
    receipt_id: `RCPT-${item.id.replace(/[^0-9A-Z]/gi, '').toUpperCase()}`,
    workitem_id: item.id,
    title: item.title,
    action_taken: `Completed ${item.workflow} with ${executedSteps.length}/${item.proposed_plan.length} steps executed.`,
    why: item.objective,
    information_used: info.length ? info : ['Captured objective and validated plan'],
    confidence,
    human_approval: {
      required: controls.some((c) => c.decision === 'escalate') || item.approvals.some((a) => a.status === 'approved') || approval !== undefined,
      granted: personApproved,
      approver: approval?.decided_by?.display || item.approvals.find((a) => a.status === 'approved')?.decided_by?.display,
    },
    executed_by: executors.size ? Array.from(executors).join(', ') : item.control_mode === 'human_only' ? 'Human' : 'AI',
    risk_class: item.risk_classification,
    controls: controls.length ? controls : [{ policy_id: 'none', decision: 'allow', reason: 'No policy restrictions triggered.' }],
    sealed_at: item.completed_at || item.updated_at,
  };
}

// ------------------------------------------------------------------ Command Center
// What needs to happen? Group work items into the Command Center buckets.
export type CommandBucket = 'now' | 'ai_working' | 'waiting' | 'completed';

export interface CommandCard {
  item: WorkItem;
  bucket: CommandBucket;
  stage_label: string;
  summary: string;
  assignee: string;
  execution: ExecutionControlSummary;
}

export function bucketFor(item: WorkItem): CommandBucket {
  if (item.final_outcome !== 'in_progress') return 'completed';
  const pendingApprovals = item.approvals.some((a) => a.status === 'pending');
  const blocked = item.exceptions.some((e) => !e.resolved);
  // Humans can act now: approval gated, human-only work, or check-time (review required).
  if (item.stage === 'approve' && pendingApprovals) return 'now';
  if (item.stage === 'check') return 'now';
  if (item.control_mode === 'human_only' && item.stage === 'execute') return 'now';
  if (item.stage === 'capture' || item.stage === 'understand') return 'now';
  if (blocked) return 'waiting';
  if (pendingApprovals) return 'waiting';
  if (item.stage === 'plan' || item.stage === 'execute' || item.stage === 'verify') return 'ai_working';
  return 'waiting';
}

export const BUCKET_LABELS: Record<CommandBucket, { label: string; sub: string }> = {
  now: { label: 'Needs you now', sub: 'Something is waiting on a human decision or action.' },
  ai_working: { label: 'AI is working', sub: 'The system is executing or preparing these.' },
  waiting: { label: 'Waiting on someone', sub: 'Blocked on approvals, people, or pending context.' },
  completed: { label: 'Completed', sub: 'Finished work you can re-open or reuse.' },
};