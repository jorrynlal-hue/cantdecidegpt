import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { disconnectIntegration } from '@/lib/core/engine/admin';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const integration = disconnectIntegration(ctx, db, id);
    return ok({ integration });
  } catch (e) {
    return fromError(e);
  }
}