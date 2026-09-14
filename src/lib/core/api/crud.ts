import { DB, Ctx } from '../types';
import * as work from '../engine/work';
import * as crm from '../engine/crm';
import * as marketing from '../engine/marketing';
import * as finance from '../engine/finance';
import * as docs from '../engine/docs';
import * as misc from '../engine/misc';
import * as admin from '../engine/admin';
import { listExecutions, getExecution, cancelExecution, verifyExecution } from '../automation';
import * as human from '../engine/human';
import * as control from '../engine/control';
import { persist } from '../db';

export const automationList = (db: DB, ws: string, q?: string) => listExecutions(db, ws, 80);
export const automationGet = (db: DB, ws: string, id: string) => getExecution(db, ws, id);

export type ListFn = (db: DB, workspaceId: string, query: Record<string, string>, bag: { ctx: Ctx }) => unknown;
export type CreateFn = (ctx: Ctx, db: DB, body: Record<string, unknown>) => unknown;
export type GetFn = (db: DB, workspaceId: string, id: string) => unknown;
export type UpdateFn = (ctx: Ctx, db: DB, id: string, patch: Record<string, unknown>) => unknown;
export type DeleteFn = (ctx: Ctx, db: DB, id: string) => void;

function qstr(query: Record<string, string>, key: string): string | undefined {
  return query[key] && query[key] !== 'all' ? query[key] : undefined;
}

export interface CrudDef {
  list?: ListFn;
  create?: CreateFn;
  get?: GetFn;
  update?: UpdateFn;
  remove?: DeleteFn;
}

export const crud: Record<string, CrudDef> = {
  tasks: {
    list: (db, ws, q) => work.listTasks(db, ws, { status: q.status as never, priority: q.priority as never, assigneeId: q.assigneeId, projectId: q.projectId }, q.q),
    create: (ctx, db, b) => work.createTask(ctx, db, { title: String(b.title ?? ''), description: b.description as string, status: b.status as never, priority: b.priority as never, assigneeId: String(b.assigneeId ?? ''), projectId: String(b.projectId ?? ''), customerId: String(b.customerId ?? ''), dueDate: b.dueDate as string, recurring: b.recurring as never }),
    get: (db, ws, id) => work.getTask(db, ws, id),
    update: (ctx, db, id, p) => work.updateTask(ctx, db, id, { title: p.title as string, description: p.description as string, status: p.status as never, priority: p.priority as never, assigneeId: p.assigneeId as string, projectId: p.projectId as string, customerId: p.customerId as string, dueDate: p.dueDate as string }),
    remove: (ctx, db, id) => work.deleteTask(ctx, db, id),
  },
  projects: {
    list: (db, ws, q) => work.listProjects(db, ws, q.q),
    create: (ctx, db, b) => work.createProject(ctx, db, { name: String(b.name ?? ''), description: b.description as string, ownerId: String(b.ownerId ?? ''), memberIds: b.memberIds as string[] | undefined, status: b.status as never, startDate: b.startDate as string, deadline: b.deadline as string, customerId: b.customerId as string, category: String(b.category ?? ''), colour: String(b.colour ?? ''), tier: String(b.tier ?? ''), template: String(b.template ?? '') }),
    get: (db, ws, id) => work.getProject(db, ws, id),
    update: (ctx, db, id, p) => work.updateProject(ctx, db, id, { name: p.name as string, description: p.description as string, status: p.status as never, startDate: p.startDate as string, deadline: p.deadline as string, ownerId: p.ownerId as string, memberIds: p.memberIds as string[] | undefined, customerId: p.customerId as string, category: p.category as string, colour: p.colour as string, tier: p.tier as string, template: p.template as string }),
    remove: (ctx, db, id) => work.deleteProject(ctx, db, id),
  },
  customers: {
    list: (db, ws, q) => crm.listCustomers(db, ws, q.q, qstr(q, 'tag')),
    create: (ctx, db, b) => crm.createCustomer(ctx, db, { type: String(b.type ?? 'contact') as 'contact' | 'company', name: String(b.name ?? ''), email: b.email as string, phone: b.phone as string, company: b.company as string, notes: b.notes as string, tags: (b.tags as string[] | undefined) ?? [] }),
    get: (db, ws, id) => crm.getCustomer(db, ws, id),
    update: (ctx, db, id, p) => crm.updateCustomer(ctx, db, id, { name: p.name as string, email: p.email as string, phone: p.phone as string, company: p.company as string, notes: p.notes as string, tags: p.tags as string[] | undefined }),
    remove: (ctx, db, id) => crm.deleteCustomer(ctx, db, id),
  },
  deals: {
    list: (db, ws, q) => crm.listDeals(db, ws, { stage: q.stage as never, ownerId: q.ownerId }, q.q),
    create: (ctx, db, b) => crm.createDeal(ctx, db, { name: String(b.name ?? ''), customerId: b.customerId as string, value: b.value as number, stage: b.stage as never, ownerId: b.ownerId as string, expectedClose: b.expectedClose as string, notes: b.notes as string }),
    get: (db, ws, id) => crm.getDeal(db, ws, id),
    update: (ctx, db, id, p) => crm.updateDeal(ctx, db, id, { name: p.name as string, customerId: p.customerId as string, value: p.value as number, stage: p.stage as never, ownerId: p.ownerId as string, expectedClose: p.expectedClose as string, notes: p.notes as string }),
    remove: (ctx, db, id) => crm.deleteDeal(ctx, db, id),
  },
  campaigns: {
    list: (db, ws, q) => marketing.listCampaigns(db, ws, { status: q.status as never }, q.q),
    create: (ctx, db, b) => marketing.createCampaign(ctx, db, { name: String(b.name ?? ''), description: b.description as string, channel: b.channel as never, status: b.status as never, audienceIds: b.audienceIds as string[], contentIds: b.contentIds as string[], schedule: b.schedule as string, budget: b.budget as number }),
    get: (db, ws, id) => marketing.getCampaign(db, ws, id),
    update: (ctx, db, id, p) => marketing.updateCampaign(ctx, db, id, { name: p.name as string, description: p.description as string, status: p.status as never, schedule: p.schedule as string, budget: p.budget as number }),
    remove: (ctx, db, id) => marketing.deleteCampaign(ctx, db, id),
  },
  posts: {
    list: (db, ws, q) => marketing.listPosts(db, ws, { status: q.status as never }, q.q),
    create: (ctx, db, b) => marketing.createPost(ctx, db, { platform: String(b.platform ?? ''), text: String(b.text ?? ''), mediaIds: b.mediaIds as string[], scheduledAt: b.scheduledAt as string, campaignId: b.campaignId as string }),
    get: (db, ws, id) => marketing.getPost(db, ws, id),
    update: (ctx, db, id, p) => {
      const op = String(p.op ?? '');
      if (op === 'publish') return marketing.publishPost(ctx, db, id);
      return marketing.updatePost(ctx, db, id, { platform: p.platform as string, text: p.text as string, mediaIds: p.mediaIds as string[], scheduledAt: p.scheduledAt as string, campaignId: p.campaignId as string, status: p.status as never });
    },
    remove: (ctx, db, id) => marketing.deletePost(ctx, db, id),
  },
  emails: {
    list: (db, ws, q) => marketing.listEmails(db, ws, { status: q.status as never }, q.q),
    create: (ctx, db, b) => marketing.createEmail(ctx, db, { to: b.to as string, subject: String(b.subject ?? ''), body: String(b.body ?? ''), scheduledAt: b.scheduledAt as string, templateId: b.templateId as string, customerId: b.customerId as string, dealId: b.dealId as string, campaignId: b.campaignId as string }),
    get: (db, ws, id) => marketing.getEmail(db, ws, id),
    update: (ctx, db, id, p) => {
      if (String(p.op ?? '') === 'send') return marketing.sendEmail(ctx, db, id);
      const ex = db.emails.find((e) => e.id === id && e.workspaceId === ctx.workspaceId);
      return ex ?? { error: 'not found' };
    },
    remove: (ctx, db, id) => marketing.deleteEmail(ctx, db, id),
  },
  emailTemplates: {
    list: (db, ws) => marketing.listTemplates(db, ws),
    create: (ctx, db, b) => marketing.createTemplate(ctx, db, { name: String(b.name ?? ''), subject: String(b.subject ?? ''), body: String(b.body ?? '') }),
    get: (db, ws, id) => db.emailTemplates.find((t) => t.id === id && t.workspaceId === ws) ?? { error: 'not found' },
    remove: (ctx, db, id) => marketing.deleteTemplate(ctx, db, id),
  },
  invoices: {
    list: (db, ws, q) => finance.listInvoices(db, ws, { status: q.status as never, q: q.q }),
    create: (ctx, db, b) => finance.createInvoice(ctx, db, { customerId: b.customerId as string, lines: b.lines as never, taxPct: b.taxPct as number, discountPct: b.discountPct as number, dueDate: b.dueDate as string, notes: b.notes as string }),
    get: (db, ws, id) => finance.getInvoice(db, ws, id),
    update: (ctx, db, id, p) => {
      const op = String(p.op ?? '');
      if (op === 'status') return finance.setInvoiceStatus(ctx, db, id, String(p.status ?? '') as never);
      return finance.updateInvoice(ctx, db, id, { customerId: p.customerId as string, lines: p.lines as never, taxPct: p.taxPct as number, discountPct: p.discountPct as number, dueDate: p.dueDate as string, notes: p.notes as string });
    },
    remove: (ctx, db, id) => finance.deleteInvoice(ctx, db, id),
  },
  transactions: {
    list: (db, ws, q) => finance.listTransactions(db, ws, { type: q.type as never, categoryId: q.categoryId, q: q.q }),
    create: (ctx, db, b) => finance.createTransaction(ctx, db, { type: String(b.type ?? 'expense') as 'income' | 'expense', description: String(b.description ?? ''), amount: Number(b.amount ?? 0), categoryId: b.categoryId as string, date: b.date as string, invoiceId: b.invoiceId as string }),
    get: (db, ws, id) => db.transactions.find((t) => t.id === id && t.workspaceId === ws) ?? { error: 'not found' },
    remove: (ctx, db, id) => finance.deleteTransaction(ctx, db, id),
  },
  txnCategories: {
    list: (db, ws) => finance.listCategories(db, ws),
    create: (ctx, db, b) => finance.createCategory(ctx, db, { name: String(b.name ?? ''), type: String(b.type ?? 'expense') as 'income' | 'expense' }),
    remove: (ctx, db, id) => {
      db.txnCategories = db.txnCategories.filter((c) => !(c.id === id && c.workspaceId === ctx.workspaceId));
      persist(db);
    },
  },
  documents: {
    list: (db, ws, q) => docs.listDocuments(db, ws, { folder: qstr(q, 'folder'), kind: qstr(q, 'kind'), q: q.q }),
    create: (ctx, db, b) => docs.createDocument(ctx, db, { name: String(b.name ?? ''), kind: b.kind as string, size: b.size as number, text: b.text as string, folder: b.folder as string }),
    get: (db, ws, id) => docs.getDocument(db, ws, id),
    update: (ctx, db, id, p) => docs.updateDocument(ctx, db, id, { name: p.name as string, folder: p.folder as string, kind: p.kind as string, text: p.text as string }),
    remove: (ctx, db, id) => docs.deleteDocument(ctx, db, id),
  },
  knowledge: {
    list: (db, ws, q) => docs.listKnowledge(db, ws, { kind: qstr(q, 'kind'), tag: qstr(q, 'tag'), q: q.q }),
    create: (ctx, db, b) => docs.createKnowledge(ctx, db, { title: String(b.title ?? ''), kind: b.kind as string, content: String(b.content ?? ''), tags: b.tags as string[] | undefined }),
    get: (db, ws, id) => docs.getKnowledge(db, ws, id),
    update: (ctx, db, id, p) => docs.updateKnowledge(ctx, db, id, { title: p.title as string, content: p.content as string, tags: p.tags as string[] | undefined }),
    remove: (ctx, db, id) => docs.deleteKnowledge(ctx, db, id),
  },
  content: {
    list: (db, ws, q) => docs.listContent(db, ws, { kind: qstr(q, 'kind'), q: q.q }),
    create: (ctx, db, b) => docs.saveContent(ctx, db, { title: String(b.title ?? ''), kind: b.kind as string, body: String(b.body ?? ''), tone: b.tone as string }),
    get: (db, ws, id) => db.content.find((c) => c.id === id && c.workspaceId === ws) ?? { error: 'not found' },
    remove: (ctx, db, id) => docs.deleteContent(ctx, db, id),
  },
  generations: {
    list: (db, ws, q) => misc.listGenerations(db, ws, { kind: q.kind as never, q: q.q }),
    create: (ctx, db, b) => misc.runGeneration(ctx, db, { kind: String(b.kind ?? 'content') as never, prompt: String(b.prompt ?? ''), params: b.params as Record<string, unknown> | undefined }),
    get: (db, ws, id) => db.generations.find((g) => g.id === id && g.workspaceId === ws) ?? { error: 'not found' },
    update: (ctx, db, id, p) => {
      if (String(p.op ?? '') === 'save') return misc.markGenerationSaved(ctx, db, id);
      return db.generations.find((g) => g.id === id && g.workspaceId === ctx.workspaceId) ?? { error: 'not found' };
    },
    remove: (ctx, db, id) => misc.deleteGeneration(ctx, db, id),
  },
  workflows: {
    list: (db, ws, q) => admin.listWorkflows(db, ws, q.q),
    create: (ctx, db, b) => admin.createWorkflow(ctx, db, { name: String(b.name ?? ''), description: b.description as string, trigger: b.trigger as never, steps: (b.steps as never[]) ?? [], enabled: b.enabled as boolean }),
    get: (db, ws, id) => admin.getWorkflow(db, ws, id),
    update: (ctx, db, id, p) => admin.updateWorkflow(ctx, db, id, { name: p.name as string, description: p.description as string, trigger: p.trigger as never, steps: p.steps as never[], enabled: p.enabled as boolean }),
    remove: (ctx, db, id) => admin.deleteWorkflow(ctx, db, id),
  },
  executions: {
    list: (db, ws, q) => automationList(db, ws, q.q),
    get: (db, ws, id) => automationGet(db, ws, id),
    update: (ctx, db, id, p) => {
      if (String(p.op ?? '') === 'verify') return verifyExecution(db, ctx.workspaceId, id);
      if (String(p.op ?? '') === 'cancel') return cancelExecution(ctx, db, id);
      return getExecution(db, ctx.workspaceId, id);
    },
  },
  events: {
    list: (db, ws, q) => misc.listEvents(db, ws, q.from, q.to),
    create: (ctx, db, b) => misc.createEvent(ctx, db, { title: String(b.title ?? ''), start: String(b.start ?? ''), end: b.end as string, allDay: b.allDay as boolean, kind: b.kind as never, recurring: b.recurring as never, projectId: b.projectId as string, taskId: b.taskId as string }),
    get: (db, ws, id) => db.events.find((e) => e.id === id && e.workspaceId === ws) ?? { error: 'not found' },
    update: (ctx, db, id, p) => misc.updateEvent(ctx, db, id, { title: p.title as string, start: p.start as string, end: p.end as string, allDay: p.allDay as boolean, recurring: p.recurring as never }),
    remove: (ctx, db, id) => misc.deleteEvent(ctx, db, id),
  },
  approvals: {
    list: (db, ws, q) => misc.listApprovals(db, ws, { status: q.status as never, requestedById: q.requestedById }),
    create: (ctx, db, b) => misc.requestApproval(ctx, db, { title: String(b.title ?? ''), detail: String(b.detail ?? ''), kind: b.kind as string, payload: b.payload as Record<string, unknown> | undefined }),
    get: (db, ws, id) => misc.getApproval(db, ws, id),
  },
  integrations: {
    list: (db, ws, q) => admin.listIntegrations(db, ws, qstr(q, 'category')),
    get: (db, ws, id) => admin.getIntegration(db, ws, id),
    create: (ctx, db, b) => admin.createIntegration(ctx, db, { name: String(b.name ?? ''), kind: b.kind as never, category: b.category as never, provider: b.provider as string, domain: b.domain as string, endpoint: b.endpoint as string, scopes: b.scopes as string[] | undefined, settings: b.settings as Record<string, unknown> | undefined }),
    update: (ctx, db, id, p) => {
      if (String(p.op ?? '') === 'test') return admin.testIntegration(ctx, db, id);
      return admin.updateIntegration(ctx, db, id, { name: p.name as string, kind: p.kind as never, provider: p.provider as string, domain: p.domain as string, endpoint: p.endpoint as string, scopes: p.scopes as string[] | undefined, settings: p.settings as Record<string, unknown> | undefined, status: p.status as never, health: p.health as never });
    },
  },
  credentials: {
    list: (db, ws) => control.listCredentials(db, ws),
    get: (db, ws, id) => control.getCredential(db, ws, id),
    create: (ctx, db, b) => control.createCredential(ctx, db, { name: String(b.name ?? ''), kind: b.kind as never, provider: b.provider as string, secret: b.secret as string, scopes: b.scopes as string[] | undefined, agentIds: b.agentIds as string[] | undefined, expiresAt: b.expiresAt as string }),
    update: (ctx, db, id, p) => control.updateCredential(ctx, db, id, { name: p.name as string, kind: p.kind as never, provider: p.provider as string, scopes: p.scopes as string[] | undefined, agentIds: p.agentIds as string[] | undefined, status: p.status as never, expiresAt: p.expiresAt as string }),
    remove: (ctx, db, id) => control.deleteCredential(ctx, db, id),
  },
  tools: {
    list: (db, ws, q) => control.listTools(db, ws, q.q),
    get: (db, ws, id) => control.getTool(db, ws, id),
    create: (ctx, db, b) => control.createTool(ctx, db, { name: String(b.name ?? ''), description: b.description as string, capability: b.capability as string, inputs: b.inputs as string[] | undefined, permission: b.permission as string, auth: b.auth as string, risk: b.risk as never, cost: b.cost as string, availability: b.availability as string, owner: b.owner as string, agentAccess: b.agentAccess as boolean | undefined, humanAccess: b.humanAccess as boolean | undefined }),
    update: (ctx, db, id, p) => control.updateTool(ctx, db, id, { name: p.name as string, description: p.description as string, capability: p.capability as string, inputs: p.inputs as string[] | undefined, permission: p.permission as string, auth: p.auth as string, risk: p.risk as never, cost: p.cost as string, availability: p.availability as string, owner: p.owner as string, agentAccess: p.agentAccess as boolean | undefined, humanAccess: p.humanAccess as boolean | undefined }),
    remove: (ctx, db, id) => control.deleteTool(ctx, db, id),
  },
  providerConfigs: {
    list: (db, ws) => admin.listProviderConfigs(db, ws),
    update: (ctx, db, id, p) => admin.updateProviderConfig(ctx, db, String(p.kind ?? 'chat') as never, { provider: p.provider as string, enabled: p.enabled as boolean, settings: p.settings as Record<string, unknown> }),
  },
  notifications: {
    list: (db, ws, _q, bag) => misc.listNotifications(db, ws, bag.ctx.user.id, false, 40),
    update: (ctx, db, id, p) => {
      if (String(p.op ?? '') === 'read') return misc.setNotificationRead(ctx, db, id, true);
      return db.notifications.find((n) => n.id === id && n.workspaceId === ctx.workspaceId) ?? { error: 'not found' };
    },
  },
  conversations: {
    list: (db, ws, _q, bag) => misc.listConversations(db, ws, bag.ctx.user.id),
  },
  humans: {
    list: (db, ws, q) => human.listHumans(db, ws, q.q),
    create: (ctx, db, b) => human.createHuman(ctx, db, { name: String(b.name ?? ''), role: String(b.role ?? ''), email: b.email as string, status: b.status as never, focus: b.focus as string, skills: b.skills as string[] | undefined, aiAssist: b.aiAssist as string[] | undefined }),
    get: (db, ws, id) => db.humans.find((h) => h.id === id && h.workspaceId === ws) ?? { error: 'not found' },
    update: (ctx, db, id, p) => human.updateHuman(ctx, db, id, { name: p.name as string, role: p.role as string, email: p.email as string, status: p.status as never, focus: p.focus as string, skills: p.skills as string[] | undefined, aiAssist: p.aiAssist as string[] | undefined }),
    remove: (ctx, db, id) => human.deleteHuman(ctx, db, id),
  },
  insights: {
    list: (db, ws, q) => human.listInsights(db, ws, { source: q.source as never, q: q.q }),
    create: (ctx, db, b) => human.setInsight(ctx, db, { title: String(b.title ?? ''), body: String(b.body ?? ''), source: b.source as never, tags: b.tags as string[] | undefined }),
    get: (db, ws, id) => db.insights.find((i) => i.id === id && i.workspaceId === ws) ?? { error: 'not found' },
    remove: (ctx, db, id) => human.deleteInsight(ctx, db, id),
  },
  teams: {
    list: (db, ws) => admin.listTeams(db, ws),
    create: (ctx, db, b) => admin.createTeam(ctx, db, { name: String(b.name ?? ''), memberIds: b.memberIds as string[] | undefined }),
    get: (db, ws, id) => db.teams.find((t) => t.id === id && t.workspaceId === ws) ?? { error: 'not found' },
    update: (ctx, db, id, p) => admin.updateTeam(ctx, db, id, { name: p.name as string, memberIds: p.memberIds as string[] | undefined }),
    remove: (ctx, db, id) => admin.deleteTeam(ctx, db, id),
  },
};

export function collectionNames(): string[] {
  return Object.keys(crud);
}

export function requireCollection(name: string): CrudDef {
  const def = crud[name];
  if (!def) throw { code: 'NOT_FOUND', status: 404, message: `Unknown collection "${name}"` };
  return def;
}