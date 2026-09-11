// Intelligence Routing + proposal generation (Blueprint layer 5, B6).
// Model output is ALWAYS a proposal, never a direct action. This engine produces
// deterministic proposals so every workflow has a non-AI fallback (principle B1.8).

import { WorkItem, WorkflowTemplate, PlanStep, ControlMode, EvidenceEntry, Actor } from './types';

export interface Proposal {
  summary: string;
  plan: PlanStep[];
  risk_notes: string[];
  confusion_guards: string[];
  evidence: EvidenceEntry;
}

const ids = (() => {
  let n = 0;
  return (p: string) => `${p}-${(++n).toString(36)}-${Date.now().toString(36).slice(-4)}`;
})();

function stepsFor(t: WorkflowTemplate, mode: ControlMode): PlanStep[] {
  return t.plan_shell.map((s) => ({
    ...s,
    mode,
    executed: false,
  }));
}

export function generateProposal(
  item: WorkItem,
  template: WorkflowTemplate | undefined,
  actor: Actor
): Proposal {
  const now = new Date().toISOString();
  const mode = item.control_mode;
  const steps = stepsFor(template || fallbackTemplate(item), mode);

  const guardDelivered =
    mode === 'ai_suggests' || mode === 'ai_prepares'
      ? 'Draft only. No external action executed by this proposal.'
      : mode === 'human_approves'
        ? 'Will not execute until an approver accepts. Approval gate enforced.'
        : mode === 'supervised'
          ? 'Executes within hard limits; alerts on any exception; rollback configured.'
          : mode === 'bounded_autonomy'
            ? 'Executes within strict policy limits with idempotency and rollback. Every step logged.'
            : 'No automated execution. Proposal is advisory only.';

  const summary = `Proposed plan for "${item.title}": ${steps.length} step(s) across capabilities ${item.required_capabilities.join(', ') || 'none'}. Control mode: ${mode}. ${guardDelivered}`;

  const evidence: EvidenceEntry = {
    id: ids('ev'),
    label: 'AI proposal (untrusted until validated)',
    kind: 'proposal',
    content: JSON.stringify({ summary, steps }, null, 2),
    recorded_by: actor,
    recorded_at: now,
  };

  return {
    summary,
    plan: steps,
    risk_notes: riskNotes(item),
    confusion_guards: [
      'This proposal can only become action by passing Check + Approve stages in the control plane.',
      'No tool has been invoked. No external side effect has occurred.',
    ],
    evidence,
  };
}

function fallbackTemplate(item: WorkItem): WorkflowTemplate {
  return {
    id: 'ad-hoc',
    name: 'Ad-hoc workflow',
    category: 'General',
    description: 'Auto-generated fallback workflow for an uncatalogued objective.',
    risk_class: item.risk_classification,
    required_capabilities: item.required_capabilities,
    applicable_policy_ids: item.applicable_policies.map((p) => p.policy_id),
    default_control_mode: item.control_mode,
    plan_shell: [
      {
        id: ids('step'),
        summary: 'Confirm objective and success criteria with requester',
        capability: 'coordination',
        mode: item.control_mode,
        prerequisites: [],
        executed: false,
      },
      {
        id: ids('step'),
        summary: 'Gather source information and resolve entities',
        capability: 'context',
        mode: item.control_mode,
        prerequisites: [],
        executed: false,
      },
      {
        id: ids('step'),
        summary: 'Apply applicable policies and record decisions',
        capability: 'policy',
        mode: item.control_mode,
        prerequisites: [],
        executed: false,
      },
      {
        id: ids('step'),
        summary: 'Produce deliverable and record evidence',
        capability: 'delivery',
        mode: item.control_mode,
        prerequisites: [],
        executed: false,
      },
    ],
    side_effect_hints: [],
    value_hypothesis: 'Complete a governed work item with full auditability.',
  };
}

function riskNotes(item: WorkItem): string[] {
  const notes: string[] = [];
  if (item.risk_classification === 'high' || item.risk_classification === 'critical') {
    notes.push(`Risk class ${item.risk_classification}: human approval gate required before execution.`);
  }
  if (item.external_side_effects.length > 0) {
    notes.push(`External side effects (${item.external_side_effects.join(', ')}) require Finance/external approval and idempotency.`);
  }
  notes.push('All AI outputs are treated as untrusted proposals until the control plane validates them.');
  return notes;
}

export function buildExpectedOutcome(item: WorkItem, template?: WorkflowTemplate): string {
  return template?.value_hypothesis || `Complete "${item.title}" with documented evidence and no unresolved exceptions.`;
}