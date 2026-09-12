import { DB, Ctx, Integration, ProviderConfig, Workflow, WorkflowStep, Team } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity } from './core';
import { listProviderKinds, ProviderKind } from '../providers';

// ---------- integrations ----------

export function listIntegrations(db: DB, workspaceId: string, category?: string): Integration[] {
  return db.integrations
    .filter((i) => i.workspaceId === workspaceId && (category === undefined || i.category === category))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getIntegration(db: DB, workspaceId: string, id: string): Integration {
  const i = db.integrations.find((x) => x.id === id && x.workspaceId === workspaceId);
  if (!i) throw Error('NOT_FOUND');
  return i;
}

export function connectIntegration(ctx: Ctx, db: DB, integrationId: string, settings?: Record<string, unknown>): Integration {
  requireRole(ctx, 'manager');
  const i = getIntegration(db, ctx.workspaceId, integrationId);
  // Simulated OAuth-like connect. No external call is made; clearly labeled.
  i.connected = true;
  i.status = 'connected';
  i.settings = { ...i.settings, ...(settings ?? {}) };
  i.connectedAt = now();
  i.updatedAt = now();
  logActivity(ctx, db, { action: 'integration.connect', result: `Connected integration "${i.name}" (simulated handshake — no external call)`, objectType: 'integration', objectId: i.id, objectLabel: i.name });
  notifyIntegration(ctx, db, i, `Connected integration "${i.name}"`);
  persist(db);
  return i;
}

export function disconnectIntegration(ctx: Ctx, db: DB, integrationId: string): Integration {
  requireRole(ctx, 'manager');
  const i = getIntegration(db, ctx.workspaceId, integrationId);
  i.connected = false;
  i.status = 'disconnected';
  i.updatedAt = now();
  logActivity(ctx, db, { action: 'integration.disconnect', result: `Disconnected integration "${i.name}"`, objectType: 'integration', objectId: i.id, objectLabel: i.name });
  persist(db);
  return i;
}

function notifyIntegration(ctx: Ctx, db: DB, i: Integration, title: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require avoids engine/core<->admin cycle
  const { notifyWorkspace } = require('./core') as typeof import('./core');
  notifyWorkspace(ctx, db, { title, kind: 'integration', link: '/integrations' });
}

// Universal connectors: API, OAuth, MCP, webhooks and browser workers all live
// in the same registry entry so any capability becomes a usable tool.
const CONNECTOR_CATEGORY: Record<string, Integration['category']> = {
  api: 'dev',
  mcp: 'dev',
  webhook: 'dev',
  browser: 'external',
  oauth: 'external',
};

export function createIntegration(ctx: Ctx, db: DB, input: {
  name: string;
  kind?: Integration['kind'];
  category?: Integration['category'];
  provider?: string;
  domain?: string;
  endpoint?: string;
  scopes?: string[];
  settings?: Record<string, unknown>;
}): Integration {
  requireRole(ctx, 'manager');
  const kind = (input.kind ?? 'api') as Exclude<Integration['kind'], undefined>;
  const i: Integration = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    category: input.category ?? (CONNECTOR_CATEGORY[kind] ?? 'external'),
    name: nonEmpty(input.name, 'name'),
    key: `${kind}.${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    connected: false,
    status: 'disconnected',
    permissions: input.scopes ?? [],
    settings: input.settings ?? {},
    kind,
    provider: optStr(input.provider),
    domain: optStr(input.domain),
    endpoint: optStr(input.endpoint),
    health: 'unknown',
    updatedAt: now(),
  };
  db.integrations.push(i);
  logActivity(ctx, db, { action: 'integration.create', result: `Added connector "${i.name}" (${kind})`, objectType: 'integration', objectId: i.id, objectLabel: i.name });
  persist(db);
  return i;
}

export function updateIntegration(ctx: Ctx, db: DB, id: string, patch: {
  name?: string;
  kind?: Integration['kind'];
  provider?: string;
  domain?: string;
  endpoint?: string;
  scopes?: string[];
  settings?: Record<string, unknown>;
  status?: Integration['status'];
  health?: Integration['health'];
}): Integration {
  requireRole(ctx, 'manager');
  const i = getIntegration(db, ctx.workspaceId, id);
  if (patch.name !== undefined) i.name = nonEmpty(patch.name, 'name');
  if (patch.kind !== undefined) i.kind = patch.kind;
  if (patch.provider !== undefined) i.provider = optStr(patch.provider);
  if (patch.domain !== undefined) i.domain = optStr(patch.domain);
  if (patch.endpoint !== undefined) i.endpoint = optStr(patch.endpoint);
  if (patch.scopes !== undefined) i.permissions = [...new Set(patch.scopes)];
  if (patch.settings !== undefined) i.settings = { ...i.settings, ...patch.settings };
  if (patch.status !== undefined) i.status = patch.status;
  if (patch.health !== undefined) i.health = patch.health;
  i.updatedAt = now();
  persist(db);
  return i;
}

// Honest connector test: without a real external handshake there is no way to
// verify a live service, so "testing" validates the connector definition is
// complete and labels the result accordingly.
export function testIntegration(ctx: Ctx, db: DB, id: string): Integration {
  requireRole(ctx, 'manager');
  const i = getIntegration(db, ctx.workspaceId, id);
  const isBrowse = i.kind === 'browser';
  const hasEndpoint = i.kind !== 'api' || Boolean(i.endpoint);
  const hasDomain = !isBrowse || Boolean(i.domain);
  const healthy = isBrowse ? hasDomain : hasEndpoint;
  i.status = healthy ? 'connected' : 'error';
  i.health = healthy ? 'ok' : 'down';
  i.error = healthy ? undefined : 'Missing required configuration (endpoint or allowed domain).';
  i.lastTestedAt = now();
  i.updatedAt = now();
  logActivity(ctx, db, { action: 'integration.test', result: `Tested connector "${i.name}": ${i.status}${i.error ? ` (${i.error})` : ''}`, objectType: 'integration', objectId: i.id, objectLabel: i.name });
  persist(db);
  return i;
}

// ---------- provider configs ----------

export interface ProviderCatalog {
  kind: ProviderKind;
  asOf: string;
}

export function listProviderConfigs(db: DB, workspaceId: string): ProviderConfig[] {
  return listProviderKinds().map((kind) => {
    const cfg = db.providerConfigs.find((p) => p.workspaceId === workspaceId && p.kind === kind);
    return cfg ?? { id: `prv-${kind}`, workspaceId, kind, provider: 'baseline', enabled: true, settings: {} };
  });
}

export function updateProviderConfig(ctx: Ctx, db: DB, kind: ProviderKind, patch: { provider?: string; enabled?: boolean; settings?: Record<string, unknown> }): ProviderConfig {
  requireRole(ctx, 'manager');
  let cfg = db.providerConfigs.find((p) => p.workspaceId === ctx.workspaceId && p.kind === kind);
  const provider = optStr(patch.provider) ?? (cfg?.provider ?? 'baseline');
  if (!cfg) {
    cfg = { id: uid(), workspaceId: ctx.workspaceId, kind, provider, enabled: true, settings: {} };
    db.providerConfigs.push(cfg);
  }
  if (patch.provider !== undefined) cfg.provider = nonEmpty(patch.provider, 'provider').toLowerCase();
  if (patch.enabled !== undefined) cfg.enabled = !!patch.enabled;
  if (patch.settings !== undefined) cfg.settings = { ...cfg.settings, ...patch.settings };
  persist(db);
  logActivity(ctx, db, { action: 'provider.update', result: `Provider for ${kind} set to "${cfg.provider}" (${cfg.enabled ? 'enabled' : 'disabled'})`, objectType: 'provider', objectId: cfg.id });
  return cfg;
}

// ---------- workflows ----------

export function listWorkflows(db: DB, workspaceId: string, q?: string): Workflow[] {
  return listRows<Workflow>(db.workflows, {
    workspaceId,
    q,
    searchFields: ['name', 'description'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });
}

export function getWorkflow(db: DB, workspaceId: string, workflowId: string): Workflow {
  const w = db.workflows.find((x) => x.id === workflowId && x.workspaceId === workspaceId);
  if (!w) throw Error('NOT_FOUND');
  return w;
}

const TRIGGER_TYPES = ['new_task', 'completed_task', 'new_customer', 'new_lead', 'new_document', 'scheduled_time', 'manual', 'webhook'];
const ACTION_KINDS = ['condition', 'delay', 'action', 'result'];

export interface WorkflowInput {
  name: string;
  description?: string;
  trigger: { type: string; filter?: Record<string, string>; schedule?: string };
  steps: { kind?: string; action?: string; params?: Record<string, unknown>; condition?: WorkflowStep['condition']; delaySec?: number; approved?: boolean }[];
  enabled?: boolean;
}

function sanitizeTrigger(type: string): Workflow['trigger'] {
  if (TRIGGER_TYPES.includes(type)) {
    return { type: type as Workflow['trigger']['type'] };
  }
  throw Error('INVALID_TRIGGER');
}

function sanitizeSteps(steps: WorkflowInput['steps']): WorkflowStep[] {
  return steps.map((s) => {
    const kind = (ACTION_KINDS.includes(s.kind ?? '') ? s.kind : s.action ? 'action' : s.delaySec ? 'delay' : s.condition ? 'condition' : 'action') as WorkflowStep['kind'];
    if (kind === 'action' && !s.action) throw Error('STEP_MISSING_ACTION');
    if (kind === 'delay' && (s.delaySec ?? 0) <= 0) throw Error('STEP_INVALID_DELAY');
    return {
      id: uid(),
      kind,
      action: kind === 'action' ? s.action : undefined,
      params: s.params ?? {},
      condition: s.condition,
      delaySec: kind === 'delay' ? num(s.delaySec, 30) : undefined,
      approved: kind === 'action' ? !!s.approved : undefined,
    };
  });
}

export function createWorkflow(ctx: Ctx, db: DB, input: WorkflowInput): Workflow {
  requireRole(ctx, 'manager');
  const trigger = sanitizeTrigger(input.trigger.type);
  if (input.trigger.filter) trigger.filter = input.trigger.filter;
  if (input.trigger.schedule) trigger.schedule = optStr(input.trigger.schedule);
  const w: Workflow = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    description: optStr(input.description),
    enabled: input.enabled === undefined ? true : !!input.enabled,
    trigger,
    steps: sanitizeSteps(input.steps ?? []),
    createdBy: ctx.user.id,
    createdAt: now(),
    updatedAt: now(),
  };
  db.workflows.push(w);
  logActivity(ctx, db, { action: 'workflow.create', result: `Created automation "${w.name}"`, objectType: 'workflow', objectId: w.id, objectLabel: w.name });
  persist(db);
  return w;
}

export function updateWorkflow(ctx: Ctx, db: DB, workflowId: string, patch: Partial<WorkflowInput>): Workflow {
  requireRole(ctx, 'manager');
  const w = getWorkflow(db, ctx.workspaceId, workflowId);
  if (patch.name !== undefined) w.name = nonEmpty(patch.name, 'name');
  if (patch.description !== undefined) w.description = optStr(patch.description);
  if (patch.trigger !== undefined) {
    const t = sanitizeTrigger(patch.trigger.type);
    if (patch.trigger.filter) t.filter = patch.trigger.filter;
    if (patch.trigger.schedule) t.schedule = optStr(patch.trigger.schedule);
    w.trigger = t;
  }
  if (patch.steps !== undefined) w.steps = sanitizeSteps(patch.steps);
  if (patch.enabled !== undefined) w.enabled = !!patch.enabled;
  w.updatedAt = now();
  persist(db);
  return w;
}

export function setWorkflowEnabled(ctx: Ctx, db: DB, workflowId: string, enabled: boolean): Workflow {
  requireRole(ctx, 'manager');
  const w = getWorkflow(db, ctx.workspaceId, workflowId);
  w.enabled = enabled;
  w.updatedAt = now();
  persist(db);
  return w;
}

export function deleteWorkflow(ctx: Ctx, db: DB, workflowId: string): void {
  requireRole(ctx, 'manager');
  const w = getWorkflow(db, ctx.workspaceId, workflowId);
  db.workflows = db.workflows.filter((x) => x.id !== workflowId);
  logActivity(ctx, db, { action: 'workflow.delete', result: `Deleted automation "${w.name}"`, objectType: 'workflow', objectId: workflowId, objectLabel: w.name });
  persist(db);
}

// ---------- teams ----------

export function listTeams(db: DB, workspaceId: string): Team[] {
  return db.teams.filter((t) => t.workspaceId === workspaceId).sort((a, b) => a.name.localeCompare(b.name));
}

export function createTeam(ctx: Ctx, db: DB, input: { name: string; memberIds?: string[] }): Team {
  requireRole(ctx, 'manager');
  const t: Team = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    memberIds: [...new Set(input.memberIds ?? [])],
    createdAt: now(),
  };
  db.teams.push(t);
  persist(db);
  return t;
}

export function updateTeam(ctx: Ctx, db: DB, teamId: string, patch: { name?: string; memberIds?: string[] }): Team {
  requireRole(ctx, 'manager');
  const t = db.teams.find((x) => x.id === teamId && x.workspaceId === ctx.workspaceId);
  if (!t) throw Error('NOT_FOUND');
  if (patch.name !== undefined) t.name = nonEmpty(patch.name, 'name');
  if (patch.memberIds !== undefined) t.memberIds = [...new Set(patch.memberIds)];
  persist(db);
  return t;
}

export function deleteTeam(ctx: Ctx, db: DB, teamId: string): void {
  requireRole(ctx, 'manager');
  db.teams = db.teams.filter((t) => t.id !== teamId);
  persist(db);
}
