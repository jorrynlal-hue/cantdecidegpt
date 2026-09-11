import { requireSession, ok, fromError, readBody } from '@/lib/core/api/helpers';
import { connectIntegration } from '@/lib/core/engine/admin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const body = await readBody(req).catch(() => ({} as Record<string, unknown>));
    const integration = connectIntegration(ctx, db, id, body.settings as Record<string, unknown> | undefined);
    return ok({ integration });
  } catch (e) {
    return fromError(e);
  }
}