import { DB, Ctx, Role } from './types';
import {
  createTask, updateTask, deleteTask as deleteTaskRow,
} from './engine/work';
import { createProject } from './engine/work';
import { createCustomer } from './engine/crm';
import { createDeal, updateDeal } from './engine/crm';
import { createCampaign } from './engine/marketing';
import { createPost, publishPost, sendEmail, createEmail } from './engine/marketing';
import { createDocument, searchDocuments, createKnowledge, saveContent, getDocument } from './engine/docs';
import { runGeneration, requestApproval } from './engine/misc';
import { createInvoice, setInvoiceStatus, createTransaction, listTransactions } from './engine/finance';
import { createEvent } from './engine/misc';
import { createWorkflow } from './engine/admin';
import { notify } from './engine/core';
import { globalSearch } from './search';
import { computeInsights } from './analytics';
import { optStr, num } from './engine/core';

export interface ActionResult {
  ok: boolean;
  summary: string;
  id?: string;
  data?: Record<string, unknown>;
}

export interface ActionParam {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
}

export interface UniversalAction {
  id: string;
  label: string;
  description: string;
  category: string;
  params: ActionParam[];
  minRole?: Role;
  run: (ctx: Ctx, db: DB, params: Record<string, unknown>) => ActionResult;
}

export type ActionResult_ = ActionResult;

const registry: UniversalAction[] = [];

export function registerAction(a: UniversalAction): void {
  registry.push(a);
}

export function listActions(_ctx: Ctx, db: DB, category?: string): UniversalAction[] {
  return registry
    .filter((a) => a.id !== 'run_workflow' || db.workflows.some((w) => w.enabled))
    .filter((a) => (category ? a.category === category : true));
}

export function getAction(id: string): UniversalAction | undefined {
  return registry.find((a) => a.id === id);
}

function s(v: unknown, def = ''): string {
  return v === undefined ? def : String(v);
}
function n(v: unknown, def = 0): number {
  return num(v, def);
}
function b(v: unknown, def = false): boolean {
  return v === true || v === 'true' || v === '1' ? true : v === false || v === 'false' || v === '0' ? false : def;
}

// ---------- work ----------

registerAction({
  id: 'create_task',
  label: 'Create task',
  description: 'Create a new task in the workspace.',
  category: 'work',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'description', label: 'Description', type: 'string' },
    { name: 'priority', label: 'Priority', type: 'string' },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'assigneeId', label: 'Assignee', type: 'string' },
    { name: 'dueDate', label: 'Due date', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const t = createTask(ctx, db, {
      title: s(p.title),
      description: optStr(p.description),
      priority: s(p.priority, 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      status: s(p.status, 'todo') as 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled',
      assigneeId: optStr(p.assigneeId),
      dueDate: optStr(p.dueDate),
    });
    return { ok: true, summary: `Created task "${t.title}"`, id: t.id };
  },
});

registerAction({
  id: 'update_task',
  label: 'Update task',
  description: 'Change a task status, priority, or other fields.',
  category: 'work',
  params: [
    { name: 'taskId', label: 'Task ID', type: 'string', required: true },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'priority', label: 'Priority', type: 'string' },
    { name: 'title', label: 'Title', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const t = updateTask(ctx, db, s(p.taskId), {
      status: optStr(p.status) as never,
      priority: optStr(p.priority) as never,
      title: p.title !== undefined ? s(p.title) : undefined,
    });
    return { ok: true, summary: `Updated task "${t.title}"`, id: t.id };
  },
});

registerAction({
  id: 'complete_task',
  label: 'Complete task',
  description: 'Mark a task as completed.',
  category: 'work',
  params: [{ name: 'taskId', label: 'Task ID', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const t = updateTask(ctx, db, s(p.taskId), { status: 'completed' });
    return { ok: true, summary: `Completed task "${t.title}"`, id: t.id };
  },
});

registerAction({
  id: 'delete_task',
  label: 'Delete task',
  description: 'Permanently delete a task.',
  category: 'work',
  minRole: 'manager',
  params: [{ name: 'taskId', label: 'Task ID', type: 'string', required: true }],
  run: (ctx, db, p) => {
    deleteTaskRow(ctx, db, s(p.taskId));
    return { ok: true, summary: 'Deleted task' };
  },
});

registerAction({
  id: 'create_project',
  label: 'Create project',
  description: 'Create a new project.',
  category: 'work',
  params: [
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'description', label: 'Description', type: 'string' },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'deadline', label: 'Deadline', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const pr = createProject(ctx, db, {
      name: s(p.name),
      description: optStr(p.description),
      status: s(p.status, 'planning') as never,
      deadline: optStr(p.deadline),
    });
    return { ok: true, summary: `Created project "${pr.name}"`, id: pr.id };
  },
});

// ---------- crm ----------

registerAction({
  id: 'create_customer',
  label: 'Create customer',
  description: 'Create a customer or contact record.',
  category: 'crm',
  params: [
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'email', label: 'Email', type: 'string' },
    { name: 'company', label: 'Company', type: 'string' },
    { name: 'type', label: 'Type', type: 'string' },
    { name: 'tags', label: 'Tags', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const c = createCustomer(ctx, db, {
      name: s(p.name),
      email: optStr(p.email),
      company: optStr(p.company),
      type: s(p.type) === 'company' ? 'company' : 'contact',
      tags: s(p.tags).split(',').map((t) => t.trim()).filter(Boolean),
    });
    return { ok: true, summary: `Created customer "${c.name}"`, id: c.id };
  },
});

registerAction({
  id: 'create_deal',
  label: 'Create deal',
  description: 'Create a sales opportunity.',
  category: 'crm',
  params: [
    { name: 'name', label: 'Deal name', type: 'string', required: true },
    { name: 'value', label: 'Value', type: 'number' },
    { name: 'customerId', label: 'Customer', type: 'string' },
    { name: 'stage', label: 'Stage', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const d = createDeal(ctx, db, { name: s(p.name), value: n(p.value), customerId: optStr(p.customerId), stage: s(p.stage, 'lead') as never });
    return { ok: true, summary: `Created deal "${d.name}" for ${d.value}`, id: d.id };
  },
});

registerAction({
  id: 'move_deal',
  label: 'Move deal stage',
  description: 'Change a deal stage (e.g. to won).',
  category: 'crm',
  params: [
    { name: 'dealId', label: 'Deal ID', type: 'string', required: true },
    { name: 'stage', label: 'Stage', type: 'string', required: true },
  ],
  run: (ctx, db, p) => {
    const d = updateDeal(ctx, db, s(p.dealId), { stage: s(p.stage) as never });
    return { ok: true, summary: `Deal "${d.name}" moved to ${d.stage}`, id: d.id };
  },
});

// ---------- marketing ----------

registerAction({
  id: 'create_campaign',
  label: 'Create campaign',
  description: 'Create a marketing campaign.',
  category: 'marketing',
  params: [
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'description', label: 'Description', type: 'string' },
    { name: 'channel', label: 'Channel', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const c = createCampaign(ctx, db, { name: s(p.name), description: optStr(p.description), channel: s(p.channel, 'content') });
    return { ok: true, summary: `Created campaign "${c.name}"`, id: c.id };
  },
});

registerAction({
  id: 'create_post',
  label: 'Draft social post',
  description: 'Create a social media post draft.',
  category: 'marketing',
  params: [
    { name: 'platform', label: 'Platform', type: 'string', required: true },
    { name: 'text', label: 'Text', type: 'string', required: true },
    { name: 'campaignId', label: 'Campaign', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const post = createPost(ctx, db, { platform: s(p.platform), text: s(p.text), campaignId: optStr(p.campaignId) });
    return { ok: true, summary: `Drafted post for ${post.platform}`, id: post.id };
  },
});

registerAction({
  id: 'publish_post',
  label: 'Publish post',
  description: 'Publish an existing social post.',
  category: 'marketing',
  minRole: 'manager',
  params: [{ name: 'postId', label: 'Post ID', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const post = publishPost(ctx, db, s(p.postId));
    return { ok: true, summary: `Published post on ${post.platform}`, id: post.id };
  },
});

registerAction({
  id: 'send_email',
  label: 'Send email',
  description: 'Send an email to a recipient.',
  category: 'marketing',
  minRole: 'manager',
  params: [
    { name: 'to', label: 'To', type: 'string', required: true },
    { name: 'subject', label: 'Subject', type: 'string', required: true },
    { name: 'body', label: 'Body', type: 'string', required: true },
  ],
  run: (ctx, db, p) => {
    const email = createEmail(ctx, db, { to: s(p.to), subject: s(p.subject), body: s(p.body) });
    const sent = sendEmail(ctx, db, email.id);
    return { ok: true, summary: `Sent "${sent.subject}" to ${sent.to}`, id: sent.id };
  },
});

// ---------- docs & content ----------

registerAction({
  id: 'create_document',
  label: 'Create document',
  description: 'Create a text document (e.g. notes, contracts, briefs).',
  category: 'docs',
  params: [
    { name: 'name', label: 'File name', type: 'string', required: true },
    { name: 'text', label: 'Text', type: 'string' },
    { name: 'folder', label: 'Folder', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const doc = createDocument(ctx, db, { name: s(p.name), kind: 'txt', text: s(p.text), folder: optStr(p.folder) });
    return { ok: true, summary: `Created document "${doc.name}"`, id: doc.id };
  },
});

registerAction({
  id: 'search_documents',
  label: 'Search documents',
  description: 'Search uploaded documents by their extracted text.',
  category: 'docs',
  params: [{ name: 'query', label: 'Query', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const results = searchDocuments(db, ctx.workspaceId, s(p.query)).map((r) => ({
      documentId: r.id, name: r.name, snippet: r.snippet,
    }));
    return { ok: true, summary: `Found ${results.length} document match(es)`, data: { results } };
  },
});

registerAction({
  id: 'create_knowledge',
  label: 'Save knowledge',
  description: 'Save a note, process, or instruction to the knowledge base.',
  category: 'docs',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'content', label: 'Content', type: 'string', required: true },
    { name: 'kind', label: 'Kind', type: 'string' },
    { name: 'tags', label: 'Tags', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const k = createKnowledge(ctx, db, { title: s(p.title), content: s(p.content), kind: s(p.kind, 'note'), tags: s(p.tags).split(',').map((t) => t.trim()).filter(Boolean) });
    return { ok: true, summary: `Saved knowledge "${k.title}"`, id: k.id };
  },
});

registerAction({
  id: 'save_content',
  label: 'Save content',
  description: 'Save generated text as a content record.',
  category: 'ai',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'body', label: 'Body', type: 'string', required: true },
    { name: 'kind', label: 'Kind', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const c = saveContent(ctx, db, { title: s(p.title), body: s(p.body), kind: s(p.kind, 'article') });
    return { ok: true, summary: `Saved content "${c.title}"`, id: c.id };
  },
});

// ---------- AI generation ----------

registerAction({
  id: 'generate_content',
  label: 'Generate content',
  description: 'Generate text content based on a prompt.',
  category: 'ai',
  params: [{ name: 'prompt', label: 'Prompt', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const { generation } = runGeneration(ctx, db, { kind: 'content', prompt: s(p.prompt) });
    return { ok: true, summary: 'Generated content draft', id: generation.id, data: { text: generation.result } };
  },
});

registerAction({
  id: 'generate_image',
  label: 'Generate image',
  description: 'Generate an image from a description.',
  category: 'ai',
  params: [{ name: 'prompt', label: 'Prompt', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const { generation } = runGeneration(ctx, db, { kind: 'image', prompt: s(p.prompt) });
    return { ok: true, summary: 'Generated image preview', id: generation.id, data: { image: generation.result } };
  },
});

// ---------- finance ----------

registerAction({
  id: 'record_transaction',
  label: 'Record transaction',
  description: 'Record an income or expense.',
  category: 'finance',
  params: [
    { name: 'type', label: 'Type', type: 'string', required: true },
    { name: 'description', label: 'Description', type: 'string', required: true },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
  ],
  run: (ctx, db, p) => {
    const t = createTransaction(ctx, db, { type: s(p.type) === 'income' ? 'income' : 'expense', description: s(p.description), amount: n(p.amount) });
    return { ok: true, summary: `Recorded ${t.type} of ${t.amount} (${t.description})`, id: t.id };
  },
});

registerAction({
  id: 'create_invoice',
  label: 'Create invoice',
  description: 'Create a draft invoice (provide lines as JSON string).',
  category: 'finance',
  params: [
    { name: 'customerId', label: 'Customer', type: 'string' },
    { name: 'lines', label: 'Lines (JSON)', type: 'string', required: true },
    { name: 'dueDate', label: 'Due date', type: 'string' },
  ],
  run: (ctx, db, p) => {
    let lines: unknown = [];
    try {
      lines = JSON.parse(s(p.lines, '[]'));
    } catch {
      return { ok: false, summary: 'Invalid lines JSON. Expected [{"description": "...", "qty": 1, "price": 100}]' };
    }
    const inv = createInvoice(ctx, db, { customerId: optStr(p.customerId), lines: (lines as { description: string; qty: number; price: number }[]), dueDate: optStr(p.dueDate) });
    return { ok: true, summary: `Created ${inv.number}`, id: inv.id };
  },
});

registerAction({
  id: 'mark_invoice_paid',
  label: 'Mark invoice paid',
  description: 'Mark an invoice as paid (records income).',
  category: 'finance',
  minRole: 'manager',
  params: [{ name: 'invoiceId', label: 'Invoice ID', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const inv = setInvoiceStatus(ctx, db, s(p.invoiceId), 'paid');
    return { ok: true, summary: `${inv.number} marked as paid`, id: inv.id };
  },
});

// ---------- calendar ----------

registerAction({
  id: 'create_event',
  label: 'Create event',
  description: 'Create a calendar event or reminder.',
  category: 'calendar',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'start', label: 'Start (ISO)', type: 'string', required: true },
    { name: 'end', label: 'End (ISO)', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const e = createEvent(ctx, db, { title: s(p.title), start: s(p.start), end: optStr(p.end) });
    return { ok: true, summary: `Created event "${e.title}"`, id: e.id };
  },
});

// ---------- automation ----------

registerAction({
  id: 'create_workflow',
  label: 'Create automation',
  description: 'Create an automation workflow.',
  category: 'automation',
  minRole: 'manager',
  params: [
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'description', label: 'Description', type: 'string' },
    { name: 'trigger', label: 'Trigger type', type: 'string', required: true },
  ],
  run: (ctx, db, p) => {
    const w = createWorkflow(ctx, db, { name: s(p.name), description: optStr(p.description), trigger: { type: s(p.trigger, 'manual') }, steps: [] });
    return { ok: true, summary: `Created automation "${w.name}"`, id: w.id };
  },
});

registerAction({
  id: 'request_approval',
  label: 'Request approval',
  description: 'Request a human approval for an action.',
  category: 'automation',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'detail', label: 'Detail', type: 'string', required: true },
  ],
  run: (ctx, db, p) => {
    const a = requestApproval(ctx, db, { title: s(p.title), detail: s(p.detail) });
    return { ok: true, summary: `Approval requested: "${a.title}"`, id: a.id };
  },
});

// ---------- insight ----------

registerAction({
  id: 'get_analytics',
  label: 'Get analytics',
  description: 'Return real metrics (tasks, pipeline, revenue) for the workspace.',
  category: 'insight',
  params: [],
  run: (_ctx, db, _p) => {
    const ws = db.userSettings[0]?.workspaceId ?? db.workspaces[0]?.id ?? '';
    const insights = computeInsights(db, ws);
    return {
      ok: true,
      summary: 'Analytics retrieved',
      data: {
        openTasks: insights.openTasks,
        overdueTasks: insights.overdueTasks,
        pipelineTotal: insights.pipelineTotal,
        netTotal: insights.netTotal,
        incomeTotal: insights.incomeTotal,
        expenseTotal: insights.expenseTotal,
      } as Record<string, unknown>,
    };
  },
});

registerAction({
  id: 'search',
  label: 'Global search',
  description: 'Search across all records in the workspace.',
  category: 'insight',
  params: [{ name: 'query', label: 'Query', type: 'string', required: true }],
  run: (ctx, db, p) => {
    const results = globalSearch(db, ctx.workspaceId, s(p.query)).hits.map((h) => ({ type: h.type, title: h.title, link: h.link }));
    return { ok: true, summary: `Found ${results.length} result(s)`, data: { results } };
  },
});

// ---------- internal helper used by automation engine & assistant ----------

registerAction({
  id: 'notify_team',
  label: 'Notify workspace',
  description: 'Create a notification for the whole workspace.',
  category: 'communication',
  params: [
    { name: 'title', label: 'Title', type: 'string', required: true },
    { name: 'body', label: 'Body', type: 'string' },
  ],
  run: (ctx, db, p) => {
    const ids = db.workspaces.find((w) => w.id === ctx.workspaceId)?.memberIds ?? [];
    ids.forEach((id) => notify(ctx, db, id, { title: s(p.title), body: optStr(p.body), kind: 'workflow' }));
    return { ok: true, summary: `Notified ${ids.length} member(s)` };
  },
});