import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { deletePlatformUser } from '@/lib/core/engine/core';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    deletePlatformUser(ctx, db, ctx.workspaceId, id);
    return ok({ deleted: id });
  } catch (e) {
    return fromError(e);
  }
}