import { DB, Ctx, Transaction, Invoice, InvoiceLine, TxnCategory, InvoiceStatus, TxnType } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity, notify } from './core';

const INV_STATUS: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

function okInvoiceStatus(v: unknown, fallback: InvoiceStatus): InvoiceStatus {
  return INV_STATUS.includes(v as InvoiceStatus) ? (v as InvoiceStatus) : fallback;
}

export function invoiceSubtotal(inv: Invoice): number {
  return inv.lines.reduce((acc, l) => acc + l.qty * l.price, 0);
}
export function invoiceTotal(inv: Invoice): number {
  const sub = invoiceSubtotal(inv);
  const afterDiscount = sub * (1 - (inv.discountPct || 0) / 100);
  return Math.round((afterDiscount * (1 + (inv.taxPct || 0) / 100)) * 100) / 100;
}
export function isInvoiceOverdue(inv: Invoice): boolean {
  if (inv.status !== 'sent') return false;
  if (!inv.dueDate) return false;
  return new Date(inv.dueDate) < new Date();
}

export function invoiceNumber(db: DB, workspaceId: string): string {
  const byWorkspace = db.invoices.filter((i) => i.workspaceId === workspaceId).length;
  return `INV-${String(byWorkspace + 1).padStart(4, '0')}`;
}

// ---------- transactions ----------

export interface TxnFilters {
  type?: TxnType | 'all';
  categoryId?: string | 'all';
  q?: string;
}

export function listTransactions(db: DB, workspaceId: string, f: TxnFilters = {}): Transaction[] {
  return listRows<Transaction>(db.transactions, {
    workspaceId,
    q: f.q,
    searchFields: ['description'],
    sortBy: 'date',
    sortDir: 'desc',
    filter: (t) =>
      (f.type === undefined || f.type === 'all' || t.type === f.type) &&
      (f.categoryId === undefined || f.categoryId === 'all' || t.categoryId === f.categoryId),
  });
}

export interface TxnInput {
  type: TxnType;
  description: string;
  amount: number;
  categoryId?: string;
  date?: string;
  invoiceId?: string;
}

export function createTransaction(ctx: Ctx, db: DB, input: TxnInput): Transaction {
  requireRole(ctx, 'member');
  const type: TxnType = input.type === 'income' ? 'income' : 'expense';
  const amount = num(input.amount);
  if (!(amount > 0)) throw Error('INVALID_AMOUNT');
  const txn: Transaction = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    type,
    description: nonEmpty(input.description, 'description'),
    amount,
    categoryId: optStr(input.categoryId),
    date: input.date || now().slice(0, 10),
    invoiceId: optStr(input.invoiceId),
    createdBy: ctx.user.id,
    createdAt: now(),
  };
  db.transactions.push(txn);
  logActivity(ctx, db, { action: 'transaction.create', result: `${type === 'income' ? 'Income' : 'Expense'} of ${amount} recorded (${txn.description})`, objectType: 'transaction', objectId: txn.id, objectLabel: txn.description });
  persist(db);
  return txn;
}

export function deleteTransaction(ctx: Ctx, db: DB, txnId: string): void {
  requireRole(ctx, 'manager');
  const t = db.transactions.find((x) => x.id === txnId && x.workspaceId === ctx.workspaceId);
  if (!t) throw Error('NOT_FOUND');
  db.transactions = db.transactions.filter((x) => x.id !== txnId);
  logActivity(ctx, db, { action: 'transaction.delete', result: `Deleted ${t.type} ${t.description}`, objectType: 'transaction', objectId: txnId });
  persist(db);
}

export function listCategories(db: DB, workspaceId: string): TxnCategory[] {
  return db.txnCategories.filter((c) => c.workspaceId === workspaceId);
}

export function createCategory(ctx: Ctx, db: DB, input: { name: string; type: TxnType }): TxnCategory {
  requireRole(ctx, 'manager');
  const name = nonEmpty(input.name, 'name');
  if (db.txnCategories.some((c) => c.workspaceId === ctx.workspaceId && c.name.toLowerCase() === name.toLowerCase())) {
    throw Error('CATEGORY_EXISTS');
  }
  const cat: TxnCategory = { id: uid(), workspaceId: ctx.workspaceId, name, type: input.type === 'income' ? 'income' : 'expense' };
  db.txnCategories.push(cat);
  persist(db);
  return cat;
}

// ---------- invoices ----------

export function listInvoices(db: DB, workspaceId: string, f: { status?: InvoiceStatus | 'all'; q?: string } = {}): Invoice[] {
  return listRows<Invoice>(db.invoices, {
    workspaceId,
    q: f.q,
    searchFields: ['number', 'notes'],
    sortBy: 'createdAt',
    sortDir: 'desc',
    filter: (i) => (f.status === undefined || f.status === 'all' || i.status === f.status),
  });
}

export function getInvoice(db: DB, workspaceId: string, invoiceId: string): Invoice {
  const v = db.invoices.find((x) => x.id === invoiceId && x.workspaceId === workspaceId);
  if (!v) throw Error('NOT_FOUND');
  return v;
}

export interface InvoiceInput {
  customerId?: string;
  lines: Omit<InvoiceLine, 'id'>[];
  taxPct?: number;
  discountPct?: number;
  dueDate?: string;
  notes?: string;
}

export function createInvoice(ctx: Ctx, db: DB, input: InvoiceInput): Invoice {
  requireRole(ctx, 'member');
  if (!input.lines?.length) throw Error('NO_LINES');
  const lines: InvoiceLine[] = input.lines.map((l) => ({ id: uid(), description: nonEmpty(l.description, 'line description'), qty: num(l.qty, 1), price: num(l.price) }));
  const inv: Invoice = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    number: invoiceNumber(db, ctx.workspaceId),
    customerId: optStr(input.customerId),
    lines,
    taxPct: Math.max(0, num(input.taxPct)),
    discountPct: Math.max(0, Math.min(100, num(input.discountPct))),
    dueDate: optStr(input.dueDate),
    notes: optStr(input.notes),
    status: 'draft',
    createdAt: now(),
    updatedAt: now(),
  };
  db.invoices.push(inv);
  logActivity(ctx, db, { action: 'invoice.create', result: `Created ${inv.number} for ${invoiceTotal(inv)}`, objectType: 'invoice', objectId: inv.id, objectLabel: inv.number });
  persist(db);
  return inv;
}

export function updateInvoice(ctx: Ctx, db: DB, invoiceId: string, patch: Partial<InvoiceInput>): Invoice {
  requireRole(ctx, 'member');
  const inv = getInvoice(db, ctx.workspaceId, invoiceId);
  if (patch.customerId !== undefined) inv.customerId = optStr(patch.customerId);
  if (patch.lines !== undefined) inv.lines = patch.lines.map((l) => ({ id: uid(), description: nonEmpty(l.description, 'line description'), qty: num(l.qty, 1), price: num(l.price) }));
  if (patch.taxPct !== undefined) inv.taxPct = Math.max(0, num(patch.taxPct));
  if (patch.discountPct !== undefined) inv.discountPct = Math.max(0, Math.min(100, num(patch.discountPct)));
  if (patch.dueDate !== undefined) inv.dueDate = optStr(patch.dueDate);
  if (patch.notes !== undefined) inv.notes = optStr(patch.notes);
  inv.updatedAt = now();
  persist(db);
  return inv;
}

export function setInvoiceStatus(ctx: Ctx, db: DB, invoiceId: string, status: InvoiceStatus): Invoice {
  requireRole(ctx, 'manager');
  const inv = getInvoice(db, ctx.workspaceId, invoiceId);
  const target = okInvoiceStatus(status, inv.status);
  const from = inv.status;
  inv.status = target;
  inv.updatedAt = now();
  logActivity(ctx, db, { action: 'invoice.status', result: `Invoice ${inv.number} changed from ${from} to ${target}`, objectType: 'invoice', objectId: inv.id, objectLabel: inv.number });
  if (target === 'paid') {
    const txn = createTransaction(ctx, db, { type: 'income', description: `Payment for ${inv.number}`, amount: invoiceTotal(inv), invoiceId: inv.id, date: now().slice(0, 10) });
    logActivity(ctx, db, { action: 'invoice.paid', result: `Payment recorded (${txn.amount}) for ${inv.number}`, objectType: 'invoice', objectId: inv.id, objectLabel: inv.number });
    const creator = db.users.find((u) => u.id === ctx.user.id);
    if (creator) notify(ctx, db, creator.id, { title: `${inv.number} marked as paid`, body: `${invoiceTotal(inv)} recorded as income`, kind: 'finance', link: `/finance/invoices/${inv.id}` });
  }
  persist(db);
  return inv;
}

export function deleteInvoice(ctx: Ctx, db: DB, invoiceId: string): void {
  requireRole(ctx, 'manager');
  const inv = getInvoice(db, ctx.workspaceId, invoiceId);
  db.invoices = db.invoices.filter((x) => x.id !== invoiceId);
  db.transactions.forEach((t) => {
    if (t.invoiceId === invoiceId && t.type === 'income') t.invoiceId = undefined;
  });
  logActivity(ctx, db, { action: 'invoice.delete', result: `Deleted ${inv.number}`, objectType: 'invoice', objectId: invoiceId, objectLabel: inv.number });
  persist(db);
}