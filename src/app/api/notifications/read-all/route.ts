import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { setAllNotificationsRead, setNotificationRead } from '@/lib/core/engine/misc';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      return ok({ notification: setNotificationRead(ctx, db, id, true) });
    }
    const count = setAllNotificationsRead(ctx, db);
    return ok({ markedRead: count });
  } catch (e) {
    return fromError(e);
  }
}