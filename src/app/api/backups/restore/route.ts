import { requireSession, ok, fromError, readBody } from '@/lib/core/api/helpers';
import { adminClient } from '@/lib/core/supabase';
import { freshDB, flushDB, persist } from '@/lib/core/db';

// Undo / restore: reload the workspace from a cloud snapshot (versioned backup).
// Owner-only. Current session rows for users that still exist are preserved so
// restoring never silently logs the caller out.
export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    if (ctx.user.role !== 'owner') throw { code: 'FORBIDDEN', status: 403, message: 'Only the workspace owner can restore backups.' };
    const body = await readBody(req);
    const backupId = String(body.backupId ?? '');

    let query = adminClient().from('app_backups').select('id, version, payload, created_at').order('created_at', { ascending: false });
    if (backupId) query = query.eq('id', backupId);
    const res = await query.limit(1).maybeSingle();
    if (res.error || !res.data?.payload) throw { code: 'NOT_FOUND', status: 404, message: 'No backup found.' };

    const payload = res.data.payload as Partial<typeof db>;
    if (!payload || !Array.isArray(payload.workspaces) || payload.workspaces.length === 0) {
      throw { code: 'BAD_REQUEST', status: 400, message: 'Backup payload is invalid.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = freshDB() as any;
    const restored = { ...base, ...(payload as object), seq: Math.max(Number(payload.seq) ?? 1, db.seq) } as typeof db;
    const keep = db.sessions.filter((s) => restored.users.some((u) => u.id === s.userId));
    restored.sessions = keep;

    const g = globalThis as unknown as { __nexus_db__?: typeof db; __nexus_cloud_loaded__?: boolean };
    g.__nexus_db__ = restored;
    g.__nexus_cloud_loaded__ = true;
    flushDB(restored);
    persist(restored);

    return ok({ restored: true, version: Number(payload.seq) ?? 0, at: res.data.created_at, sessionsPreserved: keep.length });
  } catch (e) {
    return fromError(e);
  }
}