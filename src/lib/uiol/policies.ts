// Policy & Permissions layer (Blueprint layer 3, B5). Declarative, explainable, logged.
import { Policy, PolicyDecision, WorkItem, Actor } from './types';

// Guard rails: the control plane never lets a high-impact action pass silently.
export function evaluatePolicies(
  item: WorkItem,
  action: string,
  actor: Actor,
  policies: Policy[],
  extra: { amount?: number } = {}
): PolicyDecision[] {
  const decisions: PolicyDecision[] = [];
  const active = policies.filter((p) => p.enabled);

  for (const p of active) {
    decisions.push(evaluateOne(item, action, actor, p, extra));
  }

  // Aggregate: exclude non-triggered policies for brevity on the wire.
  return decisions.filter((d) => d.decision !== 'allow');
}

export function evaluateOne(
  item: WorkItem,
  action: string,
  actor: Actor,
  p: Policy,
  extra: { amount?: number } = {}
): PolicyDecision {
  const a = action.toLowerCase();
  const wf = item.workflow.toLowerCase();
  const risk = item.risk_classification;

  switch (p.id) {
    case 'P-1': {
      // External commitment (purchase/contract/invoice) requires Finance Approver when amount > threshold
      const amount = extra.amount || 0;
      const isCommitment =
        wf.includes('purchase') || wf.includes('invoice') || wf.includes('contract') ||
        a.includes('pay') || a.includes('commit') || a.includes('po_') || a.includes('payment');
      if (isCommitment && amount > 5000) {
        return fail(p, `External commitment detected with amount $${amount} > $5,000 threshold. Requires Finance Approver gate.`);
      }
      if (isCommitment && action !== 'execute' && !a.includes('approve')) {
        return fail(p, `Commitment-type action "${action}" must pass an approval gate before execution.`);
      }
      return allow(p);
    }
    case 'P-2': {
      // High/critical risk items require human approval before execution
      if ((risk === 'high' || risk === 'critical') && a.includes('execute') && actor.type !== 'person') {
        return fail(p, `Risk class "${risk}" requires a person to approve execution; actor was ${actor.type}.`);
      }
      if ((risk === 'high' || risk === 'critical') && a.includes('execute') && actor.type === 'person') {
        return escalate(p, `Executing high-risk item as a person. Approver confirmation recommended.`);
      }
      return allow(p);
    }
    case 'P-3': {
      // Write operations require idempotency + retry + duplicate protection
      if ((a.includes('write') || a.includes('insert') || a.includes('update') || a.includes('execute')) && item.control_mode === 'bounded_autonomy') {
        if (!a.includes('idempotent')) {
          return escalate(p, `Write during bounded autonomy flagged. Requiring idempotency key + duplicate protection before proceed.`);
        }
      }
      return allow(p);
    }
    case 'P-4': {
      // Every AI output is an untrusted proposal until validated by the control plane
      if (a.includes('proposal') && actor.type === 'agent') {
        return escalate(p, `Model proposal recorded as untrusted evidence. Execution requires control-plane validation.`);
      }
      if (a.includes('execute') && actor.type === 'agent') {
        return fail(p, `Agent output must never directly execute. Produce a proposal first (B6 separation rule).`);
      }
      return allow(p);
    }
    case 'P-5': {
      // Sensitive data access is role-filtered
      const sensitive =
        a.includes('read:finance') || a.includes('read:hr') || a.includes('read:pii') || a.includes('export');
      if (sensitive && !(actor.roles || []).some((r) => r.includes('Auditor') || r.includes('Admin') || r.includes('Owner'))) {
        return fail(p, `Action "${action}" touches sensitive data and requester lacks an Auditing/Admin role.`);
      }
      return allow(p);
    }
    case 'P-6': {
      // Rollback strategy required before irreversible side effects
      if (item.external_side_effects.length > 0 && a.includes('execute')) {
        const irreversible = item.external_side_effects.some((e) => /pay|send|post|delete|sign|commit/i.test(e));
        if (irreversible && !item.exceptions.some((x) => x.message.includes('rollback'))) {
          return escalate(p, `Irreversible side effect in scope without documented rollback/compensation plan.`);
        }
      }
      return allow(p);
    }
    default:
      return allow(p);
  }
}

function allow(p: Policy): PolicyDecision {
  return { policy_id: p.id, name: p.name, decision: 'allow', reason: 'No restriction triggered.' };
}

function fail(p: Policy, reason: string): PolicyDecision {
  return { policy_id: p.id, name: p.name, decision: 'deny', reason };
}

function escalate(p: Policy, reason: string): PolicyDecision {
  return { policy_id: p.id, name: p.name, decision: 'escalate', reason };
}

export function worstDecision(decisions: PolicyDecision[]): 'deny' | 'escalate' | 'allow' {
  if (decisions.some((d) => d.decision === 'deny')) return 'deny';
  if (decisions.some((d) => d.decision === 'escalate')) return 'escalate';
  return 'allow';
}