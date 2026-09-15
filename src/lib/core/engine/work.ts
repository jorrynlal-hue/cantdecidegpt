import { DB, Ctx, Task, Project, TaskStatus, Priority, ProjectStatus } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, logActivity, notify } from './core';
import { emitEvent } from '../events';
import { getWorkspacePlan } from '@/lib/plans';

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived'];

function okStatus(v: unknown, fallback: TaskStatus): TaskStatus {
  return TASK_STATUSES.includes(v as TaskStatus) ? (v as TaskStatus) : fallback;
}
function okPriority(v: unknown, fallback: Priority): Priority {
  return PRIORITIES.includes(v as Priority) ? (v as Priority) : fallback;
}
function okProjectStatus(v: unknown, fallback: ProjectStatus): ProjectStatus {
  return PROJECT_STATUSES.includes(v as ProjectStatus) ? (v as ProjectStatus) : fallback;
}

// ---------- tasks ----------

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: Priority | 'all';
  assigneeId?: string | 'all';
  projectId?: string | 'all';
}

export function listTasks(db: DB, workspaceId: string, f: TaskFilters = {}, q?: string): Task[] {
  return listRows<Task>(db.tasks, {
    workspaceId,
    q,
    searchFields: ['title', 'description'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (t) =>
      (f.status === undefined || f.status === 'all' || t.status === f.status) &&
      (f.priority === undefined || f.priority === 'all' || t.priority === f.priority) &&
      (f.assigneeId === undefined || f.assigneeId === 'all' || t.assigneeId === f.assigneeId) &&
      (f.projectId === undefined || f.projectId === 'all' || t.projectId === f.projectId),
  });
}

export function getTask(db: DB, workspaceId: string, taskId: string): Task {
  const t = db.tasks.find((x) => x.id === taskId && x.workspaceId === workspaceId);
  if (!t) throw Error('NOT_FOUND');
  return t;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  projectId?: string;
  customerId?: string;
  dueDate?: string;
  recurring?: { freq: 'daily' | 'weekly' | 'monthly' };
}

export function createTask(ctx: Ctx, db: DB, input: TaskInput): Task {
  requireRole(ctx, 'member');
  const task: Task = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    description: optStr(input.description),
    status: okStatus(input.status, 'todo'),
    priority: okPriority(input.priority, 'medium'),
    assigneeId: optStr(input.assigneeId),
    projectId: optStr(input.projectId),
    customerId: optStr(input.customerId),
    dueDate: optStr(input.dueDate),
    subtasks: [],
    comments: [],
    recurring: input.recurring ? { freq: input.recurring.freq, nextDue: input.dueDate ?? now() } : undefined,
    createdBy: ctx.user.id,
    createdAt: now(),
    updatedAt: now(),
  };
  db.tasks.push(task);
  logActivity(ctx, db, { action: 'task.create', result: `Created task "${task.title}"`, objectType: 'task', objectId: task.id, objectLabel: task.title });
  if (task.assigneeId && task.assigneeId !== ctx.user.id) {
    notify(ctx, db, task.assigneeId, { title: 'New task assigned', body: task.title, kind: 'task', link: `/work/tasks/${task.id}` });
  }
  emitEvent(ctx, db, 'new_task', { taskId: task.id, title: task.title, assigneeId: task.assigneeId, projectId: task.projectId, priority: task.priority, status: task.status, createdBy: task.createdBy });
  persist(db);
  return task;
}

export function updateTask(ctx: Ctx, db: DB, taskId: string, patch: Partial<TaskInput>): Task {
  requireRole(ctx, 'member');
  const task = getTask(db, ctx.workspaceId, taskId);
  const wasCompleted = task.status === 'completed';
  let newStatus = wasCompleted;
  if (patch.title !== undefined) task.title = nonEmpty(patch.title, 'title');
  if (patch.description !== undefined) task.description = optStr(patch.description);
  if (patch.status !== undefined) {
    task.status = okStatus(patch.status, task.status);
    newStatus = task.status === 'completed';
  }
  if (patch.priority !== undefined) task.priority = okPriority(patch.priority, task.priority);
  if (patch.assigneeId !== undefined) task.assigneeId = optStr(patch.assigneeId);
  if (patch.projectId !== undefined) task.projectId = optStr(patch.projectId);
  if (patch.customerId !== undefined) task.customerId = optStr(patch.customerId);
  if (patch.dueDate !== undefined) task.dueDate = optStr(patch.dueDate);
  if (patch.recurring !== undefined) task.recurring = patch.recurring ? { freq: patch.recurring.freq, nextDue: task.dueDate ?? now() } : undefined;
  task.updatedAt = now();
  logActivity(ctx, db, { action: 'task.update', result: `Updated task "${task.title}"`, objectType: 'task', objectId: task.id, objectLabel: task.title });
  if (!wasCompleted && newStatus && task.recurring) {
    // recurring: schedule a fresh occurrence, keep the completed record
    const nextDue = nextDueDate(task.recurring.freq, task.recurring.nextDue);
    const clone: Task = { ...task, id: uid(), title: task.title + ' (recurring)', status: 'todo', comments: [], subtasks: [], createdAt: now(), updatedAt: now(), dueDate: nextDue, recurring: { freq: task.recurring.freq, nextDue } };
    db.tasks.push(clone);
    task.recurring.nextDue = nextDue;
    logActivity(ctx, db, { action: 'task.recur', result: `Recurring task scheduled to ${nextDue}`, objectType: 'task', objectId: clone.id, objectLabel: clone.title });
    emitEvent(ctx, db, 'new_task', { taskId: clone.id, title: clone.title, assigneeId: clone.assigneeId, projectId: clone.projectId, priority: clone.priority, status: 'todo', createdBy: clone.createdBy });
  }
  if (!wasCompleted && newStatus) {
    emitEvent(ctx, db, 'completed_task', { taskId: task.id, title: task.title, assigneeId: task.assigneeId, projectId: task.projectId });
  }
  persist(db);
  return task;
}

function nextDueDate(freq: 'daily' | 'weekly' | 'monthly', from: string): string {
  const base = from ? new Date(from) : new Date();
  if (freq === 'daily') base.setDate(base.getDate() + 1);
  else if (freq === 'weekly') base.setDate(base.getDate() + 7);
  else base.setMonth(base.getMonth() + 1);
  return base.toISOString().slice(0, 10);
}

export function deleteTask(ctx: Ctx, db: DB, taskId: string): void {
  requireRole(ctx, 'manager');
  const task = getTask(db, ctx.workspaceId, taskId);
  db.tasks = db.tasks.filter((t) => t.id !== taskId);
  logActivity(ctx, db, { action: 'task.delete', result: `Deleted task "${task.title}"`, objectType: 'task', objectId: taskId, objectLabel: task.title });
  persist(db);
}

export function addComment(ctx: Ctx, db: DB, taskId: string, text: string): Task {
  requireRole(ctx, 'member');
  const task = getTask(db, ctx.workspaceId, taskId);
  task.comments.push({ id: uid(), authorId: ctx.user.id, text: nonEmpty(text, 'comment'), at: now() });
  task.updatedAt = now();
  persist(db);
  return task;
}

export function toggleSubtask(ctx: Ctx, db: DB, taskId: string, subId: string): Task {
  requireRole(ctx, 'member');
  const task = getTask(db, ctx.workspaceId, taskId);
  const sub = task.subtasks.find((s) => s.id === subId);
  if (sub) sub.done = !sub.done;
  task.updatedAt = now();
  persist(db);
  return task;
}

export function addSubtask(ctx: Ctx, db: DB, taskId: string, title: string): Task {
  requireRole(ctx, 'member');
  const task = getTask(db, ctx.workspaceId, taskId);
  task.subtasks.push({ id: uid(), title: nonEmpty(title, 'title'), done: false });
  task.updatedAt = now();
  persist(db);
  return task;
}

// ---------- projects ----------

export function listProjects(db: DB, workspaceId: string, q?: string): Project[] {
  return listRows<Project>(db.projects, {
    workspaceId,
    q,
    searchFields: ['name', 'description'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });
}

export function getProject(db: DB, workspaceId: string, projectId: string): Project {
  const p = db.projects.find((x) => x.id === projectId && x.workspaceId === workspaceId);
  if (!p) throw Error('NOT_FOUND');
  return p;
}

export const PROJECT_PLAN_LIMITS: Record<string, number> = { core: 1, essential: 3, pro: 5 };

export interface ProjectInput {
  name: string;
  description?: string;
  ownerId?: string;
  memberIds?: string[];
  status?: ProjectStatus;
  startDate?: string;
  deadline?: string;
  customerId?: string;
  category?: string;
  colour?: string;
  tier?: string;
  template?: string;
}

export function createProject(ctx: Ctx, db: DB, input: ProjectInput): Project {
  requireRole(ctx, 'member');
  const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
  const plan = (ws ? getWorkspacePlan(ws) : 'pro') as keyof typeof PROJECT_PLAN_LIMITS;
  const limit = PROJECT_PLAN_LIMITS[plan] ?? PROJECT_PLAN_LIMITS.pro;
  const used = db.projects.filter((p) => p.workspaceId === ctx.workspaceId).length;
  if (used >= limit) {
    throw Error(`PLAN_LIMIT:${plan}:${limit}`);
  }
  const project: Project = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    description: optStr(input.description),
    ownerId: optStr(input.ownerId) ?? ctx.user.id,
    memberIds: [...new Set((input.memberIds ?? []).concat(input.ownerId ? [input.ownerId] : [ctx.user.id]))],
    status: okProjectStatus(input.status, 'planning'),
    milestones: [],
    files: [],
    comments: [],
    startDate: optStr(input.startDate),
    deadline: optStr(input.deadline),
    customerId: optStr(input.customerId),
    category: optStr(input.category),
    colour: optStr(input.colour),
    tier: optStr(input.tier),
    template: optStr(input.template),
    createdAt: now(),
    updatedAt: now(),
  };
  db.projects.push(project);
  logActivity(ctx, db, { action: 'project.create', result: `Created project "${project.name}"`, objectType: 'project', objectId: project.id, objectLabel: project.name });
  persist(db);
  return project;
}

export function updateProject(ctx: Ctx, db: DB, projectId: string, patch: Partial<ProjectInput>): Project {
  requireRole(ctx, 'member');
  const p = getProject(db, ctx.workspaceId, projectId);
  if (patch.name !== undefined) p.name = nonEmpty(patch.name, 'name');
  if (patch.description !== undefined) p.description = optStr(patch.description);
  if (patch.status !== undefined) p.status = okProjectStatus(patch.status, p.status);
  if (patch.startDate !== undefined) p.startDate = optStr(patch.startDate);
  if (patch.deadline !== undefined) p.deadline = optStr(patch.deadline);
  if (patch.ownerId !== undefined) p.ownerId = optStr(patch.ownerId) ?? p.ownerId;
  if (patch.memberIds !== undefined) p.memberIds = [...new Set(patch.memberIds)];
  if (patch.customerId !== undefined) p.customerId = optStr(patch.customerId);
  if (patch.category !== undefined) p.category = optStr(patch.category);
  if (patch.colour !== undefined) p.colour = optStr(patch.colour);
  if (patch.tier !== undefined) p.tier = optStr(patch.tier);
  if (patch.template !== undefined) p.template = optStr(patch.template);
  p.updatedAt = now();
  logActivity(ctx, db, { action: 'project.update', result: `Updated project "${p.name}"`, objectType: 'project', objectId: p.id, objectLabel: p.name });
  persist(db);
  return p;
}

export function deleteProject(ctx: Ctx, db: DB, projectId: string): void {
  requireRole(ctx, 'manager');
  const p = getProject(db, ctx.workspaceId, projectId);
  db.projects = db.projects.filter((x) => x.id !== projectId);
  db.tasks.forEach((t) => {
    if (t.projectId === projectId) t.projectId = undefined;
  });
  logActivity(ctx, db, { action: 'project.delete', result: `Deleted project "${p.name}"`, objectType: 'project', objectId: projectId, objectLabel: p.name });
  persist(db);
}

export function toggleMilestone(ctx: Ctx, db: DB, projectId: string, milestoneId: string): Project {
  requireRole(ctx, 'member');
  const p = getProject(db, ctx.workspaceId, projectId);
  const m = p.milestones.find((x) => x.id === milestoneId);
  if (m) m.done = !m.done;
  p.updatedAt = now();
  persist(db);
  return p;
}

export function addMilestone(ctx: Ctx, db: DB, projectId: string, title: string, dueDate?: string): Project {
  requireRole(ctx, 'member');
  const p = getProject(db, ctx.workspaceId, projectId);
  p.milestones.push({ id: uid(), title: nonEmpty(title, 'title'), dueDate: optStr(dueDate), done: false });
  p.updatedAt = now();
  persist(db);
  return p;
}