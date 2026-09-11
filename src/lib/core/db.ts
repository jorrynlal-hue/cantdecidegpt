import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DB, User, Workspace } from './types';
import { runScheduledSweep } from './scheduler';
import { queueMirror } from './supabase';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'db.json');

export function now(): string {
  return new Date().toISOString();
}

export function uid(): string {
  return crypto.randomUUID();
}

export function shortId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

export function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(`nexus::${pw}`).digest('hex');
}

// ---- globalThis cache so dev/HMR reuse a single DB instance ----
declare global {
  var __nexus_db__: DB | undefined;
}

export function freshDB(): DB {
  return {
    seq: 1,
    workspaces: [],
    users: [],
    teams: [],
    humans: [],
    insights: [],
    payments: [],
    tasks: [],
    projects: [],
    customers: [],
    deals: [],
    campaigns: [],
    posts: [],
    emails: [],
    emailTemplates: [],
    invoices: [],
    transactions: [],
    txnCategories: [],
    documents: [],
    knowledge: [],
    content: [],
    generations: [],
    workflows: [],
    executions: [],
    conversations: [],
    notifications: [],
    activities: [],
    events: [],
    approvals: [],
    integrations: [],
    providerConfigs: [],
    userSettings: [],
    sessions: [],
    initializedAt: now(),
  };
}

function loadFromDisk(): DB | null {
  try {
    if (!fs.existsSync(FILE)) return null;
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.workspaces)) {
      // merge with fresh defaults to keep schema forward-compatible
      const base = freshDB();
      const db = { ...base, ...parsed };
      seedHumansInsights(db);
      return db;
    }
    return null;
  } catch {
    return null;
  }
}

// Human workspace records are identity-layer fixtures — they represent the
// actual people operating the workspace, so they are always populated.
function seedHumansInsights(db: DB): void {
  if (!db.workspaces.some((w) => w.id === 'ws-default')) return;
  if (db.humans.length > 0) return;
  const t = now();
  db.humans.push(
    {
      id: 'hum-alex',
      workspaceId: 'ws-default',
      name: 'Alex Owner',
      role: 'Founder & Operator',
      email: 'owner@nexus.local',
      status: 'online',
      focus: 'Scaling client delivery without losing craft',
      skills: ['Strategy', 'Client relationships', 'Operations'],
      aiAssist: ['Pricing experiments', 'Shadow Founder briefs', 'Weekly ops'],
      lastSeen: t,
      createdAt: t,
    },
    {
      id: 'hum-riley',
      workspaceId: 'ws-default',
      name: 'Riley Admin',
      role: 'Systems & Automation',
      email: 'admin@nexus.local',
      status: 'away',
      focus: 'Making automations actually run themselves',
      skills: ['Automation', 'Workflows', 'Tooling'],
      aiAssist: ['Workflow debugging', 'Auto-renegotiate', 'Bookkeeping'],
      lastSeen: t,
      createdAt: t,
    }
  );
  db.insights.push(
    {
      id: 'ins-seed-1',
      workspaceId: 'ws-default',
      title: 'The co-pilot is only as good as the briefing',
      body: 'Every hour saved on input shows up as leverage downstream. Humans set direction; AI drafts the volume.',
      source: 'co',
      tags: ['operating-system', 'co-working'],
      createdAt: t,
    },
    {
      id: 'ins-seed-2',
      workspaceId: 'ws-default',
      title: 'Memory beats swagger',
      body: 'A workspace that remembers every client, task and decision compounds faster than one that only reacts.',
      source: 'ai',
      tags: ['memory', 'generative'],
      generatedBy: 'nexus-ai',
      provider: 'baseline',
      createdAt: t,
    },
    {
      id: 'ins-seed-3',
      workspaceId: 'ws-default',
      title: 'Humans stay in the loop by design',
      body: 'AI handles the busywork; people keep the judgement calls. That is the whole point of the human workspace.',
      source: 'human',
      tags: ['human', 'principles'],
      createdAt: t,
    }
  );
}

let persistTimer: NodeJS.Timeout | null = null;

export function persist(db: DB): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const tmp = `${FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tmp, FILE);
    } catch {
      // ignore transient write failures
    }
  }, 150);
  // cloud save: mirror the snapshot to Supabase (throttled + fire-and-forget)
  queueMirror(db);
}

export function flushDB(db: DB): void {
  if (persistTimer) clearTimeout(persistTimer);
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

export function nextSeq(db: DB): number {
  return ++db.seq;
}

export function loadDB(): DB {
  if (globalThis.__nexus_db__) {
    runScheduledSweep(globalThis.__nexus_db__);
    return globalThis.__nexus_db__;
  }
  let db = loadFromDisk();
  if (!db) {
    db = freshDB();
    seed(db);
    flushDB(db);
  }
  globalThis.__nexus_db__ = db;
  runScheduledSweep(db);
  return db;
}

// Only an owner user + first workspace + sensible defaults are seeded.
// No demo business data: metrics derive exclusively from user-created records.
function seed(db: DB): void {
  const owner: User = {
    id: 'u-owner',
    email: 'owner@nexus.local',
    passwordHash: hashPassword('password'),
    name: 'Alex Owner',
    role: 'owner',
    createdAt: now(),
  };
  const admin: User = {
    id: 'u-admin',
    email: 'admin@nexus.local',
    passwordHash: hashPassword('password'),
    name: 'Riley Admin',
    role: 'admin',
    createdAt: now(),
  };
  const manager: User = {
    id: 'u-manager',
    email: 'manager@nexus.local',
    passwordHash: hashPassword('password'),
    name: 'Morgan Manager',
    role: 'manager',
    createdAt: now(),
  };
  const member: User = {
    id: 'u-member',
    email: 'member@nexus.local',
    passwordHash: hashPassword('password'),
    name: 'Jordan Member',
    role: 'member',
    createdAt: now(),
  };
  const viewer: User = {
    id: 'u-viewer',
    email: 'viewer@nexus.local',
    passwordHash: hashPassword('password'),
    name: 'Sam Viewer',
    role: 'viewer',
    createdAt: now(),
  };
  db.users.push(owner, admin, manager, member, viewer);

  const ws: Workspace = {
    id: 'ws-default',
    name: 'Nexus HQ',
    slug: 'nexus-hq',
    ownerUserId: owner.id,
    memberIds: [owner.id, admin.id, manager.id, member.id, viewer.id],
    settings: {},
    createdAt: now(),
  };
  db.workspaces.push(ws);

  const cats = ['Salary', 'Software', 'Office', 'Travel', 'Services', 'Sales Revenue'];
  cats.forEach((c, i) => {
    db.txnCategories.push({ id: `cat-${i}`, workspaceId: ws.id, name: c, type: i === 5 ? 'income' : 'expense' });
  });

  db.integrations.push(
    {
      id: 'int-email',
      workspaceId: ws.id,
      category: 'email',
      name: 'Email provider',
      key: 'email.generic',
      connected: false,
      status: 'disconnected',
      permissions: ['send', 'read'],
      settings: {},
      updatedAt: now(),
    },
    {
      id: 'int-social-instagram',
      workspaceId: ws.id,
      category: 'social',
      name: 'Instagram',
      key: 'social.instagram',
      connected: false,
      status: 'disconnected',
      permissions: ['publish'],
      settings: {},
      updatedAt: now(),
    }
  );

  db.userSettings.push({
    userId: owner.id,
    appearance: { theme: 'dark', accent: 'royal-purple' },
    notify: { task: true, approval: true, workflow: true, customer: true, 'ai': true },
    workspaceId: ws.id,
  });

  seedHumansInsights(db);

  // provider configs default to the clearly-labeled built-in baseline
  db.providerConfigs.push(
    { id: 'prv-chat', workspaceId: ws.id, kind: 'chat', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-content', workspaceId: ws.id, kind: 'content', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-image', workspaceId: ws.id, kind: 'image', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-video', workspaceId: ws.id, kind: 'video', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-voice', workspaceId: ws.id, kind: 'voice', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-transcription', workspaceId: ws.id, kind: 'transcription', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-speech', workspaceId: ws.id, kind: 'speech', provider: 'baseline', enabled: true, settings: {} },
    { id: 'prv-code', workspaceId: ws.id, kind: 'code', provider: 'baseline', enabled: true, settings: {} }
  );
}