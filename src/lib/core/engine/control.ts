// Control Center engine: Credential Vault + Tool Registry.
// Both are workspace-scoped. Secrets are never stored — only masked hints.
import { DB, Ctx, Credential, Tool } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, nonEmpty, optStr } from './core';

// ---------- credential vault ----------

export function listCredentials(db: DB, workspaceId: string): Credential[] {
  return db.credentials
    .filter((c) => c.workspaceId === workspaceId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCredential(db: DB, workspaceId: string, id: string): Credential {
  const c = db.credentials.find((x) => x.id === id && x.workspaceId === workspaceId);
  if (!c) throw Error('NOT_FOUND');
  return c;
}

// "secret" is received from the client but never stored; only a masked hint is kept.
// Real deployments would encrypt and store the secret server-side and reference it
// by id (credentialsRef) — the vault keeps that contract visible.
export function createCredential(ctx: Ctx, db: DB, input: {
  name: string;
  kind: Credential['kind'];
  provider?: string;
  secret?: string;
  scopes?: string[];
  agentIds?: string[];
  expiresAt?: string;
}): Credential {
  requireRole(ctx, 'manager');
  const raw = optStr(input.secret);
  const c: Credential = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    kind: input.kind,
    provider: input.provider ?? input.kind,
    masked: raw ? `•••••${raw.slice(-4)}` : '•••••',
    scopes: [...new Set(input.scopes ?? [])],
    agentIds: [...new Set(input.agentIds ?? [])],
    status: 'active',
    expiresAt: optStr(input.expiresAt),
    createdAt: now(),
    updatedAt: now(),
  };
  db.credentials.push(c);
  persist(db);
  return c;
}

export function updateCredential(ctx: Ctx, db: DB, id: string, patch: {
  name?: string;
  kind?: Credential['kind'];
  provider?: string;
  scopes?: string[];
  agentIds?: string[];
  status?: Credential['status'];
  expiresAt?: string;
}): Credential {
  requireRole(ctx, 'manager');
  const c = getCredential(db, ctx.workspaceId, id);
  if (patch.name !== undefined) c.name = nonEmpty(patch.name, 'name');
  if (patch.kind !== undefined) c.kind = patch.kind;
  if (patch.provider !== undefined) c.provider = patch.provider;
  if (patch.scopes !== undefined) c.scopes = [...new Set(patch.scopes)];
  if (patch.agentIds !== undefined) c.agentIds = [...new Set(patch.agentIds)];
  if (patch.status !== undefined) c.status = patch.status;
  if (patch.expiresAt !== undefined) c.expiresAt = optStr(patch.expiresAt);
  c.updatedAt = now();
  persist(db);
  return c;
}

export function deleteCredential(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'manager');
  db.credentials = db.credentials.filter((c) => !(c.id === id && c.workspaceId === ctx.workspaceId));
  persist(db);
}

// ---------- tool registry ----------

const TOOL_SEED: Array<Omit<Tool, 'id' | 'workspaceId' | 'usageCount' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Task Creator', capability: 'Work planning', description: 'Create a task with title, priority, status, assignee and due date.', inputs: ['title', 'priority', 'status', 'assigneeId', 'dueDate'], permission: 'create:tasks', auth: 'session', risk: 'low', cost: '$0', availability: 'all', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Email Sender', capability: 'Communication', description: 'Send an email (or schedule it) through the connected email relay.', inputs: ['to', 'subject', 'body', 'scheduledAt'], permission: 'send:emails', auth: 'integration (email)', risk: 'medium', cost: 'per send', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Content Generator', capability: 'AI generation', description: 'Generate content, copy, or creative drafts through the configured provider.', inputs: ['kind', 'prompt', 'tone'], permission: 'generate:content', auth: 'provider (api key)', risk: 'low', cost: 'per call', availability: 'all', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Customer Finder', capability: 'Customer acquisition', description: 'Search and qualify leads from the customer database and connected CRMs.', inputs: ['query', 'tag'], permission: 'read:customers', auth: 'session', risk: 'low', cost: '$0', availability: 'all', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Invoice Creator', capability: 'Finance', description: 'Create and send invoices with lines, tax and discount.', inputs: ['customerId', 'lines', 'taxPct', 'dueDate'], permission: 'create:invoices', auth: 'session', risk: 'medium', cost: '$0', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Social Publisher', capability: 'Marketing', description: 'Draft or publish posts to connected social platforms.', inputs: ['platform', 'text', 'mediaIds', 'scheduledAt'], permission: 'publish:posts', auth: 'integration (social)', risk: 'medium', cost: '$0', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Browser Navigator', capability: 'Web interaction', description: 'A browser worker opens sites, clicks, types, fills forms and reads pages on allowed domains.', inputs: ['url', 'action', 'domains'], permission: 'browser:navigate', auth: 'browser session', risk: 'high', cost: 'time-based', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'MCP Tool Invoker', capability: 'External tools', description: 'Call tools exposed by a connected MCP server (discoverable by name + input schema).', inputs: ['server', 'tool', 'input'], permission: 'mcp:invoke', auth: 'mcp server', risk: 'medium', cost: 'per call', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Webhook Dispatcher', capability: 'Automation', description: 'Fire events to connected webhook endpoints for external systems.', inputs: ['url', 'payload'], permission: 'webhook:dispatch', auth: 'webhook secret', risk: 'medium', cost: '$0', availability: 'approval', owner: 'platform', agentAccess: true, humanAccess: true },
  { name: 'Analytics Reader', capability: 'Analytics', description: 'Pull performance and financial analytics across the workspace.', inputs: ['scope', 'from', 'to'], permission: 'read:analytics', auth: 'session', risk: 'low', cost: '$0', availability: 'all', owner: 'platform', agentAccess: true, humanAccess: true },
];

// The registry is seeded lazily per workspace from the universal built-in tools.
// This keeps the registry authoritative while not duplicating static state.
function seedTools(db: DB, ws: string): Tool[] {
  const existing = db.tools.filter((t) => t.workspaceId === ws);
  if (existing.length > 0) return existing;
  const t = now();
  const seeded: Tool[] = TOOL_SEED.map((s) => ({ ...s, id: uid(), workspaceId: ws, usageCount: 0, createdAt: t, updatedAt: t }));
  db.tools.push(...seeded);
  persist(db);
  return db.tools.filter((x) => x.workspaceId === ws);
}

export function listTools(db: DB, workspaceId: string, q?: string): Tool[] {
  const rows = seedTools(db, workspaceId);
  const needle = (q ?? '').trim().toLowerCase();
  const filtered = needle
    ? rows.filter((t) => t.name.toLowerCase().includes(needle) || t.capability.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle))
    : rows;
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

export function getTool(db: DB, workspaceId: string, id: string): Tool {
  void seedTools(db, workspaceId);
  const t = db.tools.find((x) => x.id === id && x.workspaceId === workspaceId);
  if (!t) throw Error('NOT_FOUND');
  return t;
}

export function createTool(ctx: Ctx, db: DB, input: {
  name: string;
  description?: string;
  capability?: string;
  inputs?: string[];
  permission?: string;
  auth?: string;
  risk?: Tool['risk'];
  cost?: string;
  availability?: string;
  owner?: string;
  agentAccess?: boolean;
  humanAccess?: boolean;
}): Tool {
  requireRole(ctx, 'manager');
  void seedTools(db, ctx.workspaceId);
  const t: Tool = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    description: optStr(input.description) ?? '',
    capability: optStr(input.capability) || 'Custom',
    inputs: input.inputs ?? [],
    permission: optStr(input.permission) ?? '',
    auth: optStr(input.auth) || 'session',
    risk: input.risk ?? 'low',
    cost: optStr(input.cost) || '$0',
    availability: optStr(input.availability) || 'all',
    owner: optStr(input.owner) ?? '',
    agentAccess: input.agentAccess ?? false,
    humanAccess: input.humanAccess ?? true,
    usageCount: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  db.tools.push(t);
  persist(db);
  return t;
}

export function updateTool(ctx: Ctx, db: DB, id: string, patch: {
  name?: string;
  description?: string;
  capability?: string;
  inputs?: string[];
  permission?: string;
  auth?: string;
  risk?: Tool['risk'];
  cost?: string;
  availability?: string;
  owner?: string;
  agentAccess?: boolean;
  humanAccess?: boolean;
}): Tool {
  requireRole(ctx, 'manager');
  const t = getTool(db, ctx.workspaceId, id);
  if (patch.name !== undefined) t.name = nonEmpty(patch.name, 'name');
  if (patch.description !== undefined) t.description = optStr(patch.description) ?? '';
  if (patch.capability !== undefined) t.capability = patch.capability;
  if (patch.inputs !== undefined) t.inputs = patch.inputs;
  if (patch.permission !== undefined) t.permission = optStr(patch.permission) ?? '';
  if (patch.auth !== undefined) t.auth = patch.auth;
  if (patch.risk !== undefined) t.risk = patch.risk;
  if (patch.cost !== undefined) t.cost = patch.cost;
  if (patch.availability !== undefined) t.availability = patch.availability;
  if (patch.owner !== undefined) t.owner = optStr(patch.owner) ?? '';
  if (patch.agentAccess !== undefined) t.agentAccess = !!patch.agentAccess;
  if (patch.humanAccess !== undefined) t.humanAccess = !!patch.humanAccess;
  t.updatedAt = now();
  persist(db);
  return t;
}

export function deleteTool(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'manager');
  db.tools = db.tools.filter((t) => !(t.id === id && t.workspaceId === ctx.workspaceId));
  persist(db);
}