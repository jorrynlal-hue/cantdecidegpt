// UIOL core contracts (Blueprint Part B2, B3, B4)
// Every type here is versioned and stable: contract-first architecture.

export type ControlMode =
  | 'human_only'
  | 'ai_suggests'
  | 'ai_prepares'
  | 'human_approves'
  | 'supervised'
  | 'bounded_autonomy';

export const CONTROL_MODES: ControlMode[] = [
  'human_only',
  'ai_suggests',
  'ai_prepares',
  'human_approves',
  'supervised',
  'bounded_autonomy',
];

export const CONTROL_MODE_LABELS: Record<ControlMode, string> = {
  human_only: 'Human only',
  ai_suggests: 'AI suggests',
  ai_prepares: 'AI prepares',
  human_approves: 'Human approves',
  supervised: 'Supervised execution',
  bounded_autonomy: 'Bounded autonomy',
};

export const CONTROL_MODE_DESC: Record<ControlMode, string> = {
  human_only: 'Platform organizes info and records the result. No AI action.',
  ai_suggests: 'AI recommends a plan. No action is prepared.',
  ai_prepares: 'AI drafts actions for human review.',
  human_approves: 'Executes only after an approver accepts.',
  supervised: 'Executes within limits; alerts on exceptions.',
  bounded_autonomy: 'Executes within strict policy and rollback limits.',
};

// The nine-stage work lifecycle (Blueprint B3)
export const STAGE_ORDER = [
  'capture',
  'understand',
  'plan',
  'check',
  'approve',
  'execute',
  'verify',
  'record',
  'learn',
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  capture: 'Capture',
  understand: 'Understand',
  plan: 'Plan',
  check: 'Check',
  approve: 'Approve',
  execute: 'Execute',
  verify: 'Verify',
  record: 'Record',
  learn: 'Learn',
};

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';

export type RiskClass = 'low' | 'medium' | 'high' | 'critical';

export const RISK_LABELS: Record<RiskClass, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export type ActorType = 'person' | 'agent' | 'automation' | 'human_agent';

export interface Actor {
  type: ActorType;
  identity: string;
  display: string;
  roles?: string[];
}

export type FinalOutcome = 'success' | 'partial' | 'failed' | 'cancelled' | 'in_progress';

export interface SourceInfo {
  kind: 'person' | 'system_event' | 'document' | 'message' | 'trigger';
  ref?: string;
}

export interface PolicyRef {
  policy_id: string;
  decision: 'allow' | 'deny' | 'escalate';
  reason?: string;
}

export interface Approval {
  id: string;
  stage: Stage;
  title: string;
  required_roles: string[];
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decided_by?: Actor;
  decided_at?: string;
  note?: string;
}

export interface ExecutionStep {
  id: string;
  action: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  performed_by?: Actor;
  started_at?: string;
  completed_at?: string;
  detail?: string;
}

export interface EvidenceEntry {
  id: string;
  label: string;
  kind: 'proposal' | 'policy_check' | 'approval' | 'execution' | 'verification' | 'exception' | 'record';
  content: string;
  recorded_by: Actor;
  recorded_at: string;
}

export interface PlanStep {
  id: string;
  summary: string;
  capability: string;
  mode: ControlMode;
  prerequisites: string[];
  stop_condition?: string;
  executed: boolean;
}

export interface ExceptionEntry {
  message: string;
  raised_at: string;
  resolved: boolean;
}

export interface WorkItem {
  id: string;
  workflow: string;
  title: string;
  objective: string;
  requester: Actor;
  accountable_owner: string;
  participants: Actor[];
  org_context: string;
  related_customer_case?: string;
  required_capabilities: string[];
  source_information?: SourceInfo;
  applicable_policies: PolicyRef[];
  risk_classification: RiskClass;
  control_mode: ControlMode;
  proposed_plan: PlanStep[];
  approvals: Approval[];
  stage: Stage;
  stage_status: Record<Stage, StageStatus>;
  execution_steps: ExecutionStep[];
  external_side_effects: string[];
  evidence: EvidenceEntry[];
  expected_outcome: string;
  actual_outcome?: string;
  final_outcome: FinalOutcome;
  exceptions: ExceptionEntry[];
  follow_up_tasks: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AuditEvent {
  id: string;
  workitem_id: string;
  at: string;
  actor: Actor;
  action: string;
  from?: string;
  to?: string;
  details?: string;
  checks: PolicyRef[];
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  scope: 'action' | 'data' | 'workflow' | 'approval';
  rule: string;
  action_when_denied: 'deny' | 'escalate' | 'fragment';
  enabled: boolean;
  version: number;
  created_at: string;
}

export interface PolicyDecision {
  policy_id: string;
  name: string;
  decision: 'allow' | 'deny' | 'escalate';
  reason: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  title?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  risk_class: RiskClass;
  required_capabilities: string[];
  applicable_policy_ids: string[];
  default_control_mode: ControlMode;
  plan_shell: PlanStep[];
  side_effect_hints: string[];
  value_hypothesis: string;
}

export interface StageActionPayload {
  note?: string;
  decision?: 'approved' | 'rejected';
  approval_id?: string;
  follow_ups?: string[];
  outcome?: FinalOutcome;
}

export interface CreateWorkItemInput {
  workflow: string;
  template_id: string;
  title: string;
  objective: string;
  org_context: string;
  related_customer_case?: string;
  control_mode: ControlMode;
  requester_id?: string;
  additional_info?: string;
}