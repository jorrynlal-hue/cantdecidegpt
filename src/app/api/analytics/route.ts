import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import { computeInsights, deriveInsightNotes, recentActivities } from '@/lib/core/analytics';

export async function GET(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');
    const insights = computeInsights(db, ctx.workspaceId);
    if (scope === 'insights') return ok({ insights, notes: deriveInsightNotes(insights) });
    if (scope === 'activity') return ok({ activities: recentActivities(db, ctx.workspaceId, 100) });
    return ok({ insights, notes: deriveInsightNotes(insights) });
  } catch (e) {
    return fromError(e);
  }
}