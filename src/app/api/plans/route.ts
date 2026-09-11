import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import { SITE_PLANS, getWorkspacePlan } from '@/lib/plans';

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
    if (!ws) return fail('NOT_FOUND', 'Workspace not found.', 404);
    return ok({ plans: SITE_PLANS, active: getWorkspacePlan(ws) });
  } catch (e) {
    return fromError(e);
  }
}