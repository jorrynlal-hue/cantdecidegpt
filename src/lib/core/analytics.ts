import { DB } from './types';
import { invoiceTotal, isInvoiceOverdue } from './engine/finance';

export interface Insights {
  tasksByStatus: Record<string, number>;
  openTasks: number;
  overdueTasks: number;
  projectsByStatus: Record<string, number>;
  pipelineByStage: { stage: string; count: number; value: number }[];
  pipelineTotal: number;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  revenueSeries: { month: string; income: number; expense: number }[];
  campaignSent: number;
  campaignRevenue: number;
  invoicesByStatus: Record<string, number>;
  overdueInvoiceValue: number;
  contentCount: number;
  knowledgeCount: number;
  docsCount: number;
  activeAutomations: number;
  generationCount: number;
  notificationsOpen: Record<string, number>;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[(m || 1) - 1]} ${y}`;
}

function lastMonths(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(monthKey(dt.toISOString()));
  }
  return keys;
}

export function computeInsights(db: DB, workspaceId: string): Insights {
  const tasks = db.tasks.filter((t) => t.workspaceId === workspaceId);
  const projects = db.projects.filter((p) => p.workspaceId === workspaceId);
  const deals = db.deals.filter((d) => d.workspaceId === workspaceId);
  const txns = db.transactions.filter((t) => t.workspaceId === workspaceId);
  const invoices = db.invoices.filter((i) => i.workspaceId === workspaceId);
  const campaigns = db.campaigns.filter((c) => c.workspaceId === workspaceId);

  const tasksByStatus: Record<string, number> = {};
  tasks.forEach((t) => (tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1));
  const openTasks = tasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const overdueTasks = tasks.filter((t) => t.dueDate && !['completed', 'cancelled'].includes(t.status) && new Date(t.dueDate) < new Date()).length;

  const projectsByStatus: Record<string, number> = {};
  projects.forEach((p) => (projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1));

  const stageOrder = ['lead', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
  const pipelineByStage = stageOrder.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage);
    return { stage, count: inStage.length, value: inStage.reduce((a, d) => a + d.value, 0) };
  });
  const pipelineTotal = deals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((a, d) => a + d.value, 0);

  const incomeTotal = txns.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenseTotal = txns.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const netTotal = incomeTotal - expenseTotal;

  const revenueSeries = lastMonths(6).map((key) => ({
    month: monthLabel(key),
    income: txns.filter((t) => t.type === 'income' && monthKey(t.date) === key).reduce((a, t) => a + t.amount, 0),
    expense: txns.filter((t) => t.type === 'expense' && monthKey(t.date) === key).reduce((a, t) => a + t.amount, 0),
  }));

  const campaignSent = campaigns.reduce((a, c) => a + c.metrics.sent, 0);
  const campaignRevenue = campaigns.reduce((a, c) => a + c.metrics.revenue, 0);

  const invoicesByStatus: Record<string, number> = {};
  invoices.forEach((i) => (invoicesByStatus[i.status] = (invoicesByStatus[i.status] ?? 0) + 1));
  const overdueInvoiceValue = invoices.filter(isInvoiceOverdue).reduce((a, i) => a + invoiceTotal(i), 0);

  const notificationsOpen: Record<string, number> = {};
  db.notifications
    .filter((n) => n.workspaceId === workspaceId && !n.read)
    .forEach((n) => (notificationsOpen[n.kind] = (notificationsOpen[n.kind] ?? 0) + 1));

  return {
    tasksByStatus,
    openTasks,
    overdueTasks,
    projectsByStatus,
    pipelineByStage,
    pipelineTotal,
    incomeTotal,
    expenseTotal,
    netTotal,
    revenueSeries,
    campaignSent,
    campaignRevenue,
    invoicesByStatus,
    overdueInvoiceValue,
    contentCount: db.content.filter((c) => c.workspaceId === workspaceId).length,
    knowledgeCount: db.knowledge.filter((k) => k.workspaceId === workspaceId).length,
    docsCount: db.documents.filter((d) => d.workspaceId === workspaceId).length,
    activeAutomations: db.workflows.filter((w) => w.workspaceId === workspaceId && w.enabled).length,
    generationCount: db.generations.filter((g) => g.workspaceId === workspaceId).length,
    notificationsOpen,
  };
}

export interface InsightNote {
  severity: 'info' | 'warn' | 'good';
  text: string;
}

// Derived rules from real data — never fabricated.
export function deriveInsightNotes(insights: Insights): InsightNote[] {
  const notes: InsightNote[] = [];
  if (insights.overdueTasks > 0) notes.push({ severity: 'warn', text: `${insights.overdueTasks} open task(s) are past their due date.` });
  if (insights.netTotal >= 0) notes.push({ severity: 'good', text: `Net balance is positive (${insights.netTotal.toFixed(2)}).` });
  else notes.push({ severity: 'warn', text: `Net balance is negative (${insights.netTotal.toFixed(2)}).` });
  if (insights.overdueInvoiceValue > 0) notes.push({ severity: 'warn', text: `${insights.overdueInvoiceValue.toFixed(2)} in invoices are overdue.` });
  const won = insights.pipelineByStage.find((s) => s.stage === 'won')?.value ?? 0;
  const open = insights.pipelineTotal;
  if (won > 0 || open > 0) notes.push({ severity: 'info', text: `Pipeline holds ${open.toFixed(2)} in open value with ${won.toFixed(2)} won to date.` });
  if (insights.openTasks === 0) notes.push({ severity: 'good', text: 'No open tasks — everything is resolved.' });
  if (insights.activeAutomations === 0) notes.push({ severity: 'info', text: 'No automations are currently enabled.' });
  if (notes.length === 0) notes.push({ severity: 'info', text: 'Create real records and they will be analyzed here.' });
  return notes;
}

export function recentActivities(db: DB, workspaceId: string, limit = 30) {
  return db.activities.filter((a) => a.workspaceId === workspaceId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}