import { DB, Ctx, Role, User, Workspace, ActivityItem, Notification, UserSettings } from '../types';
import { now, uid, persist } from '../db';
import { AppError } from '../error';

export const ROLE_RANK: Record<Role, number> = { viewer: 20, member: 40, manager: 60, admin: 80, owner: 100 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function requireRole(ctx: Ctx, min: Role): void {
  if (!roleAtLeast(ctx.user.role, min)) throw AppError.forbidden();
}

export function requireWorkspaceMember(ctx: Ctx, workspace: Workspace): void {
  if (!workspace.memberIds.includes(ctx.user.id)) throw Error('NOT_MEMBER');
}

export function workspaceMembers(db: DB, workspaceId: string): User[] {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws) return [];
  return db.users.filter((u) => ws.memberIds.includes(u.id));
}

export function workspaceMemberIds(db: DB, workspaceId: string): string[] {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  return ws ? ws.memberIds : [];
}

// ---------- activity ----------

export interface ActivityInput {
  action: string;
  result: string;
  objectType?: string;
  objectId?: string;
  objectLabel?: string;
}

export function logActivity(ctx: Ctx, db: DB, input: ActivityInput): ActivityItem {
  const item: ActivityItem = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    actorId: ctx.user.id,
    actorSource: ctx.actorSource ?? 'user',
    action: input.action,
    objectType: input.objectType,
    objectId: input.objectId,
    objectLabel: input.objectLabel,
    result: input.result,
    at: now(),
  };
  db.activities.push(item);
  persist(db);
  return item;
}

// ---------- notifications ----------

export interface NotifyInput {
  title: string;
  body?: string;
  kind: string;
  link?: string;
}

export function notify(ctx: Ctx, db: DB, userId: string, input: NotifyInput): Notification {
  const n: Notification = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    userId,
    title: input.title,
    body: input.body,
    kind: input.kind,
    read: false,
    link: input.link,
    createdAt: now(),
  };
  db.notifications.push(n);
  persist(db);
  return n;
}

export function notifyWorkspace(ctx: Ctx, db: DB, input: NotifyInput, excludeId?: string): number {
  const ids = workspaceMemberIds(db, ctx.workspaceId).filter((id) => id !== excludeId);
  let count = 0;
  for (const id of ids) {
    notify(ctx, db, id, input);
    count++;
  }
  return count;
}

// ---------- generic list helper ----------

export interface ListOptions<T extends { id: string; workspaceId: string }> {
  workspaceId: string;
  q?: string | null;
  searchFields?: (keyof T & string)[];
  sortBy?: keyof T;
  sortDir?: 'asc' | 'desc';
  filter?: (row: T) => boolean;
  limit?: number;
  offset?: number;
}

export function listRows<T extends { id: string; workspaceId: string }>(rows: T[], opts: ListOptions<T>): T[] {
  let out = rows.filter((r) => r.workspaceId === opts.workspaceId && (opts.filter ? opts.filter(r) : true));
  const q = opts.q?.trim().toLowerCase();
  if (q && opts.searchFields?.length) {
    out = out.filter((r) =>
      opts.searchFields!.some((f) => String((r as unknown as Record<string, unknown>)[f] ?? '').toLowerCase().includes(q))
    );
  }
  const sb = opts.sortBy as string | undefined;
  if (sb) {
    const dir = opts.sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sb];
      const bv = (b as unknown as Record<string, unknown>)[sb];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 500;
  return out.slice(offset, offset + limit);
}

// ---------- input sanitizers ----------

export function nonEmpty(v: unknown, name = 'value'): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw Error(`INVALID_${name.toUpperCase()}`);
  return s;
}

export function optStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

export function num(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : def;
}

// ---------- workspaces ----------

export function createWorkspace(db: DB, input: { name: string; slug?: string; userId: string; role: Role }, otherUserIds: string[] = []): Workspace {
  const name = nonEmpty(input.name, 'name');
  const slug = nonEmpty(input.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), 'slug');
  const memberIds = [...new Set([input.userId, ...otherUserIds])];
  const ws: Workspace = {
    id: `ws-${uid().slice(0, 8)}`,
    name,
    slug,
    ownerUserId: input.userId,
    memberIds,
    settings: {},
    createdAt: now(),
  };
  db.workspaces.push(ws);
  const user = db.users.find((u) => u.id === input.userId);
  if (user) setActiveWorkspace(db, user.id, ws.id);
  persist(db);
  return ws;
}

export function getWorkspace(ctx: Ctx, db: DB, workspaceId: string): Workspace {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws) throw Error('NOT_FOUND');
  requireWorkspaceMember(ctx, ws);
  return ws;
}

export function listWorkspacesForUser(db: DB, userId: string): Workspace[] {
  return db.workspaces
    .filter((w) => w.memberIds.includes(userId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function updateWorkspace(ctx: Ctx, db: DB, workspaceId: string, patch: { name?: string; settings?: Record<string, unknown> }): Workspace {
  const ws = getWorkspace(ctx, db, workspaceId);
  requireRole(ctx, 'admin');
  if (patch.name) ws.name = nonEmpty(patch.name, 'name');
  if (patch.settings) ws.settings = { ...ws.settings, ...patch.settings };
  persist(db);
  return ws;
}

export function deleteWorkspace(ctx: Ctx, db: DB, workspaceId: string): void {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws) throw Error('NOT_FOUND');
  if (ws.ownerUserId !== ctx.user.id && ctx.user.role !== 'owner') throw AppError.forbidden();
  db.workspaces = db.workspaces.filter((w) => w.id !== workspaceId);
  // remove every piece of workspace data
  const strip = <T extends { workspaceId: string }>(rows: T[]): T[] => rows.filter((r) => r.workspaceId !== workspaceId);
  const container = db as unknown as Record<string, unknown>;
  const colls = Object.keys(container).filter((k) => !['workspaces', 'users', 'userSettings', 'seq', 'initializedAt'].includes(k));
  for (const key of colls) {
    const rows = container[key];
    if (Array.isArray(rows) && rows.length && typeof (rows[0] as { workspaceId?: unknown })?.workspaceId === 'string') {
      container[key] = strip(rows as { workspaceId: string }[]);
    }
  }
  persist(db);
}

// ---------- active workspace ----------

export function getSettings(db: DB, userId: string): UserSettings | undefined {
  return db.userSettings.find((s) => s.userId === userId);
}

export function setActiveWorkspace(db: DB, userId: string, workspaceId: string): UserSettings {
  let s = getSettings(db, userId);
  if (!s) {
    s = {
      userId,
      appearance: { theme: 'dark', accent: 'royal-purple' },
      notify: { task: true, approval: true, workflow: true, customer: true, ai: true },
      workspaceId,
    };
    db.userSettings.push(s);
  } else {
    s.workspaceId = workspaceId;
  }
  persist(db);
  return s;
}

export function addUserToWorkspace(ctx: Ctx, db: DB, workspaceId: string, userId: string): Workspace {
  const ws = getWorkspace(ctx, db, workspaceId);
  requireRole(ctx, 'admin');
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw Error('NOT_FOUND');
  if (!ws.memberIds.includes(userId)) ws.memberIds.push(userId);
  persist(db);
  return ws;
}

export function removeUserFromWorkspace(ctx: Ctx, db: DB, workspaceId: string, userId: string): Workspace {
  const ws = getWorkspace(ctx, db, workspaceId);
  requireRole(ctx, 'admin');
  if (ws.ownerUserId === userId && ws.memberIds.includes(userId)) throw Error('CANNOT_REMOVE_OWNER');
  ws.memberIds = ws.memberIds.filter((id) => id !== userId);
  persist(db);
  return ws;
}

export function changeUserRole(ctx: Ctx, db: DB, workspaceId: string, userId: string, role: Role): User {
  getWorkspace(ctx, db, workspaceId);
  requireRole(ctx, 'admin');
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw Error('NOT_FOUND');
  if (user.role === 'owner') throw Error('CANNOT_CHANGE_OWNER');
  user.role = role;
  persist(db);
  return user;
}

// ---------- platform users (Team page) ----------

export function listUsers(db: DB, workspaceId: string): User[] {
  return workspaceMembers(db, workspaceId);
}

export function getPlatformUser(db: DB, userId: string): User | undefined {
  return db.users.find((u) => u.id === userId);
}

export function createPlatformUser(ctx: Ctx, db: DB, input: { email: string; name: string; password: string; role: Role }, workspaceId: string): User {
  requireRole(ctx, 'admin');
  const email = nonEmpty(input.email, 'email').toLowerCase();
  if (db.users.some((u) => u.email === email)) throw Error('EMAIL_TAKEN');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require avoids db<->engine/core cycle
  const { hashPassword, shortId } = require('../db') as typeof import('../db');
  const user: User = {
    id: shortId('u'),
    email,
    name: nonEmpty(input.name, 'name'),
    passwordHash: hashPassword(input.password || 'password'),
    role: input.role || 'member',
    createdAt: now(),
  };
  db.users.push(user);
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (ws && !ws.memberIds.includes(user.id)) ws.memberIds.push(user.id);
  persist(db);
  return user;
}

// Match an authenticated identity to an app user, creating the user + a
// personal workspace on first sign-in so the app always has a home.
export function ensureAppUser(db: DB, email: string, name: string, supabaseId?: string): User {
  const normalized = email.trim().toLowerCase();
  let user = db.users.find((u) => u.email === normalized);
  if (!user) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require avoids db<->engine/core cycle
    const { uid, now: dbNow, persist: persistDb } = require('../db') as typeof import('../db');
    const id = supabaseId ?? uid();
    user = {
      id,
      email: normalized,
      passwordHash: '',
      name: name || normalized.split('@')[0] || 'New user',
      role: 'owner',
      createdAt: dbNow(),
    };
    db.users.push(user);
    db.workspaces.push({
      id: uid(),
      name: 'My Workspace',
      slug: `ws-${id.slice(0, 8)}`,
      ownerUserId: id,
      memberIds: [id],
      settings: {},
      createdAt: dbNow(),
    });
    persistDb(db);
  }
  return user;
}