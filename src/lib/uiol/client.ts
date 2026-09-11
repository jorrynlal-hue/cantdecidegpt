// Typed client for the UIOL control-plane API.
import { WorkItem, Stage, ControlMode, FinalOutcome } from '@/lib/uiol/types';
import type { ExecutionMode, DecisionReceipt, CommandCard, CommandBucket, WorkForceAgent, Skill } from '@/lib/uiol/layer';
export type { WorkItem, Stage, ControlMode, FinalOutcome, ExecutionMode, DecisionReceipt, WorkForceAgent, Skill };
export type { CommandCard, CommandBucket };

export interface ActorInput {
  identity?: string;
  display?: string;
  roles?: string[];
}

async function parse<T>(r: Response): Promise<T> {
  const j = await r.json();
  if (!r.ok) throw new Error((j as { error?: string }).error || `HTTP ${r.status}`);
  return j as T;
}

export const api = {
  workitems: async (params?: { stage?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.stage) qs.set('stage', params.stage);
    if (params?.q) qs.set('q', params.q);
    return parse<{ ok: boolean; items: WorkItem[] }>(await fetch(`/api/uiol/workitems${qs.toString() ? '?' + qs : ''}`));
  },
  workitem: async (id: string) =>
    parse<{ ok: boolean; workitem: WorkItem }>(await fetch(`/api/uiol/workitems/${id}`)),
  createWorkitem: async (body: { template_id: string; title: string; objective: string; org_context?: string; related_customer_case?: string; control_mode: ControlMode; execution_mode?: ExecutionMode; requester_id?: string; requester_display?: string }, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem: WorkItem }>(
      await fetch('/api/uiol/workitems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, ...actor }),
      })
    ),
  updateWorkitem: async (id: string, patch: { title?: string; objective?: string; control_mode?: ControlMode; execution_mode?: ExecutionMode; accountable_owner?: string }, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem: WorkItem }>(
      await fetch(`/api/uiol/workitems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, ...actor }),
      })
    ),
  takeover: async (id: string, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem: WorkItem }>(
      await fetch(`/api/uiol/workitems/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'execute', action: 'takeover', ...actor }),
      })
    ),
  giveback: async (id: string, mode?: ExecutionMode, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem: WorkItem }>(
      await fetch(`/api/uiol/workitems/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'execute', action: 'giveback', execution_mode: mode, ...actor }),
      })
    ),
  command: async () => parse<{ ok: boolean; command: { buckets: Record<CommandBucket, CommandCard[]>; total: number } }>(await fetch('/api/uiol/command')),
  workforce: async () => parse<{ ok: boolean; workforce: { agents: Array<WorkForceAgent & { active: number; status: 'busy' | 'ready' }>; skills: Array<Skill & { activeItems: number }> } }>(await fetch('/api/uiol/workforce')),
  teach: async (body: { statement: string; scope?: string; category?: string; project?: string }) =>
    parse<{ stored: string; scope: string; note: string }>(
      await fetch('/api/uiol/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ),
  receipt: async (id: string) => parse<{ ok: boolean; receipt: DecisionReceipt | null }>(await fetch(`/api/uiol/receipt/${id}`)),
  stageAction: async (id: string, stage: Stage, action: string, payload: { note?: string; decision?: 'approved' | 'rejected'; approval_id?: string; follow_ups?: string[]; outcome?: FinalOutcome } = {}, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem?: WorkItem; error?: string; verdict?: string; decisions?: Array<{ policy_id: string; decision: string; reason: string }>; proposal?: unknown }>(
      await fetch(`/api/uiol/workitems/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stage, action, ...actor }),
      })
    ),
  approvals: async (pendingOnly = false) =>
    parse<{ ok: boolean; approvals: Array<{ workitem: WorkItem; approval: { id: string; title: string; required_roles: string[]; status: string; note?: string } }> }>(
      await fetch(`/api/uiol/approvals${pendingOnly ? '?pending=true' : ''}`)
    ),
  actApproval: async (body: { workitem_id: string; approval_id: string; decision: 'approved' | 'rejected'; note?: string }, actor?: ActorInput) =>
    parse<{ ok: boolean; workitem: WorkItem }>(
      await fetch('/api/uiol/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, ...actor }),
      })
    ),
  policies: async () => parse<{ ok: boolean; policies: Array<policiesItem> }>(await fetch('/api/uiol/policies')),
  updatePolicy: async (id: string, enabled: boolean) =>
    parse<{ ok: boolean; policy: policiesItem }>(
      await fetch(`/api/uiol/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
    ),
  evaluatePolicy: async (body: { workitem_id?: string; action?: string; amount?: number }) =>
    parse<{ ok: boolean; verdict: string; decisions: Array<{ policy_id: string; name?: string; decision: string; reason: string }> }>(
      await fetch('/api/uiol/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ),
  audit: async (params?: { workitem_id?: string; limit?: number }) =>
    parse<{ ok: boolean; events: Array<eventItem>; total: number }>(
      await fetch(`/api/uiol/audit${params?.workitem_id ? '?workitem_id=' + params.workitem_id : ''}${params?.limit ? (params.workitem_id ? '&' : '?') + 'limit=' + params.limit : ''}`)
    ),
  stats: async () => parse<{ ok: boolean; stats: statsShape }>(await fetch('/api/uiol/stats')),
  templates: async () => parse<{ ok: boolean; org_context: string; templates: templateShape[]; users: userShape[] }>(await fetch('/api/uiol/templates')),
};

export interface policiesItem {
  id: string;
  name: string;
  description: string;
  scope: string;
  rule: string;
  action_when_denied: string;
  enabled: boolean;
  version: number;
  created_at: string;
}

export interface eventItem {
  id: string;
  workitem_id: string;
  at: string;
  actor: { type: string; identity: string; display: string };
  action: string;
  from?: string;
  to?: string;
  details?: string;
  checks: Array<{ policy_id: string; decision: string; reason?: string }>;
}

export interface statsShape {
  org: { name: string; context: string; employees: number };
  workitems: {
    total: number;
    in_progress: number;
    completed: number;
    success_rate: number;
    awaiting_approval: number;
    policy_denials: number;
  };
  funnel: Array<{ stage: string; count: number }>;
  by_owner: Record<string, number>;
  by_mode: Record<string, number>;
  audit: { events: number; actors: number; per_workitem: number };
  measurement: {
    outcome: { time_to_completion_avg_days: number; manual_handoffs_avg: number; evidence_per_item: number; approval_turnaround_avg_hrs: number };
    product: { completion_rate: number; human_intervention_rate: number; policy_escalation_rate: number };
    trust: { unauthorized_action_rate: number; policy_bypass_rate: number; critical_incidents: number; audit_completeness: number };
    business: { paying_customers: number; expansion_revenue_pct: number; gross_margin_model: number };
  };
}

export interface templateShape {
  id: string;
  name: string;
  category: string;
  description: string;
  risk_class: string;
  required_capabilities: string[];
  applicable_policy_ids: string[];
  default_control_mode: ControlMode;
  plan_shell: Array<{ id: string; summary: string; capability: string; mode: ControlMode; prerequisites: string[]; executed: boolean }>;
  side_effect_hints: string[];
  value_hypothesis: string;
}

export interface userShape {
  id: string;
  name: string;
  email: string;
  roles: string[];
  title?: string;
}

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

export const CURRENT_ACTOR = { identity: 'u-1', display: 'Ava Operations', roles: ['Operations Lead', 'Operations Approver'] };