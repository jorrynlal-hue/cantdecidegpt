import { DB, Ctx, WorkProfile, WorkRole, DmThread, DmMessage, Project, Task } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, nonEmpty, optStr, logActivity, notify } from './core';
import { createTask, updateProject } from './work';
import { createKnowledge } from './docs';
import { SKILLS } from '@/lib/uiol/layer';

// Work Board — the shared area where work finders and work takers meet.
// Finder: a human who registers the craft they are good at (resume, details,
//         email, socials) so new businesses and teams can find them.
// Taker:  a human or company who registers the work their business needs so
//         people from every field can find them, connect and deliver.
// Profiles are public across the whole system. Direct connect + chat is a DM
// thread between the two users — the same as meeting at the water cooler.

export const WORK_FIELDS = SKILLS.map((s) => s.name);

const MAX_FIELDS = 6;

function cleanFields(fields: unknown): string[] {
  const list = Array.isArray(fields) ? fields.map((f) => String(f).trim().toLowerCase()).filter(Boolean) : [];
  const known = new Set(WORK_FIELDS.map((f) => f.toLowerCase()));
  return [...new Set(list.filter((f) => known.has(f)))].slice(0, MAX_FIELDS);
}

export interface WorkProfileInput {
  role: string;
  name?: string;
  email: string;
  fields: string[];
  details: string;
  resume?: string;
  socials?: string[];
  availability?: string;
}

export function listProfiles(db: DB, q: { role?: string; field?: string; mine?: boolean; userId?: string; search?: string } = {}): WorkProfile[] {
  let out = [...db.workProfiles];
  if (q.role === 'finder' || q.role === 'taker') out = out.filter((p) => p.role === q.role);
  if (q.field) {
    const f = q.field.toLowerCase();
    out = out.filter((p) => p.fields.some((x) => x.toLowerCase().includes(f)));
  }
  if (q.mine && q.userId) out = out.filter((p) => p.userId === q.userId);
  const s = q.search?.trim().toLowerCase();
  if (s) {
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.details.toLowerCase().includes(s) ||
        (p.resume ?? '').toLowerCase().includes(s) ||
        p.fields.some((f) => f.toLowerCase().includes(s))
    );
  }
  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createWorkProfile(ctx: Ctx, db: DB, input: WorkProfileInput): WorkProfile {
  requireRole(ctx, 'member');
  const role: WorkRole = input.role === 'taker' ? 'taker' : 'finder';
  const fields = cleanFields(input.fields);
  if (!fields.length) throw Error('WorkBoard requires at least one field.');
  const profile: WorkProfile = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    userId: ctx.user.id,
    role,
    name: nonEmpty(input.name || ctx.user.name || 'Work member', 'name'),
    email: optStr(input.email) || (ctx.user.email ?? ''),
    fields,
    details: nonEmpty(input.details, 'details'),
    resume: optStr(input.resume),
    socials: Array.isArray(input.socials) ? input.socials.map((s) => String(s).trim()).filter(Boolean).slice(0, 6) : [],
    availability: optStr(input.availability),
    createdAt: now(),
    updatedAt: now(),
  };
  db.workProfiles.push(profile);
  logActivity(ctx, db, {
    action: 'workboard.profile.add',
    result: `Registered on the Work Board as a work ${profile.role}: ${profile.name} (${profile.fields.join(', ')})`,
    objectType: 'workProfile',
    objectId: profile.id,
    objectLabel: profile.name,
  });
  persist(db);
  return profile;
}

export function updateWorkProfile(ctx: Ctx, db: DB, id: string, patch: Partial<WorkProfileInput>): WorkProfile {
  requireRole(ctx, 'member');
  const p = db.workProfiles.find((x) => x.id === id && x.userId === ctx.user.id);
  if (!p) throw Error('NOT_FOUND');
  if (patch.role === 'finder' || patch.role === 'taker') p.role = patch.role;
  if (patch.name !== undefined) p.name = nonEmpty(patch.name, 'name');
  if (patch.email !== undefined) p.email = optStr(patch.email) || p.email;
  if (patch.details !== undefined) p.details = nonEmpty(patch.details, 'details');
  if (patch.resume !== undefined) p.resume = optStr(patch.resume);
  if (patch.socials !== undefined) p.socials = Array.isArray(patch.socials) ? patch.socials.map((s) => String(s).trim()).filter(Boolean).slice(0, 6) : p.socials;
  if (patch.availability !== undefined) p.availability = optStr(patch.availability);
  if (patch.fields !== undefined) {
    const fields = cleanFields(patch.fields);
    if (fields.length) p.fields = fields;
  }
  p.updatedAt = now();
  persist(db);
  return p;
}

export function deleteWorkProfile(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'member');
  const p = db.workProfiles.find((x) => x.id === id && x.userId === ctx.user.id);
  if (!p) throw Error('NOT_FOUND');
  db.workProfiles = db.workProfiles.filter((x) => x.id !== id);
  logActivity(ctx, db, { action: 'workboard.profile.remove', result: `Removed Work Board profile of ${p.name}`, objectType: 'workProfile', objectId: id, objectLabel: p.name });
  persist(db);
}

// ---------- direct connect + chat ----------

function otherSide(t: DmThread, myId: string): string {
  return t.aId === myId ? t.bId : t.aId;
}

function pushMessage(db: DB, t: DmThread, from: string, text: string): DmMessage {
  const m: DmMessage = { id: uid(), from, text: text.slice(0, 2000), at: now() };
  t.messages.push(m);
  t.updatedAt = m.at;
  persist(db);
  return m;
}

function readStamp(t: DmThread): Record<string, string> {
  return t.lastRead ?? {};
}

function isUnread(t: DmThread, myId: string): number {
  const other = otherSide(t, myId);
  const stamp = readStamp(t)[myId] ?? '';
  return t.messages.filter((m) => m.from === other && m.at > stamp).length;
}

export function connectToProfile(ctx: Ctx, db: DB, input: { profileId: string; message?: string }): DmThread {
  requireRole(ctx, 'member');
  const p = db.workProfiles.find((x) => x.id === input.profileId);
  if (!p) throw Error('NOT_FOUND');
  if (p.userId === ctx.user.id) throw Error('You cannot connect with your own profile.');
  const partner = db.users.find((u) => u.id === p.userId);
  const partnerName = p.name || partner?.name || 'Work partner';
  const message = (input.message || `Hi ${partnerName}, I found your profile on the work board and would love to talk about working together.`).slice(0, 2000);

  let t = db.dmThreads.find((x) => x.aId === ctx.user.id && x.bId === p.userId && x.profileId === p.id);
  if (!t) t = db.dmThreads.find((x) => x.bId === ctx.user.id && x.aId === p.userId && x.profileId === p.id);
  if (!t) {
    t = {
      id: uid(),
      workspaceId: ctx.workspaceId,
      aId: ctx.user.id,
      aName: ctx.user.name || 'Work member',
      bId: p.userId,
      bName: partnerName,
      profileId: p.id,
      messages: [],
      lastRead: { [ctx.user.id]: now() },
      createdAt: now(),
      updatedAt: now(),
    };
    db.dmThreads.push(t);
  }
  pushMessage(db, t, ctx.user.id, message);
  notify(ctx, db, p.userId, {
    title: `${ctx.user.name || 'Someone'} wants to connect`,
    body: message,
    kind: 'connect',
    link: `/dashboard/board?tab=messages`,
  });
  logActivity(ctx, db, {
    action: 'workboard.connect',
    result: `Connected with ${partnerName} (${p.fields.join(', ')})`,
    objectType: 'dmThread',
    objectId: t.id,
    objectLabel: partnerName,
  });
  return t;
}

export interface ThreadSummary {
  id: string;
  withId: string;
  withName: string;
  profileId?: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  createdAt: string;
}

export function listMyThreads(ctx: Ctx, db: DB): ThreadSummary[] {
  const mine = db.dmThreads.filter((t) => t.aId === ctx.user.id || t.bId === ctx.user.id);
  return mine
    .map((t) => {
      const other = otherSide(t, ctx.user.id);
      const last = t.messages[t.messages.length - 1];
      return {
        id: t.id,
        withId: other,
        withName: t.aId === other ? t.aName : t.bName,
        profileId: t.profileId,
        lastMessage: last ? last.text : 'No messages yet',
        lastAt: t.updatedAt,
        unread: isUnread(t, ctx.user.id),
        createdAt: t.createdAt,
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

export function threadMessages(ctx: Ctx, db: DB, id: string): DmThread {
  const t = db.dmThreads.find((x) => x.id === id);
  if (!t) throw Error('NOT_FOUND');
  if (t.aId !== ctx.user.id && t.bId !== ctx.user.id) throw Error('FORBIDDEN');
  t.lastRead = { ...readStamp(t), [ctx.user.id]: now() };
  persist(db);
  return t;
}

export async function sendThreadMessage(ctx: Ctx, db: DB, input: { threadId: string; text: string }): Promise<DmMessage> {
  requireRole(ctx, 'member');
  const t = threadMessages(ctx, db, input.threadId);
  const text = nonEmpty(input.text, 'text');
  const m = pushMessage(db, t, ctx.user.id, text);
  const other = otherSide(t, ctx.user.id);
  notify(ctx, db, other, {
    title: `Message from ${ctx.user.name || 'Work member'}`,
    body: text,
    kind: 'dm',
    link: `/dashboard/board?tab=messages`,
  });
  return m;
}

export function deleteThread(ctx: Ctx, db: DB, threadId: string): void {
  requireRole(ctx, 'member');
  const t = db.dmThreads.find((x) => x.id === threadId);
  if (!t) throw Error('NOT_FOUND');
  if (t.aId !== ctx.user.id && t.bId !== ctx.user.id) throw Error('FORBIDDEN');
  db.dmThreads = db.dmThreads.filter((x) => x.id !== threadId);
  persist(db);
}

// Pair a work board connection straight into one of your projects: the partner
// joins the project, gets a task slot, and the deal agreed in chat moves into
// the project so the work can actually get done.
export function pairThreadToProject(
  ctx: Ctx,
  db: DB,
  input: { threadId: string; projectId: string }
): { project: Project; task: Task; thread: DmThread } {
  requireRole(ctx, 'member');
  const t = db.dmThreads.find((x) => x.id === input.threadId);
  if (!t) throw Error('NOT_FOUND');
  if (t.aId !== ctx.user.id && t.bId !== ctx.user.id) throw Error('FORBIDDEN');
  const project = db.projects.find((x) => x.id === input.projectId && x.workspaceId === ctx.workspaceId);
  if (!project) throw Error('NOT_FOUND');
  const partnerId = otherSide(t, ctx.user.id);
  const partnerName = t.aId === partnerId ? t.aName : t.bName;

  const updated = updateProject(ctx, db, project.id, { memberIds: [...project.memberIds, partnerId] });
  const task = createTask(ctx, db, {
    title: `${partnerName} — joined via work board`,
    description: `Connected to this project by ${ctx.user.name || 'you'} directly from the work board. Coordinate, deliver and get the work done in this project.`,
    projectId: updated.id,
    assigneeId: partnerId,
    priority: 'medium',
    status: 'todo',
  });
  pushMessage(db, t, ctx.user.id, `Paired this conversation with the project “${updated.name}” — working together there now.`);
  createKnowledge(ctx, db, {
    title: `Work board connection — ${partnerName}`,
    kind: 'reference',
    content: `## Paired with a project\n${partnerName} was connected to the project "${updated.name}" directly from the work board by ${ctx.user.name || 'you'}.\n\n## How it works\nThey joined as a project member, have a task slot open, and the conversation stays live here.`,
    tags: [updated.id, 'workboard', 'connection'],
  });
  notify(ctx, db, partnerId, {
    title: `${ctx.user.name || 'Someone'} brought you into a project`,
    body: `You were connected to the project "${updated.name}".`,
    kind: 'project',
    link: `/dashboard/projects/${updated.id}`,
  });
  logActivity(ctx, db, {
    action: 'workboard.pair',
    result: `Paired ${partnerName} with project "${updated.name}"`,
    objectType: 'project',
    objectId: updated.id,
    objectLabel: updated.name,
  });
  return { project: updated, task, thread: t };
}