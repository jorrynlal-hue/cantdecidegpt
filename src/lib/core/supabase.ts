// Supabase persistence bridge. The app keeps a fast in-memory DB for runtime,
// and mirrors full snapshots into Supabase so every save is stored on the cloud
// backend. Backups are versioned like git commits (app_backups rows).
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DB, Workspace } from './types';
import { freshDB } from './db';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(URL && (SERVICE || ANON));
}

let client: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  if (!client) {
    const key = SERVICE || ANON || '';
    client = createClient(URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function publicClient(): SupabaseClient {
  if (!URL || !ANON) throw new Error('Supabase env vars are not set.');
  return createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

let lastMirrorAt = 0;
let mirrorTimer: ReturnType<typeof setTimeout> | null = null;

declare global {
  var __nexus_cloud_loaded__: boolean | undefined;
}

// Hydrate the in-memory DB from the Supabase snapshot once per server instance.
// Called on every authenticated request so fresh instances pick up cloud state.
export async function hydrateGlobalDB(current: DB): Promise<DB> {
  if (!supabaseConfigured()) return current;
  if (globalThis.__nexus_cloud_loaded__) return current;
  globalThis.__nexus_cloud_loaded__ = true;
  try {
    const snap = await loadSnapshot();
    if (snap && snap.workspaces.length > 0) {
      const g = globalThis as unknown as { __nexus_db__?: DB };
      const merged = { ...freshDB(), ...snap, seq: Math.max(snap.seq ?? 1, current.seq ?? 1), initializedAt: current.initializedAt };
      g.__nexus_db__ = merged;
      return merged;
    }
    await reconcileWorkspaces(current);
  } catch {
    // keep local if cloud is unreachable
  }
  return current;
}

// Versioned, git-style save: every snapshot bumps the version.
export async function mirrorSnapshot(db: DB, message = 'save'): Promise<void> {
  if (!supabaseConfigured() || !SERVICE) return;
  const now = Date.now();
  if (now - lastMirrorAt < 1500) return; // throttle
  lastMirrorAt = now;
  try {
    const payload = JSON.parse(JSON.stringify(db));
    const { data } = await adminClient()
      .from('app_state')
      .upsert({ id: 'latest', payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    void data;
    // git-style backup row (keep last ~120)
    const { data: backups } = await adminClient().from('app_backups').select('id').order('created_at', { ascending: false }).limit(120);
    const toDelete = backups && backups.length >= 120 ? backups.slice(119).map((b) => b.id) : [];
    if (toDelete.length) await adminClient().from('app_backups').delete().in('id', toDelete);
    await adminClient().from('app_backups').insert({
      version: db.seq,
      message,
      author: 'system',
      payload,
      created_at: new Date().toISOString(),
    });
  } catch {
    // never break the app because the cloud write failed
  }
}

export function queueMirror(db: DB, message = 'save'): void {
  if (!supabaseConfigured() || !SERVICE) return;
  if (mirrorTimer) clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => void mirrorSnapshot(db, message), 350);
}

// Load the latest snapshot from Supabase, if present and newer than disk.
export async function loadSnapshot(): Promise<DB | null> {
  if (!supabaseConfigured()) return null;
  try {
    const { data, error } = await adminClient().from('app_state').select('payload, updated_at').eq('id', 'latest').limit(1).maybeSingle();
    if (error || !data?.payload) return null;
    const parsed = data.payload as Partial<DB>;
    if (!parsed || !Array.isArray(parsed.workspaces)) return null;
    // merge with fresh defaults for forward compatibility
    const base = freshDB();
    return { ...base, ...parsed } as DB;
  } catch {
    return null;
  }
}

export async function listBackups(limit = 50): Promise<Array<{ version: number; message: string | null; created_at: string }>> {
  if (!supabaseConfigured()) return [];
  try {
    const { data } = await adminClient()
      .from('app_backups')
      .select('version, message, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as Array<{ version: number; message: string | null; created_at: string }>;
  } catch {
    return [];
  }
}

// Reconcile a freshly loaded workspace list against Supabase (used at boot).
export async function reconcileWorkspaces(db: DB): Promise<Workspace[]> {
  if (!supabaseConfigured()) return db.workspaces;
  try {
    const { data } = await adminClient().from('workspaces').select('*');
    if (!data || data.length === 0) return db.workspaces;
    const remote = data as Array<{ id: string; name: string; slug: string; owner_user_id: string; member_ids: string[]; settings: Record<string, unknown> }>;
    for (const w of remote) {
      if (!db.workspaces.some((x) => x.id === w.id)) {
        db.workspaces.push({
          id: w.id,
          name: w.name,
          slug: w.slug,
          ownerUserId: w.owner_user_id,
          memberIds: w.member_ids ?? [],
          settings: w.settings ?? {},
          createdAt: new Date().toISOString(),
        });
      }
    }
    return db.workspaces;
  } catch {
    return db.workspaces;
  }
}