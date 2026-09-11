import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { requireCollection } from '@/lib/core/api/crud';

export async function GET(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { collection } = await params;
    const def = requireCollection(collection);
    if (!def.list) return fail('METHOD_NOT_ALLOWED', 'Listing not supported for this collection', 405);
    const url = new URL(req.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (query[k] = v));
    const rows = def.list(db, ctx.workspaceId, query, { ctx });
    return ok(rows);
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { collection } = await params;
    const def = requireCollection(collection);
    if (!def.create) return fail('METHOD_NOT_ALLOWED', 'Creation not supported for this collection', 405);
    const body = await readBody(req);
    const created = def.create(ctx, db, body);
    return ok(created, 201);
  } catch (e) {
    return fromError(e);
  }
}