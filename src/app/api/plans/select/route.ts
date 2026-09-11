import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { findPlan, setWorkspacePlan } from '@/lib/plans';
import { persist } from '@/lib/core/db';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const planId = String(body.planId ?? '');
    if (!findPlan(planId)) return fail('NOT_FOUND', 'Unknown plan.', 404);
    const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
    if (!ws) return fail('NOT_FOUND', 'Workspace not found.', 404);
    setWorkspacePlan(ws, planId);
    persist(db);
    return ok({ active: planId });
  } catch (e) {
    return fromError(e);
  }
}