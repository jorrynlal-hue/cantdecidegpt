import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { runWorkflow } from '@/lib/core/automation';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const workflowId = String(body.workflowId ?? '');
    if (!workflowId) return fail('BAD_REQUEST', 'workflowId is required.');
    const payload = (body.payload as Record<string, unknown>) ?? {};
    const dryRun = !!body.dryRun;
    const execution = runWorkflow(ctx, db, workflowId, payload, dryRun);
    return ok({ execution });
  } catch (e) {
    return fromError(e);
  }
}