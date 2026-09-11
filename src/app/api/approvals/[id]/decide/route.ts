import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { decideApproval } from '@/lib/core/engine/misc';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const body = await readBody(req);
    const approved = body.decision === 'approve' || body.decision === 'approved' || body.approved === true || body.approved === 'true';
    const approval = decideApproval(ctx, db, id, approved);
    return ok({ approval });
  } catch (e) {
    return fromError(e);
  }
}