import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { requireCollection } from '@/lib/core/api/crud';

export async function GET(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { collection, id } = await params;
    const def = requireCollection(collection);
    if (!def.get) return fail('METHOD_NOT_ALLOWED', 'Fetching a single record is not supported', 405);
    return ok(def.get(db, ctx.workspaceId, id));
  } catch (e) {
    return fromError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { collection, id } = await params;
    const def = requireCollection(collection);
    if (!def.update) return fail('METHOD_NOT_ALLOWED', 'Updating not supported for this collection', 405);
    const body = await readBody(req);
    return ok(def.update(ctx, db, id, body));
  } catch (e) {
    return fromError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { collection, id } = await params;
    const def = requireCollection(collection);
    if (!def.remove) return fail('METHOD_NOT_ALLOWED', 'Deletion not supported for this collection', 405);
    def.remove(ctx, db, id);
    return ok({ deleted: id });
  } catch (e) {
    return fromError(e);
  }
}