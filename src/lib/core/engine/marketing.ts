import { DB, Ctx, Campaign, SocialPost, EmailMessage, EmailTemplate, CampaignStatus, PostStatus, EmailStatus } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity } from './core';
import { deliverEmail, publishSocial } from '../providers';

const CAMP_STATUS: CampaignStatus[] = ['draft', 'planning', 'active', 'paused', 'completed'];
const POST_STATUS: PostStatus[] = ['draft', 'scheduled', 'published', 'failed'];
const EMAIL_STATUS: EmailStatus[] = ['draft', 'scheduled', 'sent', 'failed'];

function okFrom<T extends string>(v: unknown, fallback: T, allowed: T[]): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

// ---------- campaigns ----------

export function listCampaigns(db: DB, workspaceId: string, f: { status?: CampaignStatus | 'all' } = {}, q?: string): Campaign[] {
  return listRows<Campaign>(db.campaigns, {
    workspaceId,
    q,
    searchFields: ['name', 'description'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (c) => (f.status === undefined || f.status === 'all' || c.status === f.status),
  });
}

export function getCampaign(db: DB, workspaceId: string, campaignId: string): Campaign {
  const c = db.campaigns.find((x) => x.id === campaignId && x.workspaceId === workspaceId);
  if (!c) throw Error('NOT_FOUND');
  return c;
}

export interface CampaignInput {
  name: string;
  description?: string;
  channel?: string;
  status?: CampaignStatus;
  audienceIds?: string[];
  contentIds?: string[];
  schedule?: string;
  budget?: number;
}

export function createCampaign(ctx: Ctx, db: DB, input: CampaignInput): Campaign {
  requireRole(ctx, 'member');
  const channel = input.channel === 'social' || input.channel === 'email' || input.channel === 'content' || input.channel === 'ads' || input.channel === 'other' ? input.channel : 'content';
  const campaign: Campaign = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    description: optStr(input.description),
    channel,
    status: okFrom<CampaignStatus>(input.status, 'draft', CAMP_STATUS),
    audienceIds: input.audienceIds ?? [],
    contentIds: input.contentIds ?? [],
    schedule: optStr(input.schedule),
    budget: num(input.budget, 0),
    metrics: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
    createdAt: now(),
    updatedAt: now(),
  };
  db.campaigns.push(campaign);
  logActivity(ctx, db, { action: 'campaign.create', result: `Created campaign "${campaign.name}"`, objectType: 'campaign', objectId: campaign.id, objectLabel: campaign.name });
  persist(db);
  return campaign;
}

export function updateCampaign(ctx: Ctx, db: DB, campaignId: string, patch: Partial<CampaignInput>): Campaign {
  requireRole(ctx, 'member');
  const c = getCampaign(db, ctx.workspaceId, campaignId);
  if (patch.name !== undefined) c.name = nonEmpty(patch.name, 'name');
  if (patch.description !== undefined) c.description = optStr(patch.description);
  if (patch.status !== undefined) c.status = okFrom<CampaignStatus>(patch.status, c.status, CAMP_STATUS);
  if (patch.channel !== undefined) c.channel = c.channel;
  if (patch.audienceIds !== undefined) c.audienceIds = patch.audienceIds;
  if (patch.contentIds !== undefined) c.contentIds = patch.contentIds;
  if (patch.schedule !== undefined) c.schedule = optStr(patch.schedule);
  if (patch.budget !== undefined) c.budget = num(patch.budget);
  c.updatedAt = now();
  logActivity(ctx, db, { action: 'campaign.update', result: `Updated campaign "${c.name}"`, objectType: 'campaign', objectId: c.id, objectLabel: c.name });
  persist(db);
  return c;
}

export function deleteCampaign(ctx: Ctx, db: DB, campaignId: string): void {
  requireRole(ctx, 'manager');
  const c = getCampaign(db, ctx.workspaceId, campaignId);
  db.campaigns = db.campaigns.filter((x) => x.id !== campaignId);
  logActivity(ctx, db, { action: 'campaign.delete', result: `Deleted campaign "${c.name}"`, objectType: 'campaign', objectId: campaignId, objectLabel: c.name });
  persist(db);
}

// ---------- social posts ----------

export function listPosts(db: DB, workspaceId: string, f: { status?: PostStatus | 'all' } = {}, q?: string): SocialPost[] {
  return listRows<SocialPost>(db.posts, {
    workspaceId,
    q,
    searchFields: ['text', 'platform'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (p) => (f.status === undefined || f.status === 'all' || p.status === f.status),
  });
}

export interface PostInput {
  platform: string;
  text: string;
  mediaIds?: string[];
  scheduledAt?: string;
  campaignId?: string;
}

export function createPost(ctx: Ctx, db: DB, input: PostInput): SocialPost {
  requireRole(ctx, 'member');
  const post: SocialPost = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    platform: nonEmpty(input.platform, 'platform'),
    text: nonEmpty(input.text, 'text'),
    mediaIds: input.mediaIds ?? [],
    status: input.scheduledAt ? 'scheduled' : 'draft',
    scheduledAt: optStr(input.scheduledAt),
    campaignId: optStr(input.campaignId),
    metrics: { likes: 0, comments: 0, shares: 0, clicks: 0 },
    createdAt: now(),
    updatedAt: now(),
  };
  db.posts.push(post);
  logActivity(ctx, db, { action: 'post.create', result: `Created post for ${post.platform}`, objectType: 'post', objectId: post.id, objectLabel: post.text.slice(0, 40) });
  persist(db);
  return post;
}

export function updatePost(ctx: Ctx, db: DB, postId: string, patch: Partial<PostInput> & { status?: PostStatus }): SocialPost {
  requireRole(ctx, 'member');
  const p = getPost(db, ctx.workspaceId, postId);
  if (patch.platform !== undefined) p.platform = nonEmpty(patch.platform, 'platform');
  if (patch.text !== undefined) p.text = nonEmpty(patch.text, 'text');
  if (patch.mediaIds !== undefined) p.mediaIds = patch.mediaIds;
  if (patch.scheduledAt !== undefined) p.scheduledAt = optStr(patch.scheduledAt);
  if (patch.campaignId !== undefined) p.campaignId = optStr(patch.campaignId);
  if (patch.status !== undefined) p.status = okFrom<PostStatus>(patch.status, p.status, POST_STATUS);
  p.updatedAt = now();
  persist(db);
  return p;
}

export function getPost(db: DB, workspaceId: string, postId: string): SocialPost {
  const p = db.posts.find((x) => x.id === postId && x.workspaceId === workspaceId);
  if (!p) throw Error('NOT_FOUND');
  return p;
}

export function publishPost(ctx: Ctx, db: DB, postId: string): SocialPost {
  requireRole(ctx, 'manager');
  const p = getPost(db, ctx.workspaceId, postId);
  const out = publishSocial(db, ctx.workspaceId, p.platform, p.text);
  p.status = 'published';
  p.publishedAt = now();
  p.updatedAt = now();
  logActivity(ctx, db, { action: 'post.publish', result: out.output, objectType: 'post', objectId: p.id, objectLabel: p.text.slice(0, 40) });
  const campaign = p.campaignId ? getCampaign(db, ctx.workspaceId, p.campaignId) : undefined;
  if (campaign) {
    campaign.metrics.sent += 1;
    campaign.updatedAt = now();
  }
  persist(db);
  return p;
}

export function deletePost(ctx: Ctx, db: DB, postId: string): void {
  requireRole(ctx, 'manager');
  const p = getPost(db, ctx.workspaceId, postId);
  db.posts = db.posts.filter((x) => x.id !== postId);
  logActivity(ctx, db, { action: 'post.delete', result: 'Deleted post', objectType: 'post', objectId: postId });
  persist(db);
}

// ---------- email ----------

export function listEmails(db: DB, workspaceId: string, f: { status?: EmailStatus | 'all' } = {}, q?: string): EmailMessage[] {
  return listRows<EmailMessage>(db.emails, {
    workspaceId,
    q,
    searchFields: ['subject', 'body', 'to'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (e) => (f.status === undefined || f.status === 'all' || e.status === f.status),
  });
}

export function getEmail(db: DB, workspaceId: string, emailId: string): EmailMessage {
  const e = db.emails.find((x) => x.id === emailId && x.workspaceId === workspaceId);
  if (!e) throw Error('NOT_FOUND');
  return e;
}

export interface EmailInput {
  to?: string;
  subject: string;
  body: string;
  scheduledAt?: string;
  templateId?: string;
  customerId?: string;
  dealId?: string;
  campaignId?: string;
}

export function createEmail(ctx: Ctx, db: DB, input: EmailInput): EmailMessage {
  requireRole(ctx, 'member');
  const email: EmailMessage = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    to: optStr(input.to),
    subject: nonEmpty(input.subject, 'subject'),
    body: nonEmpty(input.body, 'body'),
    status: input.scheduledAt ? 'scheduled' : 'draft',
    templateId: optStr(input.templateId),
    scheduledAt: optStr(input.scheduledAt),
    customerId: optStr(input.customerId),
    dealId: optStr(input.dealId),
    campaignId: optStr(input.campaignId),
    createdAt: now(),
    updatedAt: now(),
  };
  db.emails.push(email);
  logActivity(ctx, db, { action: 'email.create', result: `Drafted email "${email.subject}"`, objectType: 'email', objectId: email.id, objectLabel: email.subject });
  persist(db);
  return email;
}

export function sendEmail(ctx: Ctx, db: DB, emailId: string): EmailMessage {
  requireRole(ctx, 'manager');
  const e = getEmail(db, ctx.workspaceId, emailId);
  const to = e.to ?? (e.customerId ? db.customers.find((c) => c.id === e.customerId)?.email : undefined);
  if (!to) throw Error('NO_RECIPIENT');
  const out = deliverEmail(db, ctx.workspaceId, to, e.subject, e.body);
  e.status = 'sent';
  e.sentAt = now();
  e.updatedAt = now();
  logActivity(ctx, db, { action: 'email.send', result: out.output, objectType: 'email', objectId: e.id, objectLabel: e.subject });
  const campaign = e.campaignId ? getCampaign(db, ctx.workspaceId, e.campaignId) : undefined;
  if (campaign) {
    campaign.metrics.sent += 1;
    campaign.updatedAt = now();
  }
  persist(db);
  return e;
}

export function deleteEmail(ctx: Ctx, db: DB, emailId: string): void {
  requireRole(ctx, 'manager');
  const e = getEmail(db, ctx.workspaceId, emailId);
  db.emails = db.emails.filter((x) => x.id !== emailId);
  persist(db);
}

// ---------- templates ----------

export function listTemplates(db: DB, workspaceId: string): EmailTemplate[] {
  return db.emailTemplates.filter((t) => t.workspaceId === workspaceId).sort((a, b) => a.name.localeCompare(b.name));
}

export interface TemplateInput {
  name: string;
  subject: string;
  body: string;
}

export function createTemplate(ctx: Ctx, db: DB, input: TemplateInput): EmailTemplate {
  requireRole(ctx, 'member');
  const t: EmailTemplate = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    subject: nonEmpty(input.subject, 'subject'),
    body: nonEmpty(input.body, 'body'),
    createdAt: now(),
    updatedAt: now(),
  };
  db.emailTemplates.push(t);
  persist(db);
  return t;
}

export function deleteTemplate(ctx: Ctx, db: DB, templateId: string): void {
  requireRole(ctx, 'manager');
  db.emailTemplates = db.emailTemplates.filter((t) => t.id !== templateId && t.workspaceId === ctx.workspaceId);
  persist(db);
}