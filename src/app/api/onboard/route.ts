import { requireSession, ok, fail, readBody } from '@/lib/core/api/helpers';
import { persist } from '@/lib/core/db';

export const ONBOARD_PATHS = ['find', 'build'] as const;
export type OnboardPath = (typeof ONBOARD_PATHS)[number];

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
    const preferredPath = (ws?.settings?.preferredPath as string | undefined) ?? null;
    return ok({ preferredPath });
  } catch {
    return ok({ preferredPath: null });
  }
}

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const path = String(body.path ?? '');
    if (path !== 'find' && path !== 'build') return fail('INVALID_PATH', 'Choose either find or build.');
    const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
    if (!ws) return fail('NOT_FOUND', 'Workspace not found.', 404);
    ws.settings = { ...ws.settings, preferredPath: path };
    persist(db);
    return ok({ preferredPath: path });
  } catch (e) {
    const err = e as { code?: string; status?: number; message?: string };
    const status = err?.status ?? (err?.code === 'UNAUTHORIZED' ? 401 : 400);
    return fail(err?.code ?? 'INTERNAL', err?.message ?? 'Unexpected error', status);
  }
}