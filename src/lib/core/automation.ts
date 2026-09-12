import { DB, Ctx, Execution, Workflow } from './types';
import { now, uid, persist } from './db';
import { onEvent } from './events';
import { getAction } from './actions';
import { requestApproval } from './engine/misc';
import { notify } from './engine/core';

// The automation engine registers itself as an event handler. Trigger events
// (new_task, completed_task, new_customer, new_lead, new_document) start
// executions; delays and approval steps park executions and are resumed by
// sweep() (called on load and by the scheduler) or by approval decisions.

export function ctxForExecution(db: DB, exec: Execution): Ctx | null {
  const user = db.users.find((u) => u.id === exec.createdBy);
  if (!user) return null;
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, workspaceId: exec.workspaceId, actorSource: 'workflow', actorLabel: `Automation ${exec.workflowId.slice(0, 8)}` };
}

function filterMatches(filter: Record<string, string> | undefined, payload: Record<string, unknown>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => String(payload[k] ?? '') === String(v));
}

function evalCondition(condition: { field: string; op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'; value: string } | undefined, payload: Record<string, unknown>): boolean {
  if (!condition) return true;
  const actual = payload[condition.field];
  const a = String(actual ?? '');
  const numA = Number(actual);
  const numB = Number(condition.value);
  switch (condition.op) {
    case 'eq': return a === condition.value;
    case 'neq': return a !== condition.value;
    case 'gt': return Number.isFinite(numA) && Number.isFinite(numB) && numA > numB;
    case 'lt': return Number.isFinite(numA) && Number.isFinite(numB) && numA < numB;
    case 'contains': return a.includes(condition.value);
    default: return true;
  }
}

// Replace {{field}} tokens in strings/numbers with payload values.
function template(value: unknown, payload: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{([\w.-]+)\}\}/g, (m, key: string) => {
      const v = payload[key];
      return v === undefined || v === null ? m : String(v);
    });
  }
  return value;
}

export function createExecution(ctx: Ctx, db: DB, wf: Workflow, trigger: string, payload: Record<string, unknown>): Execution {
  const exec: Execution = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    workflowId: wf.id,
    trigger,
    payload,
    status: 'queued',
    startedAt: now(),
    stepIndex: 0,
    results: [],
    createdBy: ctx.user.id,
  };
  db.executions.push(exec);
  persist(db);
  return exec;
}

function advance(ctx: Ctx, db: DB, exec: Execution, wf: Workflow): void {
  while (exec.stepIndex < wf.steps.length) {
    const step = wf.steps[exec.stepIndex];
    exec.stepIndex += 1;
    if (step.kind === 'condition') {
      const ok = evalCondition(step.condition, exec.payload);
      exec.results.push({ stepId: step.id, action: 'condition', output: ok ? 'Condition met' : 'Condition not met', at: now() });
      if (!ok) {
        exec.status = 'completed';
        exec.endedAt = now();
        persist(db);
        return;
      }
      continue;
    }
    if (step.kind === 'result') {
      exec.results.push({ stepId: step.id, action: 'result', output: String(step.params?.output ?? ''), at: now() });
      continue;
    }
    if (step.kind === 'delay') {
      const resumeAt = new Date(Date.now() + (step.delaySec ?? 30) * 1000).toISOString();
      exec.results.push({ stepId: step.id, action: 'delay', output: `Waiting ${step.delaySec}s`, at: now() });
      exec.status = 'waiting';
      exec.resumeAt = resumeAt;
      persist(db);
      return;
    }
    if (step.kind === 'action' && step.action) {
      if (step.approved && exec.approvedStepId !== step.id) {
        const approval = requestApproval(ctx, db, {
          title: `Approve "${step.action}"`,
          detail: `Automation "${wf.name}" wants to run step "${step.action}" on ${wf.name}.`,
          kind: 'automation',
          payload: { workflowId: wf.id, executionId: exec.id, stepId: step.id },
          executionId: exec.id,
        });
        exec.results.push({ stepId: step.id, action: step.action, output: 'Waiting for approval', at: now() });
        exec.status = 'waiting';
        exec.pendingApprovalId = approval.id;
        persist(db);
        return;
      }
      const action = getAction(step.action);
      if (!action) {
        exec.status = 'failed';
        exec.endedAt = now();
        exec.results.push({ stepId: step.id, action: step.action, error: `Unknown action "${step.action}"`, at: now() });
        persist(db);
        return;
      }
      const params: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(step.params ?? {})) {
        params[k] = template(v, exec.payload);
      }
      try {
        const result = action.run(ctx, db, params);
        if (!result.ok) {
          exec.status = 'failed';
          exec.endedAt = now();
          exec.results.push({ stepId: step.id, action: step.action, error: result.summary, at: now() });
          persist(db);
          return;
        }
        exec.results.push({ stepId: step.id, action: step.action, output: result.summary, at: now() });
      } catch (err) {
        exec.status = 'failed';
        exec.endedAt = now();
        exec.results.push({ stepId: step.id, action: step.action, error: String(err), at: now() });
        persist(db);
        return;
      }
      continue;
    }
  }
  exec.status = 'completed';
  exec.endedAt = now();
  persist(db);
}

export function startExecution(ctx: Ctx, db: DB, wf: Workflow, trigger: string, payload: Record<string, unknown>): Execution {
  const exec = createExecution(ctx, db, wf, trigger, payload);
  exec.status = 'running';
  persist(db);
  advance(ctx, db, exec, wf);
  return exec;
}

export function runWorkflow(ctx: Ctx, db: DB, workflowId: string, payload: Record<string, unknown> = {}, dryRun = false): Execution {
  const wf = db.workflows.find((w) => w.id === workflowId && w.workspaceId === ctx.workspaceId);
  if (!wf) throw Error('NOT_FOUND');
  if (dryRun) return startDryRun(ctx, db, wf, payload);
  return startExecution(ctx, db, wf, 'manual', payload);
}

export function verifyExecution(db: DB, workspaceId: string, executionId: string): Execution {
  const exec = db.executions.find((e) => e.id === executionId && e.workspaceId === workspaceId);
  if (!exec) throw Error('NOT_FOUND');
  exec.verified = true;
  persist(db);
  return exec;
}

// -- dry run: simulate every step but never produce side effects ------------

function startDryRun(ctx: Ctx, db: DB, wf: Workflow, payload: Record<string, unknown>): Execution {
  const exec: Execution = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    workflowId: wf.id,
    trigger: 'manual',
    payload,
    status: 'running',
    startedAt: now(),
    stepIndex: 0,
    results: [],
    createdBy: ctx.user.id,
    dryRun: true,
  };
  db.executions.push(exec);
  persist(db);
  advanceDryRun(ctx, db, exec, wf);
  return exec;
}

function advanceDryRun(ctx: Ctx, db: DB, exec: Execution, wf: Workflow): void {
  while (exec.stepIndex < wf.steps.length) {
    const step = wf.steps[exec.stepIndex];
    exec.stepIndex += 1;
    if (step.kind === 'condition') {
      const ok = evalCondition(step.condition, exec.payload);
      exec.results.push({ stepId: step.id, action: 'condition', output: ok ? 'Condition met' : 'Condition not met', at: now() });
      if (!ok) break;
      continue;
    }
    if (step.kind === 'result') {
      exec.results.push({ stepId: step.id, action: 'result', output: String(step.params?.output ?? ''), at: now() });
      continue;
    }
    if (step.kind === 'delay') {
      exec.results.push({ stepId: step.id, action: 'delay', output: `[dry-run] Would wait ${step.delaySec}s`, at: now() });
      continue;
    }
    if (step.kind === 'action' && step.action) {
      const note = step.approved ? ' [requires approval — would pause for human sign-off]' : '';
      exec.results.push({
        stepId: step.id,
        action: step.action,
        output: `[dry-run] Would run "${step.action}"${note} with no side effects`,
        at: now(),
      });
      continue;
    }
  }
  exec.status = 'completed';
  exec.endedAt = now();
  persist(db);
}

export function cancelExecution(ctx: Ctx, db: DB, executionId: string): Execution {
  const exec = db.executions.find((e) => e.id === executionId && e.workspaceId === ctx.workspaceId);
  if (!exec) throw Error('NOT_FOUND');
  if (exec.status === 'completed' || exec.status === 'failed') throw Error('ALREADY_FINISHED');
  exec.status = 'cancelled';
  exec.endedAt = now();
  persist(db);
  return exec;
}

export function listExecutions(db: DB, workspaceId: string, limit = 60): Execution[] {
  return db.executions
    .filter((e) => e.workspaceId === workspaceId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function getExecution(db: DB, workspaceId: string, executionId: string): Execution {
  const exec = db.executions.find((e) => e.id === executionId && e.workspaceId === workspaceId);
  if (!exec) throw Error('NOT_FOUND');
  return exec;
}

// Called on load and by the scheduler: resume delayed executions and honor
// scheduled_time triggers.
export function sweep(db: DB): void {
  const nowIso = now();
  for (const exec of db.executions) {
    if (exec.status !== 'waiting') continue;
    if (exec.pendingApprovalId) continue; // resumes via approval decision
    if (exec.resumeAt && exec.resumeAt <= nowIso) {
      const wf = db.workflows.find((w) => w.id === exec.workflowId);
      const ctx = ctxForExecution(db, exec);
      if (wf && ctx) {
        exec.resumeAt = undefined;
        exec.status = 'running';
        persist(db);
        advance(ctx, db, exec, wf);
      }
    }
  }
  // scheduled_time triggers
  const tax = nowIso;
  for (const wf of db.workflows) {
    if (!wf.enabled || wf.trigger.type !== 'scheduled_time') continue;
    if (!wf.trigger.schedule) continue;
    if (scheduleDue(wf.trigger.schedule, tax, db)) {
      const creator = db.users.find((u) => u.id === wf.createdBy);
      if (!creator) continue;
      const ctx: Ctx = {
        user: { id: creator.id, email: creator.email, name: creator.name, role: creator.role },
        workspaceId: wf.workspaceId,
        actorSource: 'workflow',
        actorLabel: 'Scheduler',
      };
      startExecution(ctx, db, wf, 'scheduled_time', { at: tax });
      notify({ ...ctx, user: ctx.user } as Ctx, db, creator.id, {
        title: `Scheduled automation "${wf.name}" ran`,
        body: tax,
        kind: 'workflow',
        link: '/automation/executions',
      });
    }
  }
}

function scheduleDue(schedule: string, nowIso: string, db: DB): boolean {
  const d = new Date(nowIso);
  const [when, time] = schedule.split(' ').filter(Boolean);
  if (when === 'hourly') {
    return d.getMinutes() < 1;
  }
  if (time) {
    const [hh, mm] = time.split(':').map(Number);
    if (!Number.isFinite(hh)) return false;
    if (d.getHours() !== (hh ?? 0) || d.getMinutes() !== (mm ?? 0)) return false;
    if (when === 'daily') return true;
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return weekdays.indexOf((when ?? '').toLowerCase().slice(0, 3)) === d.getDay();
  }
  return false;
}

// ---- event handling ----

export function handleEvent(ctx: Ctx, db: DB, type: string, payload: Record<string, unknown>): void {
  if (ctx.actorSource === 'workflow') return; // avoid automation loops
  if (!['new_task', 'completed_task', 'new_customer', 'new_lead', 'new_document'].includes(type)) return;
  const candidates = db.workflows.filter((w) => w.workspaceId === ctx.workspaceId && w.enabled && w.trigger.type === type);
  for (const wf of candidates) {
    if (!filterMatches(wf.trigger.filter, payload)) continue;
    startExecution(ctx, db, wf, type, payload);
  }
}

// ---- approval decisions resume executions ----

onEvent((ctx, db, type, payload) => {
  if (type !== 'approval_decided') return;
  const executionId = String(payload.executionId ?? '');
  const exec = db.executions.find((e) => e.id === executionId && e.workspaceId === ctx.workspaceId);
  if (!exec || exec.status !== 'waiting' || !exec.pendingApprovalId) return;
  const approval = db.approvals.find((a) => a.id === exec.pendingApprovalId);
  if (!approval) return;
  exec.pendingApprovalId = undefined;
  if (approval.status === 'rejected') {
    exec.status = 'cancelled';
    exec.endedAt = now();
    exec.results.push({ action: 'approval', output: 'Approval rejected — execution cancelled', at: now() });
    persist(db);
    return;
  }
  exec.status = 'running';
  const nextStep = exec.stepIndex > 0 ? db.workflows.find((w) => w.id === exec.workflowId)?.steps[exec.stepIndex - 1] : undefined;
  if (nextStep && nextStep.kind === 'action' && nextStep.approved) {
    exec.stepIndex -= 1;
    exec.approvedStepId = nextStep.id;
  }
  persist(db);
  const ctx2 = ctxForExecution(db, exec);
  const wf = db.workflows.find((w) => w.id === exec.workflowId);
  if (ctx2 && wf) advance(ctx2, db, exec, wf);
});