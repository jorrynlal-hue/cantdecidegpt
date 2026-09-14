import { requireSession, ok, fail, readBody, fromError } from '@/lib/core/api/helpers';
import { spawnAIWorkspace } from '@/lib/core/engine/aiworker';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const description = String(body.description ?? '');
    if (!description.trim()) return fail('BAD_REQUEST', 'Describe the help you need first.');
    const result = await spawnAIWorkspace(ctx, db, {
      description,
      name: body.name !== undefined ? String(body.name) : undefined,
    });
    return ok(result, 201);
  } catch (e) {
    return fromError(e);
  }
}