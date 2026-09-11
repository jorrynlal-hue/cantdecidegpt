import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { generateInsightLive } from '@/lib/core/engine/human';

export async function POST(req: Request) {
  try {
    const { db, ctx, user } = await requireSession();
    const body = await readBody(req);
    if (user.role === 'viewer') return fail('FORBIDDEN', 'Viewers cannot generate insights.', 403);
    const insight = await generateInsightLive(ctx, db, {
      prompt: body.prompt ? String(body.prompt) : undefined,
      focus: body.focus ? String(body.focus) : undefined,
      hangingQuestion: body.hangingQuestion ? String(body.hangingQuestion) : undefined,
    });
    return ok({ insight });
  } catch (e) {
    return fromError(e);
  }
}