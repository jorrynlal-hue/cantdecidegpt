// Central domain contracts for the connected work platform.
// Every record is workspace-scoped (workspace_id) except auth-level entities.

export type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Ctx {
  user: SessionUser;
  workspaceId: string;
  actorSource?: 'user' | 'ai' | 'workflow' | 'integration' | 'system';
  actorLabel?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  role: Role;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  memberIds: string[];
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

export type HumanStatus = 'online' | 'busy' | 'away' | 'offline';

export interface Human {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  email?: string;
  status: HumanStatus;
  focus: string;
  skills: string[];
  aiAssist: string[];
  lastSeen: string;
  createdAt: string;
}

export type InsightSource = 'ai' | 'human' | 'co';

export interface Payment {
  id: string;
  workspaceId: string;
  planId: string;
  amount: number;
  currency: string;
  provider: 'paypal';
  providerRef: string;
  status: string;
  createdById: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  source: InsightSource;
  tags: string[];
  generatedBy?: string;
  provider?: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  projectId?: string;
  customerId?: string;
  dueDate?: string;
  subtasks: { id: string; title: string; done: boolean }[];
  comments: { id: string; authorId: string; text: string; at: string }[];
  recurring?: { freq: 'daily' | 'weekly' | 'monthly'; nextDue: string };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  status: ProjectStatus;
  milestones: Milestone[];
  files: string[];
  comments: { id: string; authorId: string; text: string; at: string }[];
  startDate?: string;
  deadline?: string;
  customerId?: string;
  category?: string;
  colour?: string;
  tier?: string;
  template?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  type: 'contact' | 'company';
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags: string[];
  activities: { id: string; kind: string; text: string; at: string; userId: string }[];
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'lead' | 'qualified' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  workspaceId: string;
  name: string;
  customerId?: string;
  value: number;
  stage: DealStage;
  ownerId: string;
  expectedClose?: string;
  notes?: string;
  activities: { id: string; kind: string; text: string; at: string; userId: string }[];
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'planning' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'social' | 'email' | 'content' | 'ads' | 'other';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceIds: string[];
  contentIds: string[];
  schedule?: string;
  budget?: number;
  metrics: { sent: number; opened: number; clicked: number; converted: number; revenue: number };
  createdAt: string;
  updatedAt: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface SocialPost {
  id: string;
  workspaceId: string;
  platform: string;
  text: string;
  mediaIds: string[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  campaignId?: string;
  metrics: { likes: number; comments: number; shares: number; clicks: number };
  createdAt: string;
  updatedAt: string;
}

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface EmailMessage {
  id: string;
  workspaceId: string;
  to?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  customerId?: string;
  dealId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLine {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  number: string;
  customerId?: string;
  lines: InvoiceLine[];
  taxPct: number;
  discountPct: number;
  dueDate?: string;
  notes?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type TxnType = 'income' | 'expense';
export interface TxnCategory { id: string; workspaceId: string; name: string; type: TxnType; }

export interface Transaction {
  id: string;
  workspaceId: string;
  type: TxnType;
  description: string;
  amount: number;
  categoryId?: string;
  date: string;
  invoiceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  name: string;
  kind: string; // pdf/docx/xlsx/pptx/txt/csv/image/...
  size: number;
  text?: string; // extracted text for AI
  folder?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  workspaceId: string;
  title: string;
  kind: 'note' | 'process' | 'instruction' | 'reference' | 'knowledge';
  content: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRecord {
  id: string;
  workspaceId: string;
  title: string;
  kind: string; // article/blog/social/caption/ad/email/product/script/doc/marketing/summary/rewrite/ideas
  body: string;
  tone: string;
  savedAt: string;
  createdBy: string;
}

export interface Generation {
  id: string;
  workspaceId: string;
  kind: 'content' | 'image' | 'video' | 'voice' | 'code' | 'transcription' | 'speech';
  prompt: string;
  params: Record<string, unknown>;
  result: string; // text, JSON, or data-uri preview
  provider: string;
  saved: boolean;
  createdBy: string;
  createdAt: string;
}

export type WorkflowTriggerType = 'new_task' | 'completed_task' | 'new_customer' | 'new_lead' | 'new_document' | 'scheduled_time' | 'manual' | 'webhook';
export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  filter?: Record<string, string>; // e.g. projectId equals / priority equals
  schedule?: string; // cron-like simplified: "daily 09:00" | "weekly mon 09:00" | "hourly"
}
export interface WorkflowStep {
  id: string;
  kind: 'condition' | 'delay' | 'result' | 'action';
  action?: string; // universal action id
  params?: Record<string, unknown>;
  condition?: { field: string; op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'; value: string };
  delaySec?: number;
  approved?: boolean; // require approval before running this action
}
export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ExecutionStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionResult {
  stepId?: string;
  action?: string;
  output?: string;
  error?: string;
  at: string;
}

export interface Execution {
  id: string;
  workspaceId: string;
  workflowId: string;
  trigger: string;
  payload: Record<string, unknown>;
  status: ExecutionStatus;
  startedAt: string;
  endedAt?: string;
  stepIndex: number;
  resumeAt?: string; // for delays / approvals
  pendingApprovalId?: string;
  approvedStepId?: string; // step just approved, to run on resume
  results: ExecutionResult[];
  createdBy: string;
  dryRun?: boolean; // simulated run — no side effects
  verified?: boolean; // human-verified completion
}

export interface Conversation {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  messages: { id: string; role: 'user' | 'assistant' | 'tool'; content: string; name?: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  body?: string;
  kind: string; // task/project/ai/workflow/customer/finance/integration/approval/error/comment
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorSource: 'user' | 'ai' | 'workflow' | 'integration' | 'system';
  action: string;
  objectType?: string;
  objectId?: string;
  objectLabel?: string;
  result: string;
  at: string;
}

export interface Event {
  id: string;
  workspaceId: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  kind: 'event' | 'deadline' | 'reminder' | 'task' | 'milestone' | 'recurring';
  recurring?: 'daily' | 'weekly' | 'monthly';
  taskId?: string;
  projectId?: string;
  createdBy: string;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export interface ApprovalItem {
  id: string;
  workspaceId: string;
  title: string;
  detail: string;
  kind: string;
  status: ApprovalStatus;
  requestedBy: string;
  requestedById: string;
  executionId?: string;
  payload: Record<string, unknown>;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  workspaceId: string;
  category: 'email' | 'calendar' | 'cloud' | 'social' | 'payments' | 'crm' | 'database' | 'dev' | 'external';
  name: string;
  key: string;
  connected: boolean;
  status: 'connected' | 'error' | 'disconnected' | 'connecting';
  error?: string;
  permissions: string[];
  settings: Record<string, unknown>;
  credentialsRef?: string; // server-side secret reference, never the secret itself
  connectedAt?: string;
  updatedAt: string;
  // universal connector fields (Control Center)
  kind?: 'api' | 'browser' | 'mcp' | 'webhook' | 'oauth';
  provider?: string;
  domain?: string; // browser workers: allowed websites
  endpoint?: string; // API/MCP endpoint
  health?: 'ok' | 'degraded' | 'down' | 'unknown';
  lastTestedAt?: string;
}

export interface ProviderConfig {
  id: string;
  workspaceId: string;
  kind: 'chat' | 'content' | 'image' | 'video' | 'voice' | 'transcription' | 'speech' | 'code';
  provider: string;
  enabled: boolean;
  settings: Record<string, unknown>; // never secrets
}

// Credential Vault entries. Raw secrets are never stored in the DB — only a
// masked hint (e.g. the last 4 chars) so the item can be identified and reused.
export type CredentialKind = 'oauth' | 'apikey' | 'token' | 'browser' | 'service';
export type CredentialStatus = 'active' | 'expired' | 'revoked';

export interface Credential {
  id: string;
  workspaceId: string;
  name: string;
  kind: CredentialKind;
  provider: string;
  masked: string; // hint only, never the secret
  scopes: string[];
  agentIds: string[]; // which agents may use it (empty = all agents)
  status: CredentialStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Tool Registry. Every connected capability can become a tool with declared
// inputs, risk, cost and access so the platform can plan execution safely.
export type ToolRisk = 'low' | 'medium' | 'high';

export interface Tool {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  capability: string;
  inputs: string[];
  permission: string;
  auth: string;
  risk: ToolRisk;
  cost: string;
  availability: string;
  owner: string;
  agentAccess: boolean;
  humanAccess: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accent: 'royal-red' | 'royal-blue' | 'royal-yellow' | 'royal-green' | 'royal-purple' | 'custom';
    customAccent?: string;
  };
  notify: Record<string, boolean>;
  workspaceId: string; // last active workspace
}

// Work Board: one shared area where work finders and work takers meet.
// A "finder" lists the craft they are good at and what they can do.
// A "taker" lists the work a business or project needs doing right now.
// Profiles are public across the whole system so every user can connect.
export type WorkRole = 'finder' | 'taker';

export interface WorkProfile {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkRole;
  name: string;
  email: string;
  fields: string[];
  details: string;
  resume?: string;
  socials: string[];
  availability?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DmMessage {
  id: string;
  from: string;
  text: string;
  at: string;
}

// Direct connect + chat thread between two users of the system.
// Creating a thread is "connecting". aId/bId name the two people so the
// board can be shown from either side without extra lookups.
export interface DmThread {
  id: string;
  workspaceId: string;
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  profileId?: string;
  messages: DmMessage[];
  lastRead: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DB {
  seq: number;
  workspaces: Workspace[];
  users: User[];
  teams: Team[];
  humans: Human[];
  insights: Insight[];
  payments: Payment[];
  tasks: Task[];
  projects: Project[];
  customers: Customer[];
  deals: Deal[];
  campaigns: Campaign[];
  posts: SocialPost[];
  emails: EmailMessage[];
  emailTemplates: EmailTemplate[];
  invoices: Invoice[];
  transactions: Transaction[];
  txnCategories: TxnCategory[];
  documents: DocumentRecord[];
  knowledge: KnowledgeItem[];
  content: ContentRecord[];
  generations: Generation[];
  workflows: Workflow[];
  executions: Execution[];
  conversations: Conversation[];
  notifications: Notification[];
  activities: ActivityItem[];
  events: Event[];
  approvals: ApprovalItem[];
  integrations: Integration[];
  providerConfigs: ProviderConfig[];
  credentials: Credential[];
  tools: Tool[];
  workProfiles: WorkProfile[];
  dmThreads: DmThread[];
  userSettings: UserSettings[];
  sessions: { token: string; userId: string; createdAt: string }[];
  initializedAt: string;
}