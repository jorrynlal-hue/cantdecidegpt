import { DB, Ctx, Human, HumanStatus, Insight, InsightSource } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, logActivity } from './core';
import { runProviderLive } from '../providers';

// ---------- humans (the operating system's people) ----------

export interface HumanInput {
  name: string;
  role: string;
  email?: string;
  status?: HumanStatus;
  focus?: string;
  skills?: string[];
  aiAssist?: string[];
}

const HUMAN_STATUS: HumanStatus[] = ['online', 'busy', 'away', 'offline'];

export function listHumans(db: DB, workspaceId: string, q?: string): Human[] {
  return listRows<Human>(db.humans, {
    workspaceId,
    q,
    searchFields: ['name', 'role', 'focus', 'email'],
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
}

export function createHuman(ctx: Ctx, db: DB, input: HumanInput): Human {
  requireRole(ctx, 'member');
  const h: Human = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    role: nonEmpty(input.role, 'role'),
    email: optStr(input.email),
    status: HUMAN_STATUS.includes(input.status ?? 'offline') ? (input.status as HumanStatus) : 'offline',
    focus: optStr(input.focus) ?? '—',
    skills: Array.isArray(input.skills) ? input.skills.filter(Boolean) : [],
    aiAssist: Array.isArray(input.aiAssist) ? input.aiAssist.filter(Boolean) : [],
    lastSeen: now(),
    createdAt: now(),
  };
  db.humans.push(h);
  logActivity(ctx, db, { action: 'human.add', result: `Added human ${h.name} (${h.role}) to the workspace`, objectType: 'human', objectId: h.id, objectLabel: h.name });
  persist(db);
  return h;
}

export function updateHuman(ctx: Ctx, db: DB, id: string, patch: Partial<HumanInput>): Human {
  requireRole(ctx, 'member');
  const h = db.humans.find((x) => x.id === id && x.workspaceId === ctx.workspaceId);
  if (!h) throw Error('NOT_FOUND');
  if (patch.name !== undefined) h.name = nonEmpty(patch.name, 'name');
  if (patch.role !== undefined) h.role = nonEmpty(patch.role, 'role');
  if (patch.email !== undefined) h.email = optStr(patch.email);
  if (patch.status !== undefined && HUMAN_STATUS.includes(patch.status)) h.status = patch.status;
  if (patch.focus !== undefined) h.focus = optStr(patch.focus) ?? '—';
  if (patch.skills !== undefined) h.skills = Array.isArray(patch.skills) ? patch.skills.filter(Boolean) : h.skills;
  if (patch.aiAssist !== undefined) h.aiAssist = Array.isArray(patch.aiAssist) ? patch.aiAssist.filter(Boolean) : h.aiAssist;
  h.lastSeen = now();
  persist(db);
  return h;
}

export function deleteHuman(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'manager');
  db.humans = db.humans.filter((x) => x.id !== id && x.workspaceId === ctx.workspaceId);
  persist(db);
}

// ---------- insights (AI + human generative thinking) ----------

export function listInsights(db: DB, workspaceId: string, f: { source?: InsightSource | 'all'; q?: string } = {}): Insight[] {
  return listRows<Insight>(db.insights, {
    workspaceId,
    q: f.q,
    searchFields: ['title', 'body', 'tags'],
    sortBy: 'createdAt',
    sortDir: 'desc',
    filter: (i) => (f.source === undefined || f.source === 'all' || i.source === f.source),
  });
}

export function setInsight(ctx: Ctx, db: DB, input: { title: string; body: string; source?: InsightSource; tags?: string[] }): Insight {
  requireRole(ctx, 'member');
  const source: InsightSource = input.source === 'co' || input.source === 'ai' || input.source === 'human' ? input.source : 'human';
  const i: Insight = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    body: nonEmpty(input.body, 'body'),
    source,
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
    generatedBy: source === 'ai' ? 'nexus-ai' : ctx.user.id,
    createdAt: now(),
  };
  db.insights.push(i);
  logActivity(ctx, db, { action: 'insight.set', result: `Set insight "${i.title}" (${source})`, objectType: 'insight', objectId: i.id, objectLabel: i.title });
  persist(db);
  return i;
}

export function deleteInsight(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'member');
  db.insights = db.insights.filter((x) => x.id !== id && x.workspaceId === ctx.workspaceId);
  persist(db);
}

export async function generateInsightLive(ctx: Ctx, db: DB, input: { prompt?: string; focus?: string; hangingQuestion?: string }): Promise<Insight> {
  requireRole(ctx, 'member');
  const focus = optStr(input.focus) ?? 'the work the humans and AI are doing together';
  const hanging = optStr(input.hangingQuestion) ?? '';
  const prompt =
    input.prompt && input.prompt.trim()
      ? input.prompt
      : `Act as the generative insight engine inside a human + AI operating workspace. The team's current focus: "${focus}"${hanging ? ` — and they are actively thinking about: "${hanging}"` : ''}.

Generate ONE sharp, actionable, slightly unexpected insight that a smart human would want to set onto the board. Keep it under 120 words. Return it exactly as two short lines:
TITLE: <a crisp title under 12 words>
BODY: <the insight in 2-3 sentences>`;
  const outcome = await runProviderLive(db, ctx.workspaceId, 'content', prompt, { maxTokens: 320 });
  const raw = outcome.output.trim();
  const titleMatch = raw.match(/^TITLE:\s*(.+)$/im);
  const bodyMatch = raw.slice(titleMatch ? raw.indexOf(titleMatch[0]) + titleMatch[0].length : 0).trim();
  const title = titleMatch?.[1]?.trim().slice(0, 140) || raw.slice(0, 90);
  const body = bodyMatch || raw;
  const insight: Insight = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title,
    body,
    source: 'ai',
    tags: ['generative', 'ai'],
    generatedBy: 'nexus-ai',
    provider: outcome.provider,
    createdAt: now(),
  };
  db.insights.push(insight);
  logActivity(ctx, db, { action: 'insight.generate', result: `AI generated insight "${insight.title}" (${outcome.provider}${outcome.simulated ? ' · simulated' : ''})`, objectType: 'insight', objectId: insight.id, objectLabel: insight.title });
  persist(db);
  return insight;
}