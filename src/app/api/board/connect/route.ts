import { requireSession, ok, readBody, fromError } from '@/lib/core/api/helpers';
import { connectToProfile } from '@/lib/core/engine/board';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const thread = connectToProfile(ctx, db, {
      profileId: String(body.profileId ?? ''),
      message: body.message !== undefined ? String(body.message) : undefined,
    });
    return ok({ thread }, 201);
  } catch (e) {
    return fromError(e);
  }
}