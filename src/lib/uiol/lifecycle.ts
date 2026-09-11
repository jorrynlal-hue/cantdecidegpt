// Nine-stage work lifecycle state machine (Blueprint B3) + control-mode gates (B4)
import {
  Stage,
  StageStatus,
  ControlMode,
  WorkItem,
  Approval,
  Actor,
  STAGE_ORDER,
  STAGE_LABELS,
} from './types';

export function nextStage(s: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(s);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

export function stageIndex(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

export function isBefore(a: Stage, b: Stage): boolean {
  return stageIndex(a) < stageIndex(b);
}

// Control modes that require an explicit human approver before execution.
export function requiresHumanApproval(item: WorkItem): boolean {
  if (item.control_mode === 'human_only' || item.control_mode === 'human_approves') return true;
  if (item.risk_classification === 'high' || item.risk_classification === 'critical') return true;
  // Any external side effect needs an approval gate unless bounded autonomy is explicitly granted.
  if (item.external_side_effects.length > 0 && item.control_mode !== 'bounded_autonomy') return true;
  return false;
}

// Control modes that allow execution without a human-in-the-loop decision at each step.
export function mayAutoExecute(item: WorkItem): boolean {
  return item.control_mode === 'supervised' || item.control_mode === 'bounded_autonomy';
}

export function canEditControlMode(item: WorkItem): boolean {
  return isBefore(item.stage, 'approve');
}

export function allowedTransition(from: Stage, to: Stage): boolean {
  const i = STAGE_ORDER.indexOf(from);
  const j = STAGE_ORDER.indexOf(to);
  if (i === -1 || j === -1) return false;
  return j === i + 1 || j === i;
}

interface FreshWorkItem {
  id: string;
  workflow: string;
  title: string;
  objective: string;
  requester: Actor;
  accountable_owner: string;
  org_context: string;
  risk_classification: WorkItem['risk_classification'];
  control_mode: ControlMode;
  required_capabilities: string[];
  external_side_effects: string[];
  expected_outcome: string;
  proposed_plan: WorkItem['proposed_plan'];
  applicable_policies: WorkItem['applicable_policies'];
  related_customer_case?: string;
}

export function buildInitialStageStatus(current: Stage): Record<Stage, StageStatus> {
  const status = {} as Record<Stage, StageStatus>;
  STAGE_ORDER.forEach((s) => {
    status[s] = s === current ? 'in_progress' : 'pending';
  });
  return status;
}

export function stageStatusAfter(
  item: WorkItem,
  targetCompletedStages: Stage[]
): Record<Stage, StageStatus> {
  const status = {} as Record<Stage, StageStatus>;
  STAGE_ORDER.forEach((s) => {
    if (targetCompletedStages.includes(s) || isBefore(s, item.stage)) {
      status[s] = 'completed';
    } else if (s === item.stage) {
      status[s] = 'in_progress';
    } else {
      status[s] = 'pending';
    }
  });
  return status;
}

export function createInitialWorkItem(f: FreshWorkItem): WorkItem {
  const stage: Stage = 'capture';
  const status = buildInitialStageStatus(stage);
  const now = new Date().toISOString();
  return {
    id: f.id,
    workflow: f.workflow,
    title: f.title,
    objective: f.objective,
    requester: f.requester,
    accountable_owner: f.accountable_owner,
    participants: [f.requester],
    org_context: f.org_context,
    related_customer_case: f.related_customer_case,
    required_capabilities: f.required_capabilities,
    applicable_policies: f.applicable_policies,
    risk_classification: f.risk_classification,
    control_mode: f.control_mode,
    proposed_plan: f.proposed_plan,
    approvals: [],
    stage,
    stage_status: status,
    execution_steps: [],
    external_side_effects: f.external_side_effects,
    evidence: [],
    expected_outcome: f.expected_outcome,
    final_outcome: 'in_progress',
    exceptions: [],
    follow_up_tasks: [],
    created_at: now,
    updated_at: now,
  };
}

export function needsApprovalCreated(item: WorkItem): string {
  // Deterministic approval title for a pending approval gate.
  const role =
    item.risk_classification === 'high' || item.risk_classification === 'critical'
      ? 'Senior Operator'
      : 'Operations Approver';
  return role;
}

export function buildApprovalGates(item: WorkItem, seq: () => string): Approval[] {
  if (!requiresHumanApproval(item)) {
    return [
      {
        id: seq(),
        stage: 'approve',
        title: 'Auto-approval (no gate required)',
        required_roles: [],
        status: 'skipped',
      },
    ];
  }
  const gates: Approval[] = [];
  const role = needsApprovalCreated(item);
  gates.push({
    id: seq(),
    stage: 'approve',
    title: `${role}: approve execution plan`,
    required_roles: [role],
    status: 'pending',
  });
  if (item.external_side_effects.length > 0) {
    gates.push({
      id: seq(),
      stage: 'approve',
      title: `Finance / External impact: authorize "${item.external_side_effects.join(', ')}"`,
      required_roles: ['Finance Approver'],
      status: 'pending',
    });
  }
  return gates;
}

export const stageHelpText: Record<Stage, string> = {
  capture: 'Objective captured from person, event, document, message, or trigger.',
  understand: 'Entities resolved, context retrieved, constraints identified, risk classified.',
  plan: 'Structured plan: actions, outputs, dependencies, stop conditions.',
  check: 'Permissions, policy, data quality, conflicts, and safety evaluated.',
  approve: 'Routed to the required human or organizational approver.',
  execute: 'Actions performed via tools, deterministic services, agents, or people.',
  verify: 'Actual results compared to expected results; exceptions inspected.',
  record: 'Decision, evidence, outcome, and every responsible actor stored durably.',
  learn: 'Routing, templates, and performance improved without silently changing controls.',
};

export { STAGE_ORDER, STAGE_LABELS };