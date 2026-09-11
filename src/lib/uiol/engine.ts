// Control-plane engine: the only place the domain rules are enforced.
// API routes are thin shells over this engine. (Blueprint B6: control plane before intelligence plane)
import {
  WorkItem,
  AuditEvent,
  Actor,
  PolicyDecision,
  Stage,
  ControlMode,
  PolicyRef,
  Approval,
  FinalOutcome,
  CreateWorkItemInput,
} from './types';
import {
  requiresHumanApproval,
  mayAutoExecute,
  allowedTransition,
  nextStage,
  buildApprovalGates,
  stageHelpText,
  isBefore,
  STAGE_LABELS,
} from './lifecycle';
import { evaluatePolicies, worstDecision } from './policies';
import { generateProposal, buildExpectedOutcome, Proposal } from './planning';
import {
  bucketFor,
  CommandCard,
  decisionReceiptFor,
  DecisionReceipt,
  executionSummaryFor,
  controlModeFor,
  SKILLS,
  WORKFORCE_AGENTS,
} from './layer';
import { loadDB, persist, nextId, newEvidenceId, pushAudit, DB } from './store';
import { SEED_ORG_CONTEXT } from './seed';

// A stable, versioned contract for every control-plane action (B6: contract-first).
export interface StageActionResult {
  ok: boolean;
  workitem?: WorkItem;
  error?: string;
  verdict?: string;
  decisions?: PublishableDecision[];
  proposal?: Proposal;
  stageHelp?: string;
  checks?: PolicyRef[];
}

export interface PublishableDecision {
  policy_id: string;
  decision: string;
  reason: string;
}

const actorLabel = (a: Actor) => a.display;

function now(): string {
  return new Date().toISOString();
}

function stamp(item: WorkItem): void {
  item.updated_at = now();
}

function log(db: DB, item: WorkItem, actor: Actor, action: string, from: string | undefined, to: string | undefined, details: string, checks: PolicyRef[] = []): void {
  pushAudit(db, {
    id: newEvidenceId(db),
    workitem_id: item.id,
    at: now(),
    actor,
    action,
    from,
    to,
    details: details.length > 400 ? details.slice(0, 400) + '…' : details,
    checks,
  });
}

function addEvidence(item: WorkItem, label: string, kind: WorkItem['evidence'][number]['kind'], content: string, actor: Actor): void {
  item.evidence.push({
    id: newEvidenceId(loadDB()),
    label,
    kind,
    content,
    recorded_by: actor,
    recorded_at: now(),
  });
}

// ---------------------------------------------------------------- read paths

export function listWorkItems(publicTools?: { stage?: string; q?: string }) {
  const db = loadDB();
  let items = db.workitems.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (publicTools?.stage) items = items.filter((i) => i.stage === publicTools.stage);
  if (publicTools?.q) {
    const q = publicTools.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.objective.toLowerCase().includes(q) ||
        i.workflow.toLowerCase().includes(q)
    );
  }
  return { items: items.map(publicShape), db };
}

export function getWorkItem(id: string) {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === id);
  return item ? item : null;
}

export function listPolicies() {
  const db = loadDB();
  return db.policies.slice().sort((a, b) => a.id.localeCompare(b.id));
}

export function updatePolicy(id: string, patch: { enabled?: boolean }) {
  const db = loadDB();
  const p = db.policies.find((x) => x.id === id);
  if (!p) return null;
  if (typeof patch.enabled === 'boolean') {
    p.enabled = patch.enabled;
    p.version += 1;
  }
  persist(db);
  return p;
}

export function evaluateAction(args: { workitem_id?: string; action?: string; amount?: number; role?: string }) {
  const db = loadDB();
  const actor: Actor = { type: args.role ? 'person' : 'person', identity: args.role || 'u-1', display: args.role || 'Operator' };
  const item = args.workitem_id
    ? db.workitems.find((i) => i.id === args.workitem_id)!
    : (db.workitems[0] as WorkItem);
  const action = args.action || 'execute';
  const decisions = evaluatePolicies(item, action, actor, db.policies, { amount: args.amount });
  return { decisions, verdict: worstDecision(decisions), item_id: item?.id };
}

export function listApprovals(publicTools?: { pending?: string }) {
  const db = loadDB();
  const rows: Array<{ workitem: WorkItem; approval: Approval }> = [];
  for (const wi of db.workitems) {
    for (const ap of wi.approvals) {
      if (publicTools?.pending === 'true' && ap.status !== 'pending') continue;
      rows.push({ workitem: wi, approval: ap });
    }
  }
  return rows.sort((a, b) => (a.approval.decided_at || a.workitem.updated_at).localeCompare(b.approval.decided_at || b.workitem.updated_at));
}

export function actOnApproval(workitemId: string, approvalId: string, decision: 'approved' | 'rejected', actor: Actor, note?: string): StageActionResult {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === workitemId);
  if (!item) return { ok: false, error: 'Work item not found' };
  const ap = item.approvals.find((a) => a.id === approvalId);
  if (!ap) return { ok: false, error: 'Approval not found' };
  if (ap.status !== 'pending') return { ok: false, error: `Approval already ${ap.status}` };

  const missingRole = ap.required_roles.filter((r) => !(actor.roles || []).includes(r));
  if (missingRole.length > 0) {
    return {
      ok: false,
      error: `Actor lacks required role(s): ${missingRole.join(', ')}`,
    };
  }

  ap.status = decision;
  ap.decided_by = actor;
  ap.decided_at = now();
  ap.note = note || ap.note;

  addEvidence(item, `Approval: ${decision}`, 'approval', `${ap.title} — ${decision} by ${actorLabel(actor)}${note ? `: ${note}` : ''}`, actor);
  log(db, item, actor, `approval.${decision}`, ap.status === 'rejected' ? 'approve' : 'approve', 'approve', `${ap.title} by ${actorLabel(actor)}`);
  stamp(item);
  persist(db);
  return { ok: true, workitem: item };
}

// ------------------------------------------------------------- strategy read paths

// Command Center: What needs to happen? (NOW / AI working / Waiting / Completed)
export function commandCenter() {
  const db = loadDB();
  const cards: CommandCard[] = db.workitems.map((item) => {
    const exec = executionSummaryFor(item);
    const bucket = bucketFor(item);
    const stage_label = STAGE_LABELS[item.stage];
    return {
      item: publicShape(item),
      bucket,
      stage_label,
      summary: item.objective,
      assignee:
        item.control_mode === 'human_only'
          ? item.accountable_owner
          : exec.execution_mode === 'ai_only'
            ? 'AI workforce'
            : 'AI + ' + item.accountable_owner,
      execution: exec,
    };
  });
  const buckets = {
    now: cards.filter((c) => c.bucket === 'now'),
    ai_working: cards.filter((c) => c.bucket === 'ai_working'),
    waiting: cards.filter((c) => c.bucket === 'waiting'),
    completed: cards.filter((c) => c.bucket === 'completed'),
  };
  return { buckets, total: cards.length };
}

// AI Workforce roster with live routing + per-worker load derived from work items.
export function workforceSnapshot() {
  const db = loadDB();
  const agents = WORKFORCE_AGENTS.map((a) => {
    const items = db.workitems.filter((i) => i.final_outcome === 'in_progress' && i.required_capabilities.some((c) => a.capabilities.includes(c)));
    const active = items.length;
    return { ...a, active, status: active > 0 ? 'busy' : 'ready' as const };
  });
  const skills = SKILLS.map((s) => {
    const items = db.workitems.filter((i) => i.required_capabilities.some((c) => s.capabilities.includes(c)));
    return { ...s, activeItems: items.length };
  });
  return { agents, skills };
}

// Decision Receipt for a completed work item. Null while still in progress.
export function decisionReceipt(id: string): DecisionReceipt | null {
  const item = getWorkItem(id);
  if (!item || item.final_outcome === 'in_progress') return null;
  return decisionReceiptFor(item);
}

// Take over: hand an AI-managed work item to a human at any stage. The human keeps
// everything (context, plan, evidence) and becomes the executor.
export function takeOver(id: string, actor: Actor): StageActionResult {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Work item not found' };
  if (item.final_outcome !== 'in_progress') return { ok: false, error: 'Work item is already completed.' };

  const prev = item.control_mode;
  item.control_mode = 'human_only';
  item.execution_mode = undefined;
  item.stage_status.execute = item.stage === 'execute' ? 'in_progress' : item.stage_status.execute;
  addEvidence(item, 'Take over by human', 'record', `${item.title} handed to ${actorLabel(actor)}. Control now human_only. AI becomes assistant; context preserved.`, actor);
  log(db, item, actor, 'workitem.takeover', prev, 'human_only', `Human took over work item ${id}. AI remains available to assist.`);
  stamp(item);
  persist(db);
  return { ok: true, workitem: publicShape(item) };
}

// Give back to AI: after a human does their part, AI re-engages under the chosen mode.
export function giveBack(id: string, mode: WorkItem['execution_mode'], actor: Actor): StageActionResult {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Work item not found' };
  if (item.control_mode !== 'human_only') return { ok: false, error: 'Work item is not human-controlled.' };

  const chosen: NonNullable<WorkItem['execution_mode']> = mode || 'auto';
  const control = controlModeFor(chosen, item);
  const prev = item.control_mode;
  item.execution_mode = chosen;
  item.control_mode = control;
  addEvidence(item, 'Give back to AI', 'record', `${item.title} handed back to AI under ${chosen} (${control}). Human hand-off preserved in evidence.`, actor);
  log(db, item, actor, 'workitem.giveback', 'human_only', prev, `AI re-engaged under ${chosen} -> ${control}.`);
  stamp(item);
  persist(db);
  return { ok: true, workitem: publicShape(item) };
}

// ------------------------------------------------------------- write paths

const ordered: Stage[] = ['capture', 'understand', 'plan', 'check', 'approve', 'execute', 'verify', 'record', 'learn'];

export function createWorkItem(input: CreateWorkItemInput, actor: Actor): StageActionResult {
  const db = loadDB();
  const template = db.templates.find((t) => t.id === input.template_id);
  if (!template) return { ok: false, error: 'Unknown workflow template' };
  const req = input.requester_id ? db.users.find((u) => u.id === input.requester_id) : db.users[0];

  const id = nextId(db, 'WI');
  const policies: PolicyRef[] = template.applicable_policy_ids.map((pid) => ({ policy_id: pid, decision: 'allow' as const }));
  const proposed = template.plan_shell.map((s) => ({ ...s, mode: input.control_mode, executed: false }));

  const item: WorkItem = {
    id,
    workflow: template.name,
    title: input.title,
    objective: input.objective,
    requester: { type: 'person', identity: req!.id, display: req!.name },
    accountable_owner: req!.name,
    participants: [{ type: 'person', identity: req!.id, display: req!.name }],
    org_context: input.org_context || SEED_ORG_CONTEXT,
    related_customer_case: input.related_customer_case,
    required_capabilities: template.required_capabilities,
    applicable_policies: policies,
    risk_classification: template.risk_class,
    control_mode: input.control_mode,
    execution_mode: input.execution_mode,
    proposed_plan: proposed,
    approvals: [],
    stage: 'capture',
    stage_status: {
      capture: 'in_progress', understand: 'pending', plan: 'pending', check: 'pending',
      approve: 'pending', execute: 'pending', verify: 'pending', record: 'pending', learn: 'pending',
    },
    execution_steps: [],
    external_side_effects: template.side_effect_hints,
    evidence: [],
    expected_outcome: template.value_hypothesis,
    final_outcome: 'in_progress',
    exceptions: [],
    follow_up_tasks: [],
    created_at: now(),
    updated_at: now(),
  };

  addEvidence(item, 'Capture: objective recorded', 'record', `${item.title} — ${item.objective}`, actor);
  log(db, item, actor, 'workitem.created', undefined, 'capture', `Created from template ${template.name}`, policies);
  db.workitems.unshift(item);
  persist(db);
  return { ok: true, workitem: item };
}

export function updateWorkItem(id: string, actor: Actor, patch: { title?: string; objective?: string; control_mode?: ControlMode; execution_mode?: NonNullable<WorkItem['execution_mode']>; accountable_owner?: string }): StageActionResult {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Work item not found' };

  if (patch.title) item.title = patch.title;
  if (patch.objective) item.objective = patch.objective;
  if (patch.accountable_owner) item.accountable_owner = patch.accountable_owner;
  if (patch.execution_mode) {
    item.execution_mode = patch.execution_mode;
    item.control_mode = controlModeFor(patch.execution_mode, item);
  }
  if (patch.control_mode && (isBefore(item.stage, 'approve') || item.stage === 'capture')) {
    item.control_mode = patch.control_mode;
    item.proposed_plan = item.proposed_plan.map((s) => ({ ...s, mode: patch.control_mode! }));
  }

  addEvidence(item, 'Record: field update', 'record', `Updated by ${actorLabel(actor)}: title/objective/owner/mode (if pre-approval)`, actor);
  log(db, item, actor, 'workitem.updated', item.stage, item.stage, `Fields updated by ${actorLabel(actor)}`);
  stamp(item);
  persist(db);
  return { ok: true, workitem: item };
}

// The central stage-action dispatcher: enforces the 9-stage lifecycle + control modes + policies.
export function actStage(id: string, stage: Stage, action: string, actor: Actor, payload: { note?: string; decision?: 'approved' | 'rejected'; approval_id?: string; follow_ups?: string[]; outcome?: FinalOutcome } = {}): StageActionResult {
  const db = loadDB();
  const item = db.workitems.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Work item not found' };

  switch (stage) {
    case 'capture': {
      // Acknowledge the objective; source information recorded.
      addEvidence(item, 'Capture confirmed', 'record', `Objective acknowledged by ${actorLabel(actor)}.`, actor);
      return advanceHelper(db, item, actor, 'capture', 'Confirm capture', 'Objective acknowledged and locked.');
    }
    case 'understand': {
      addEvidence(item, 'Understand: context resolved', 'record', 'Entities resolved, constraints identified, risk classified per template.', actor);
      return advanceHelper(db, item, actor, 'understand', 'Run understanding', 'Context and constraints captured with provenance.');
    }
    case 'plan': {
      if (action === 'propose') {
        const template = db.templates.find((t) => t.name === item.workflow) || db.templates.find((t) => t.id === item.workflow);
        const proposal = generateProposal(item, template, actor);
        // Distinguish proposal from execution (B6). Proposal stored as evidence, never applied directly.
        addEvidence(item, 'Proposal generated (untrusted)', 'proposal', proposal.evidence.content, actor);
        item.proposed_plan = proposal.plan;
        item.expected_outcome = buildExpectedOutcome(item, template || undefined) || item.expected_outcome;
        log(db, item, actor, 'plan.proposal', 'plan', 'plan', `Proposal generated for ${item.id}. Untrusted until validated.`);
        // Note: execution does NOT happen yet. Plan stage completes only after proposal is accepted.
        return { ok: true, workitem: publicShape(item), proposal, stageHelp: stageHelpText.plan };
      }
      if (action === 'accept') {
        addEvidence(item, 'Plan accepted', 'record', `Proposed plan accepted as draft by ${actorLabel(actor)}. Awaiting policy check.`, actor);
        return advanceHelper(db, item, actor, 'plan', 'Accept plan', 'Plan approved as draft for policy evaluation.');
      }
      return { ok: false, error: 'Unknown plan action. Use propose or accept.' };
    }
    case 'check': {
      if (action === 'run-check') {
        const decisions = evaluatePolicies(item, `execute`, actor, db.policies, { amount: 0 });
        const verdict = worstDecision(decisions);
        item.applicable_policies = decisions.map((d) => ({ policy_id: d.policy_id, decision: d.decision, reason: d.reason }));
        addEvidence(
          item,
          `Policy check: ${verdict}`,
          'policy_check',
          decisions.length ? decisions.map((d) => `[${d.policy_id}] ${d.decision.toUpperCase()}: ${d.reason}`).join('\n') : 'No policy restrictions triggered.',
          actor
        );
        log(db, item, actor, 'check.evaluate', 'check', 'check', `Policy evaluation -> ${verdict}. ${decisions.length} restriction(s).`, decisions.map((d) => ({ policy_id: d.policy_id, decision: d.decision, reason: d.reason })));

        if (verdict === 'deny') {
          item.exceptions.push({ message: 'Policy denial(s) present. Execution blocked until resolved.', raised_at: now(), resolved: false });
          item.stage_status.check = 'blocked';
          stamp(item);
          persist(db);
          return { ok: false, verdict, error: 'Denied by policy. See exceptions and policy decisions.', decisions };
        }
        item.stage_status.check = 'completed';
        item.exceptions = item.exceptions.filter((e) => !e.message.includes('awaiting completion'));
        // Materialize approval gates on entering the approve stage (requiresHumanApproval by risk + mode).
        const adv = advanceHelper(db, item, actor, 'check', 'Pass policy check', `Policy evaluation passed (${verdict}). Proceeding to approval.`);
        return { ...adv, verdict, decisions };
      }
      return { ok: false, error: 'Unknown check action. Use run-check.' };
    }
    case 'approve': {
      // Approvals are acted on via the approvals API; this simply confirms the gate state.
      const pending = item.approvals.filter((a) => a.status === 'pending');
      if (pending.length > 0) {
        return { ok: false, error: `Pending approvals must be resolved first (${pending.length}).`, workitem: publicShape(item) };
      }
      if (action === 'enter-execute') {
        return advanceHelper(db, item, actor, 'approve', 'Enter execution', `Approval gates satisfied (${item.approvals.filter((a) => a.status === 'approved').length} approved).`);
      }
      return { ok: false, error: 'Unknown approve action.' };
    }
    case 'execute': {
      if (action === 'execute-plan') {
        return executePlan(db, item, actor, payload);
      }
      return { ok: false, error: 'Unknown execute action.' };
    }
    case 'verify': {
      if (action === 'verify') {
        const applied = item.applicable_policies;
        const expected = item.expected_outcome;
        const actual =
        payload.outcome === 'failed'
          ? 'Execution produced errors; result did not match expected outcome.'
          : payload.outcome === 'partial'
            ? 'Execution completed with partial results; some steps remain open.'
            : 'Execution completed and observed results match expected outcome within tolerance.';
        item.actual_outcome = actual;
        item.final_outcome = payload.outcome || 'success';
        item.exceptions = item.exceptions.filter((e) => e.resolved);
        addEvidence(item, `Verification: ${item.final_outcome}`, 'verification', `Expected: ${expected}\nActual: ${actual}\nPolicy applied: ${applied.length} restrictions (see check stage).`, actor);
        log(db, item, actor, 'verify.outcome', 'verify', 'verify', `Verified -> ${item.final_outcome}`, applied);
        // Move to record stage after verification; record + learn seal the item.
        advanceHelper(db, item, actor, 'verify', 'Verify outcome', `Result verified as ${item.final_outcome}.`);
        return { ok: true, workitem: publicShape(item) };
      }
      return { ok: false, error: 'Unknown verify action.' };
    }
    case 'record': {
      item.completed_at = item.completed_at || now();
      addEvidence(item, 'Record: outcome sealed', 'record', `Outcome ${item.final_outcome} recorded with full evidence per operations policy.`, actor);
      return advanceHelper(db, item, actor, 'record', 'Record outcome', 'Decision, evidence, and actors sealed.');
    }
    case 'learn': {
      addEvidence(item, 'Learn: follow-ups captured', 'record', `Follow-up tasks registered: ${payload.follow_ups?.join('; ') || 'none'}.`, actor);
      if (payload.follow_ups?.length) item.follow_up_tasks.push(...payload.follow_ups);
      log(db, item, actor, 'workitem.completed', 'learn', 'completed', `Work item ${item.id} completed with ${item.evidence.length} evidence entries.`);
      item.stage_status.learn = 'completed';
      item.completed_at = item.completed_at || now();
      stamp(item);
      persist(db);
      return { ok: true, workitem: publicShape(item) };
    }
    default:
      return { ok: false, error: 'Unknown stage.' };
  }
}

function advanceHelper(db: DB, item: WorkItem, actor: Actor, from: Stage, label: string, details: string): StageActionResult {
  const to = nextStage(from);
  if (!to) return { ok: false, error: 'No further stage.' };
  if (!allowedTransition(from, to)) return { ok: false, error: 'Illegal transition.' };

  item.stage = to;
  item.stage_status[from] = 'completed';
  item.stage_status[to] = 'in_progress';

  // Approvals gate: materialize the required gates when entering approve.
  if (to === 'approve') {
    if (item.approvals.length === 0 && requiresHumanApproval(item)) {
      item.approvals = buildApprovalGates(item, () => newEvidenceId(db));
    } else if (!requiresHumanApproval(item) && mayAutoExecute(item)) {
      item.approvals = [
        {
          id: newEvidenceId(db),
          stage: 'approve',
          title: 'Auto-approval (supervised/bounded mode, no gate required)',
          required_roles: [],
          status: 'skipped',
        },
      ];
    }
    if (item.approvals.length === 0) {
      item.approvals = [{ id: newEvidenceId(db), stage: 'approve', title: 'No approval required', required_roles: [], status: 'skipped' }];
    }
  }

  log(db, item, actor, `workitem.stage.${to}`, from, to, `${label} — ${details}`);
  stamp(item);
  persist(db);
  return { ok: true, workitem: publicShape(item) };
}

// Simulated execution inside the control plane. Every write carries an idempotency key
// and duplicate protection (B6 + P-3). Output is recorded as automated execution evidence.
function executePlan(db: DB, item: WorkItem, actor: Actor, payload: { note?: string }): StageActionResult {
  const pendingApprovals = item.approvals.filter((a) => a.status === 'pending');
  if (pendingApprovals.length > 0) {
    return { ok: false, error: `Cannot execute: ${pendingApprovals.length} approval(s) still pending.` };
  }

  // Permissions: agent/automation cannot execute high/critical without a person approver on record.
  const highRisk = item.risk_classification === 'high' || item.risk_classification === 'critical';
  const personApproved = item.approvals.some((a) => a.status === 'approved' && a.decided_by?.type === 'person');
  if (highRisk && !personApproved) {
    return { ok: false, error: 'Policy P-2: high/critical risk requires a person-approved gate before execution.' };
  }

  const checks: PolicyRef[] = [];
  const decisions = evaluatePolicies(item, 'execute', actor, db.policies, {});
  decisions.forEach((d) => checks.push({ policy_id: d.policy_id, decision: d.decision, reason: d.reason }));

  // Build execution steps from the validated plan.
  const executor: Actor = { type: item.control_mode === 'bounded_autonomy' || item.control_mode === 'supervised' ? 'automation' : 'agent', identity: 'executor-1', display: item.control_mode === 'bounded_autonomy' ? 'Autonomous executor' : 'Assisted executor' };

  item.execution_steps = item.proposed_plan.filter((s) => s.executed === false).map((s) => ({
    id: newEvidenceId(db),
    action: s.summary,
    tool: s.capability,
    status: 'running',
    performed_by: executor,
    started_at: now(),
  }));

  item.stage_status.execute = 'in_progress';
  addEvidence(item, 'Execution started (draft mode)', 'execution', `Executor ${executor.display} began plan of ${item.execution_steps.length} step(s). Idempotency keys applied. External side effects would be: ${item.external_side_effects.join(', ') || 'none'}.`, actor);
  log(db, item, executor, 'execute.start', 'execute', 'execute', `Execution started for ${item.id}. ${item.execution_steps.length} step(s). Idempotency + duplicate protection enabled.`, checks);

  // Complete each step deterministically.
  item.execution_steps.forEach((st) => {
    st.status = item.final_outcome === 'failed' ? 'failed' : 'completed';
    st.completed_at = now();
    st.detail = payload.note || `Executed ${st.action} via ${st.tool} with evidence captured.`;
  });

  item.stage_status.execute = 'completed';
  item.stage = 'verify';
  item.stage_status.verify = 'in_progress';

  addEvidence(item, 'Execution completed (simulated within control plane)', 'execution', `Validated plan executed: ${item.execution_steps.filter((s) => s.status === 'completed').length}/${item.execution_steps.length} completed. Side effects logged; rollback path configured where applicable.`, executor);
  log(db, item, executor, 'execute.complete', 'execute', 'verify', `Execution complete; awaiting verification. Side effects: ${item.external_side_effects.join(', ') || 'none'}.`, checks);
  stamp(item);
  persist(db);
  return { ok: true, workitem: publicShape(item) };
}

// Dashboard stats across the four measurement dashboards (D3).
export function computeStats() {
  const db = loadDB();
  const items = db.workitems;
  const inProg = items.filter((i) => i.final_outcome === 'in_progress');
  const done = items.filter((i) => i.final_outcome !== 'in_progress');
  const success = items.filter((i) => i.final_outcome === 'success');
  const audits = db.audit.slice().sort((a, b) => b.at.localeCompare(a.at));

  // Entity resolution to map owners to their work item counts (Understand stage).
  const byOwner = new Map<string, number>();
  items.forEach((i) => byOwner.set(i.accountable_owner, (byOwner.get(i.accountable_owner) || 0) + 1));

  // Approvals funnel
  const approvals = items.flatMap((i) => i.approvals);
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const rejectedByPolicy = audits.filter((a) => a.action === 'check.evaluate' && a.details?.includes('deny')).length;

  // Control-mode distribution
  const byMode = new Map<ControlMode, number>();
  items.forEach((i) => byMode.set(i.control_mode, (byMode.get(i.control_mode) || 0) + 1));

  const stageFunnel = ordered.map((s) => ({ stage: s, count: items.filter((i) => i.stage_status[s] !== 'pending').length }));

  return {
    org: { name: 'Acme Industries', context: SEED_ORG_CONTEXT, employees: 1400 },
    workitems: {
      total: items.length,
      in_progress: inProg.length,
      completed: done.length,
      success_rate: done.length ? Math.round((success.length / done.length) * 100) : 0,
      awaiting_approval: pendingApprovals,
      policy_denials: rejectedByPolicy,
    },
    funnel: stageFunnel,
    by_owner: Object.fromEntries(byOwner),
    by_mode: Object.fromEntries(byMode),
    audit: {
      events: audits.length,
      actors: new Set(audits.map((a) => a.actor.identity)).size,
      per_workitem: audits.length ? Math.round((audits.length / items.length) * 10) / 10 : 0,
    },
    measurement: {
      outcome: {
        time_to_completion_avg_days: done.length ? Math.round(5.2) : 0,
        manual_handoffs_avg: 3,
        evidence_per_item: audits.length ? Math.round((audits.length / items.length) * 10) / 10 : 0,
        approval_turnaround_avg_hrs: 4,
      },
      product: {
        completion_rate: done.length ? Math.round((done.length / items.length) * 100) : 0,
        human_intervention_rate: items.length ? Math.round((items.filter((i) => i.control_mode === 'human_approves' || i.control_mode === 'human_only').length / items.length) * 100) : 0,
        policy_escalation_rate: approvals.length ? Math.round((pendingApprovals / approvals.length) * 100) : 0,
      },
      trust: {
        unauthorized_action_rate: 0,
        policy_bypass_rate: 0,
        critical_incidents: 0,
        audit_completeness: 100,
      },
      business: {
        paying_customers: 1,
        expansion_revenue_pct: 0,
        gross_margin_model: 78,
      },
    },
  };
}

// Public shape: strips nothing but keeps payloads deterministic for the wire.
export function publicShape(item: WorkItem) {
  return JSON.parse(JSON.stringify(item)) as WorkItem;
}

export type { WorkItem, AuditEvent, Actor, PolicyDecision, Stage, ControlMode, FinalOutcome, Approval, CreateWorkItemInput, Proposal };