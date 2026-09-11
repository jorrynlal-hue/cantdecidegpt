// Persistent control-plane store. File-backed so state survives dev-server restarts.
// The audit ledger is append-only by construction: no API ever mutates an audit event.
import fs from 'fs';
import path from 'path';
import {
  WorkItem,
  AuditEvent,
  Policy,
  OrgUser,
  WorkflowTemplate,
} from './types';
import { SEED_USERS, SEED_POLICIES, SEED_TEMPLATES } from './seed';
import { createInitialWorkItem, buildInitialStageStatus, requiresHumanApproval } from './lifecycle';

const DIR = path.join(process.cwd(), '.uiol');
const FILE = path.join(DIR, 'state.json');

export interface DB {
  workitems: WorkItem[];
  audit: AuditEvent[];
  policies: Policy[];
  users: OrgUser[];
  templates: WorkflowTemplate[];
  seq: number;
  initialized_at: string;
}

function freshDB(): DB {
  return {
    workitems: [],
    audit: [],
    policies: SEED_POLICIES.map((p) => ({ ...p })),
    users: SEED_USERS.map((u) => ({ ...u })),
    templates: SEED_TEMPLATES.map((t) => ({ ...t, plan_shell: t.plan_shell.map((s) => ({ ...s })) })),
    seq: 0,
    initialized_at: new Date().toISOString(),
  };
}

// ---- globalThis cache so HMR/dev reloads reuse a single DB instance ----
declare global {
  var __uiol_db__: DB | undefined;
}

function loadFromDisk(): DB | null {
  try {
    if (!fs.existsSync(FILE)) return null;
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw) as DB;
  } catch {
    return null;
  }
}

function seedInitialWorkItems(db: DB): DB {
  const demo = [
    {
      template: db.templates[0], // customer onboarding
      title: 'Onboard: Northwind Analytics (expansion)',
      objective: 'Stand up the Northwind Analytics expansion: issue contract, provision 40 seats, and schedule kickoff.',
      org: 'Acme Industries — Sales/Delivery',
      related: 'CUST-2041',
      requester: db.users[1],
      mode: 'human_approves' as const,
      risk: 'medium' as const,
      advance_to: 'plan' as const,
    },
    {
      template: db.templates[1], // incident
      title: 'INC-88123: Payment API latency spike',
      objective: 'Triage elevated payment API latency (p95 > 4s), identify RCA, and execute a verified fix within SLA.',
      org: 'Acme Industries — Operations',
      requester: db.users[3],
      mode: 'ai_prepares' as const,
      risk: 'high' as const,
      advance_to: 'check' as const,
    },
    {
      template: db.templates[2], // invoice exception
      title: 'INV-5517: Vendor invoice mismatch',
      objective: 'Resolve the invoice line mismatch ($8,240) between PO-3301, goods receipt, and vendor invoice.',
      org: 'Acme Industries — Finance',
      related: 'PO-3301',
      requester: db.users[2],
      mode: 'human_approves' as const,
      risk: 'critical' as const,
      advance_to: 'plan' as const,
    },
    {
      template: db.templates[4], // contractor onboarding
      title: 'Contractor: Jordan Ellis (Data Engineering)',
      objective: 'Onboard contractor Jordan Ellis for the data-platform sprint, scoped access to 2026-12-31.',
      org: 'Acme Industries — People/IT',
      requester: db.users[4],
      mode: 'ai_prepares' as const,
      risk: 'medium' as const,
      advance_to: 'approve' as const,
    },
  ];

  let n = db.seq;
  const evId = () => `ev-${(++n).toString(36)}-${Date.now().toString(36).slice(-4)}`;
  const at = (offsetMin: number) => new Date(Date.now() - offsetMin * 60000).toISOString();

  for (const d of demo) {
    const id = `WI-${(++db.seq).toString().padStart(4, '0')}`;
    const requester = { type: 'person' as const, identity: d.requester.id, display: d.requester.name };

    const status = buildInitialStageStatus('capture');
    const wf: WorkItem = createInitialWorkItem({
      id,
      workflow: d.template.name,
      title: d.title,
      objective: d.objective,
      requester,
      accountable_owner: d.requester.name,
      org_context: d.org,
      risk_classification: d.risk,
      control_mode: d.mode,
      required_capabilities: d.template.required_capabilities,
      external_side_effects: d.template.side_effect_hints,
      expected_outcome: d.template.value_hypothesis,
      proposed_plan: d.template.plan_shell.map((s) => ({ ...s, executed: false })),
      applicable_policies: d.template.applicable_policy_ids.map((pid) => ({ policy_id: pid, decision: 'allow' as const })),
      related_customer_case: d.related,
    });
    wf.related_customer_case = d.related;
    wf.stage_status = status;
    wf.updated_at = at(10);

    // simulate advancing through pre-seeded stages with an operator actor
    const ops = { type: 'person' as const, identity: 'u-1', display: 'Ava Operations' };
    const order = ['capture', 'understand', 'plan', 'check', 'approve', 'execute', 'verify'] as const;
    const target = order.indexOf(d.advance_to);
    for (let i = 0; i <= target && i < order.length; i++) {
      const s = order[i];
      wf.stage_status[s] = 'completed';
      wf.evidence.push({
        id: evId(),
        label: `Stage ${s}: completed by operator`,
        kind: s === 'check' ? 'policy_check' : s === 'plan' ? 'proposal' : 'record',
        content: `Stage ${s} completed with recorded intent and evidence.`,
        recorded_by: ops,
        recorded_at: at(10 - i),
      });
      db.audit.push({
        id: evId(),
        workitem_id: id,
        at: at(10 - i),
        actor: ops,
        action: `workitem.stage.${s}`,
        to: s,
        details: 'Seeded demo progression.',
        checks: [],
      });
      if (s === 'plan') {
        // attach proposal evidence for plan-capable items
        wf.proposed_plan = wf.proposed_plan.map((step) => ({
          ...step,
          mode: wf.control_mode,
          stop_condition: step.executed ? undefined : 'Requires control-plane validation before execution',
        }));
      }
    }
    const cur = target < 0 ? 'capture' : order[Math.min(target, order.length - 1)];
    wf.stage = cur;
    wf.stage_status[cur] = 'in_progress';

    // if we landed at/in passing approve, create the gates so approvers see them
    if (cur === 'approve' && requiresHumanApproval(wf)) {
      wf.approvals = [
        {
          id: evId(),
          stage: 'approve',
          title: `Senior Operator: approve execution plan`,
          required_roles: ['Operations Approver'],
          status: 'pending',
        },
      ];
    }
    if (cur === 'check') {
      // leave a pending check marker visible as evidence
      wf.exceptions = cur === 'check' ? [{ message: 'Policy evaluation in progress — awaiting completion.', raised_at: at(3), resolved: false }] : [];
    }

    db.workitems.push(wf);
  }

  db.seq = n;
  return db;
}

export function loadDB(privateTools?: { skipSeed?: boolean }): DB {
  if (globalThis.__uiol_db__) return globalThis.__uiol_db__;
  let db = loadFromDisk();
  const skip = privateTools?.skipSeed ?? false;
  if (!db || db.workitems.length === 0) {
    db = db ?? freshDB();
    if (!skip) seedInitialWorkItems(db);
    persist(db);
  }
  globalThis.__uiol_db__ = db;
  return db;
}

export function persist(db: DB): void {
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // Non-fatal: state continues to work in-memory for the process lifetime.
  }
}

export function nextId(db: DB, prefix: string): string {
  return `${prefix}-${(++db.seq).toString().padStart(4, '0')}`;
}

export function newEvidenceId(db: DB): string {
  return `ev-${(++db.seq).toString(36)}-${Date.now().toString(36).slice(-4)}`;
}

// Append-only audit push. Callers may never pass existing ids.
export function pushAudit(db: DB, ev: AuditEvent): void {
  db.audit.push({ ...ev, id: ev.id || newEvidenceId(db), checks: ev.checks || [] });
}

export function resetStore(): void {
  globalThis.__uiol_db__ = freshDB();
  persist(globalThis.__uiol_db__);
}