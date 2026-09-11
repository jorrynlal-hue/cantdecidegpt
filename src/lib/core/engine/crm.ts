import { DB, Ctx, Customer, Deal, DealStage } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity } from './core';
import { emitEvent } from '../events';

const DEAL_STAGES: DealStage[] = ['lead', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];

function okStage(v: unknown, fallback: DealStage): DealStage {
  return DEAL_STAGES.includes(v as DealStage) ? (v as DealStage) : fallback;
}

// ---------- customers ----------

export function listCustomers(db: DB, workspaceId: string, q?: string, tag?: string): Customer[] {
  const items = listRows<Customer>(db.customers, {
    workspaceId,
    q,
    searchFields: ['name', 'email', 'phone', 'company', 'notes'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (c) => (tag ? c.tags.includes(tag) : true),
  });
  return items;
}

export function getCustomer(db: DB, workspaceId: string, customerId: string): Customer {
  const c = db.customers.find((x) => x.id === customerId && x.workspaceId === workspaceId);
  if (!c) throw Error('NOT_FOUND');
  return c;
}

export interface CustomerInput {
  type: 'contact' | 'company';
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

export function createCustomer(ctx: Ctx, db: DB, input: CustomerInput): Customer {
  requireRole(ctx, 'member');
  const type: 'contact' | 'company' = input.type === 'company' ? 'company' : 'contact';
  const customer: Customer = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    type,
    name: nonEmpty(input.name, 'name'),
    email: optStr(input.email),
    phone: optStr(input.phone),
    company: optStr(input.company),
    notes: optStr(input.notes),
    tags: [...new Set((input.tags ?? []).map((t) => t.trim()).filter(Boolean))],
    activities: [],
    createdAt: now(),
    updatedAt: now(),
  };
  db.customers.push(customer);
  logActivity(ctx, db, { action: 'customer.create', result: `Created customer "${customer.name}"`, objectType: 'customer', objectId: customer.id, objectLabel: customer.name });
  emitEvent(ctx, db, 'new_customer', { customerId: customer.id, name: customer.name, type: customer.type, email: customer.email, tags: customer.tags });
  persist(db);
  return customer;
}

export function updateCustomer(ctx: Ctx, db: DB, customerId: string, patch: Partial<CustomerInput>): Customer {
  requireRole(ctx, 'member');
  const c = getCustomer(db, ctx.workspaceId, customerId);
  if (patch.type === 'contact' || patch.type === 'company') c.type = patch.type;
  if (patch.name !== undefined) c.name = nonEmpty(patch.name, 'name');
  if (patch.email !== undefined) c.email = optStr(patch.email);
  if (patch.phone !== undefined) c.phone = optStr(patch.phone);
  if (patch.company !== undefined) c.company = optStr(patch.company);
  if (patch.notes !== undefined) c.notes = optStr(patch.notes);
  if (patch.tags !== undefined) c.tags = [...new Set(patch.tags.map((t) => t.trim()).filter(Boolean))];
  c.updatedAt = now();
  logActivity(ctx, db, { action: 'customer.update', result: `Updated customer "${c.name}"`, objectType: 'customer', objectId: c.id, objectLabel: c.name });
  persist(db);
  return c;
}

export function deleteCustomer(ctx: Ctx, db: DB, customerId: string): void {
  requireRole(ctx, 'manager');
  const c = getCustomer(db, ctx.workspaceId, customerId);
  db.customers = db.customers.filter((x) => x.id !== customerId);
  db.deals.forEach((d) => {
    if (d.customerId === customerId) d.customerId = undefined;
  });
  logActivity(ctx, db, { action: 'customer.delete', result: `Deleted customer "${c.name}"`, objectType: 'customer', objectId: customerId, objectLabel: c.name });
  persist(db);
}

export function addCustomerActivity(ctx: Ctx, db: DB, customerId: string, kind: string, text: string): Customer {
  requireRole(ctx, 'member');
  const c = getCustomer(db, ctx.workspaceId, customerId);
  c.activities.push({ id: uid(), kind, text: nonEmpty(text, 'text'), at: now(), userId: ctx.user.id });
  c.updatedAt = now();
  persist(db);
  return c;
}

// ---------- deals ----------

export function listDeals(db: DB, workspaceId: string, f: { stage?: DealStage | 'all'; ownerId?: string | 'all' } = {}, q?: string): Deal[] {
  return listRows<Deal>(db.deals, {
    workspaceId,
    q,
    searchFields: ['name', 'notes'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (d) =>
      (f.stage === undefined || f.stage === 'all' || d.stage === f.stage) &&
      (f.ownerId === undefined || f.ownerId === 'all' || d.ownerId === f.ownerId),
  });
}

export function getDeal(db: DB, workspaceId: string, dealId: string): Deal {
  const d = db.deals.find((x) => x.id === dealId && x.workspaceId === workspaceId);
  if (!d) throw Error('NOT_FOUND');
  return d;
}

export interface DealInput {
  name: string;
  customerId?: string;
  value?: number;
  stage?: DealStage;
  ownerId?: string;
  expectedClose?: string;
  notes?: string;
}

export function createDeal(ctx: Ctx, db: DB, input: DealInput): Deal {
  requireRole(ctx, 'member');
  const stage = okStage(input.stage, 'lead');
  const deal: Deal = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    customerId: optStr(input.customerId),
    value: num(input.value),
    stage,
    ownerId: optStr(input.ownerId) ?? ctx.user.id,
    expectedClose: optStr(input.expectedClose),
    notes: optStr(input.notes),
    activities: [],
    createdAt: now(),
    updatedAt: now(),
  };
  db.deals.push(deal);
  logActivity(ctx, db, { action: 'deal.create', result: `Created deal "${deal.name}"`, objectType: 'deal', objectId: deal.id, objectLabel: deal.name });
  if (deal.customerId) {
    const c = db.customers.find((x) => x.id === deal.customerId && x.workspaceId === ctx.workspaceId);
    if (c) c.activities.push({ id: uid(), kind: 'deal', text: `Deal "${deal.name}" created`, at: now(), userId: ctx.user.id });
  }
  if (stage === 'lead') {
    emitEvent(ctx, db, 'new_lead', { dealId: deal.id, name: deal.name, value: deal.value, ownerId: deal.ownerId, customerId: deal.customerId });
  }
  persist(db);
  return deal;
}

export function updateDeal(ctx: Ctx, db: DB, dealId: string, patch: Partial<DealInput>): Deal {
  requireRole(ctx, 'member');
  const d = getDeal(db, ctx.workspaceId, dealId);
  const fromStage = d.stage;
  if (patch.name !== undefined) d.name = nonEmpty(patch.name, 'name');
  if (patch.customerId !== undefined) d.customerId = optStr(patch.customerId);
  if (patch.value !== undefined) d.value = num(patch.value);
  if (patch.stage !== undefined) d.stage = okStage(patch.stage, d.stage);
  if (patch.ownerId !== undefined) d.ownerId = optStr(patch.ownerId) ?? d.ownerId;
  if (patch.expectedClose !== undefined) d.expectedClose = optStr(patch.expectedClose);
  if (patch.notes !== undefined) d.notes = optStr(patch.notes);
  d.updatedAt = now();
  logActivity(ctx, db, { action: 'deal.update', result: `Updated deal "${d.name}" (${fromStage} → ${d.stage})`, objectType: 'deal', objectId: d.id, objectLabel: d.name });
  if (d.customerId) {
    const c = db.customers.find((x) => x.id === d.customerId && x.workspaceId === ctx.workspaceId);
    if (c) c.activities.push({ id: uid(), kind: 'deal', text: `Deal stage changed to "${d.stage}"`, at: now(), userId: ctx.user.id });
  }
  if (fromStage !== 'won' && d.stage === 'won') {
    emitEvent(ctx, db, 'deal_won', { dealId: d.id, name: d.name, value: d.value, customerId: d.customerId });
  }
  if (fromStage !== 'lead' && d.stage === 'lead') {
    emitEvent(ctx, db, 'new_lead', { dealId: d.id, name: d.name, value: d.value, ownerId: d.ownerId, customerId: d.customerId });
  }
  persist(db);
  return d;
}

export function deleteDeal(ctx: Ctx, db: DB, dealId: string): void {
  requireRole(ctx, 'manager');
  const d = getDeal(db, ctx.workspaceId, dealId);
  db.deals = db.deals.filter((x) => x.id !== dealId);
  logActivity(ctx, db, { action: 'deal.delete', result: `Deleted deal "${d.name}"`, objectType: 'deal', objectId: dealId, objectLabel: d.name });
  persist(db);
}