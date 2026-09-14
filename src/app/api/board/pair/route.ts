import { requireSession, ok, readBody, fromError } from '@/lib/core/api/helpers';
import { pairThreadToProject } from '@/lib/core/engine/board';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const result = pairThreadToProject(ctx, db, {
      threadId: String(body.threadId ?? ''),
      projectId: String(body.projectId ?? ''),
    });
    return ok(result, 201);
  } catch (e) {
    return fromError(e);
  }
}