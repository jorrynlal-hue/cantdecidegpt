import { DB, Ctx, Generation, Conversation, Notification, Event, ApprovalItem, ApprovalStatus } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity } from './core';
import { runProvider, runProviderLive, ProviderKind, ProviderOutcome } from '../providers';
import { emitEvent } from '../events';
import { AppError } from '../error';

// ---------- AI generations ----------

const GEN_KINDS: ProviderKind[] = ['content', 'image', 'video', 'voice', 'code', 'transcription', 'speech'];

export interface GenerationFilters {
  kind?: ProviderKind | 'all';
  q?: string;
}

export function listGenerations(db: DB, workspaceId: string, f: GenerationFilters = {}): Generation[] {
  return listRows<Generation>(db.generations, {
    workspaceId,
    q: f.q,
    searchFields: ['prompt'],
    sortBy: 'createdAt',
    sortDir: 'desc',
    filter: (g) => (f.kind === undefined || f.kind === 'all' || g.kind === f.kind),
  });
}

export function runGeneration(ctx: Ctx, db: DB, input: { kind: Exclude<ProviderKind, 'chat'>; prompt: string; params?: Record<string, unknown> }): { generation: Generation; outcome: ProviderOutcome } {
  requireRole(ctx, 'member');
  if (!GEN_KINDS.includes(input.kind)) throw Error('INVALID_KIND');
  const prompt = nonEmpty(input.prompt, 'prompt');
  const outcome = runProvider(db, ctx.workspaceId, input.kind, prompt, input.params ?? {});
  const generation: Generation = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    kind: input.kind,
    prompt,
    params: input.params ?? {},
    result: outcome.output,
    provider: outcome.provider,
    saved: false,
    createdBy: ctx.user.id,
    createdAt: now(),
  };
  db.generations.push(generation);
  logActivity(
    ctx,
    db,
    { action: `generation.${input.kind}`, result: `Generated ${input.kind} via ${outcome.provider} (${outcome.isBaseline ? 'baseline simulator' : 'simulated connector'})`, objectType: 'generation', objectId: generation.id, objectLabel: prompt.slice(0, 40) }
  );
  persist(db);
  return { generation, outcome };
}

// Live path used by user-facing AI surfaces: real provider calls with honest
// baseline fallback, same persistence semantics as runGeneration.
export async function runGenerationLive(ctx: Ctx, db: DB, input: { kind: Exclude<ProviderKind, 'chat'>; prompt: string; params?: Record<string, unknown> }): Promise<{ generation: Generation; outcome: ProviderOutcome }> {
  requireRole(ctx, 'member');
  if (!GEN_KINDS.includes(input.kind)) throw Error('INVALID_KIND');
  const prompt = nonEmpty(input.prompt, 'prompt');
  const outcome = await runProviderLive(db, ctx.workspaceId, input.kind, prompt, input.params ?? {});
  const generation: Generation = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    kind: input.kind,
    prompt,
    params: input.params ?? {},
    result: outcome.output,
    provider: outcome.provider,
    saved: false,
    createdBy: ctx.user.id,
    createdAt: now(),
  };
  db.generations.push(generation);
  logActivity(
    ctx,
    db,
    { action: `generation.${input.kind}`, result: `Generated ${input.kind} via ${outcome.provider}${outcome.simulated ? ' (simulated)' : ' (live)'}`, objectType: 'generation', objectId: generation.id, objectLabel: prompt.slice(0, 40) }
  );
  persist(db);
  return { generation, outcome };
}

export function markGenerationSaved(ctx: Ctx, db: DB, generationId: string): Generation {
  requireRole(ctx, 'member');
  const g = db.generations.find((x) => x.id === generationId && x.workspaceId === ctx.workspaceId);
  if (!g) throw Error('NOT_FOUND');
  g.saved = true;
  persist(db);
  return g;
}

export function deleteGeneration(ctx: Ctx, db: DB, generationId: string): void {
  requireRole(ctx, 'manager');
  db.generations = db.generations.filter((g) => g.id !== generationId && g.workspaceId === ctx.workspaceId);
  persist(db);
}

// ---------- conversations ----------

export function listConversations(db: DB, workspaceId: string, userId: string): Conversation[] {
  return db.conversations
    .filter((c) => c.workspaceId === workspaceId && c.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getConversation(db: DB, workspaceId: string, conversationId: string): Conversation {
  const c = db.conversations.find((x) => x.id === conversationId && x.workspaceId === workspaceId);
  if (!c) throw Error('NOT_FOUND');
  return c;
}

export function createConversation(ctx: Ctx, db: DB, title?: string): Conversation {
  const c: Conversation = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    userId: ctx.user.id,
    title: optStr(title) ?? 'New conversation',
    messages: [],
    createdAt: now(),
    updatedAt: now(),
  };
  db.conversations.push(c);
  persist(db);
  return c;
}

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export function appendMessage(ctx: Ctx, db: DB, conversationId: string, msg: ChatMessageInput): Conversation {
  const c = getConversation(db, ctx.workspaceId, conversationId);
  if (c.userId !== ctx.user.id) throw AppError.forbidden();
  c.messages.push({ id: uid(), role: msg.role, content: msg.content, name: msg.name, at: now() });
  if (msg.role === 'user' && c.title === 'New conversation') {
    c.title = msg.content.slice(0, 60);
  }
  c.updatedAt = now();
  persist(db);
  return c;
}

export function renameConversation(ctx: Ctx, db: DB, conversationId: string, title: string): Conversation {
  const c = getConversation(db, ctx.workspaceId, conversationId);
  if (c.userId !== ctx.user.id) throw AppError.forbidden();
  c.title = nonEmpty(title, 'title');
  c.updatedAt = now();
  persist(db);
  return c;
}

export function deleteConversation(ctx: Ctx, db: DB, conversationId: string): void {
  const c = getConversation(db, ctx.workspaceId, conversationId);
  if (c.userId !== ctx.user.id) throw AppError.forbidden();
  db.conversations = db.conversations.filter((x) => x.id !== conversationId);
  persist(db);
}

// ---------- notifications ----------

export function listNotifications(db: DB, workspaceId: string, userId: string, unreadOnly = false, limit = 50): Notification[] {
  return db.notifications
    .filter((n) => n.workspaceId === workspaceId && n.userId === userId && (!unreadOnly || !n.read))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function unreadCount(db: DB, workspaceId: string, userId: string): number {
  return db.notifications.filter((n) => n.workspaceId === workspaceId && n.userId === userId && !n.read).length;
}

export function setNotificationRead(ctx: Ctx, db: DB, id: string, read = true): Notification {
  const n = db.notifications.find((x) => x.id === id && x.workspaceId === ctx.workspaceId && x.userId === ctx.user.id);
  if (!n) throw Error('NOT_FOUND');
  n.read = read;
  persist(db);
  return n;
}

export function setAllNotificationsRead(ctx: Ctx, db: DB): number {
  let count = 0;
  db.notifications.forEach((n) => {
    if (n.workspaceId === ctx.workspaceId && n.userId === ctx.user.id && !n.read) {
      n.read = true;
      count++;
    }
  });
  if (count) persist(db);
  return count;
}

// ---------- events (calendar) ----------

export function listEvents(db: DB, workspaceId: string, from?: string, to?: string): Event[] {
  return db.events.filter((e) => {
    if (e.workspaceId !== workspaceId) return false;
    if (from && e.start < from) return false;
    if (to && e.start > to) return false;
    return true;
  });
}

export interface EventInput {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  kind?: Event['kind'];
  recurring?: Event['recurring'];
  projectId?: string;
  taskId?: string;
}

export function createEvent(ctx: Ctx, db: DB, input: EventInput): Event {
  requireRole(ctx, 'member');
  const e: Event = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    start: nonEmpty(input.start, 'start'),
    end: optStr(input.end),
    allDay: !!input.allDay,
    kind: input.kind === 'deadline' || input.kind === 'reminder' || input.kind === 'milestone' || input.kind === 'recurring' ? input.kind : 'event',
    recurring: input.recurring,
    taskId: optStr(input.taskId),
    projectId: optStr(input.projectId),
    createdBy: ctx.user.id,
    createdAt: now(),
  };
  db.events.push(e);
  persist(db);
  return e;
}

export function updateEvent(ctx: Ctx, db: DB, eventId: string, patch: Partial<EventInput>): Event {
  requireRole(ctx, 'member');
  const e = db.events.find((x) => x.id === eventId && x.workspaceId === ctx.workspaceId);
  if (!e) throw Error('NOT_FOUND');
  if (patch.title !== undefined) e.title = nonEmpty(patch.title, 'title');
  if (patch.start !== undefined) e.start = nonEmpty(patch.start, 'start');
  if (patch.end !== undefined) e.end = optStr(patch.end);
  if (patch.allDay !== undefined) e.allDay = patch.allDay;
  if (patch.recurring !== undefined) e.recurring = patch.recurring;
  persist(db);
  return e;
}

export function deleteEvent(ctx: Ctx, db: DB, eventId: string): void {
  requireRole(ctx, 'manager');
  db.events = db.events.filter((e) => e.id !== eventId && e.workspaceId === ctx.workspaceId);
  persist(db);
}

// ---------- approvals ----------

export function listApprovals(db: DB, workspaceId: string, f: { status?: ApprovalStatus | 'all'; requestedById?: string | 'all' } = {}): ApprovalItem[] {
  return db.approvals
    .filter((a) => a.workspaceId === workspaceId)
    .filter((a) => (f.status === undefined || f.status === 'all' || a.status === f.status))
    .filter((a) => (f.requestedById === undefined || f.requestedById === 'all' || a.requestedById === f.requestedById))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getApproval(db: DB, workspaceId: string, approvalId: string): ApprovalItem {
  const a = db.approvals.find((x) => x.id === approvalId && x.workspaceId === workspaceId);
  if (!a) throw Error('NOT_FOUND');
  return a;
}

export function requestApproval(ctx: Ctx, db: DB, input: { title: string; detail: string; kind?: string; payload?: Record<string, unknown>; executionId?: string }): ApprovalItem {
  requireRole(ctx, 'member');
  const a: ApprovalItem = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    detail: nonEmpty(input.detail, 'detail'),
    kind: optStr(input.kind) ?? 'action',
    status: 'pending',
    requestedBy: ctx.user.name,
    requestedById: ctx.user.id,
    executionId: optStr(input.executionId),
    payload: input.payload ?? {},
    createdAt: now(),
  };
  db.approvals.push(a);
  logActivity(ctx, db, { action: 'approval.request', result: `Requested approval "${a.title}"`, objectType: 'approval', objectId: a.id, objectLabel: a.title });
  emitEvent(ctx, db, 'approval_requested', { approvalId: a.id, title: a.title });
  persist(db);
  return a;
}

export function decideApproval(ctx: Ctx, db: DB, approvalId: string, approved: boolean): ApprovalItem {
  requireRole(ctx, 'manager');
  const a = getApproval(db, ctx.workspaceId, approvalId);
  if (a.status !== 'pending') throw Error('ALREADY_DECIDED');
  a.status = approved ? 'approved' : 'rejected';
  a.decidedBy = ctx.user.id;
  a.decidedAt = now();
  logActivity(ctx, db, { action: 'approval.decide', result: `${approved ? 'Approved' : 'Rejected'} "${a.title}"`, objectType: 'approval', objectId: a.id, objectLabel: a.title });
  emitEvent(ctx, db, 'approval_decided', { approvalId: a.id, approved, title: a.title, executionId: a.executionId });
  persist(db);
  return a;
}
