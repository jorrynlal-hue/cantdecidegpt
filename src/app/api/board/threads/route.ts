import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { listMyThreads } from '@/lib/core/engine/board';

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const threads = listMyThreads(ctx, db);
    return ok({ threads });
  } catch (e) {
    return fromError(e);
  }
}