import { requireSession, ok, readBody, fromError } from '@/lib/core/api/helpers';
import { threadMessages, sendThreadMessage } from '@/lib/core/engine/board';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const thread = threadMessages(ctx, db, id);
    return ok({ thread });
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const body = await readBody(req);
    const message = await sendThreadMessage(ctx, db, { threadId: id, text: String(body.text ?? '') });
    return ok({ message }, 201);
  } catch (e) {
    return fromError(e);
  }
}