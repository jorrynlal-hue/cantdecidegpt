import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import { globalSearch } from '@/lib/core/search';

export async function GET(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    if (!q.trim()) return fail('BAD_REQUEST', 'Query "q" is required.');
    return ok(globalSearch(db, ctx.workspaceId, q));
  } catch (e) {
    return fromError(e);
  }
}