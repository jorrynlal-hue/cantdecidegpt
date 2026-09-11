import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { getSettings } from '@/lib/core/engine/core';
import { persist } from '@/lib/core/db';

export async function PATCH(req: Request) {
  try {
    const { db, user } = await requireSession();
    const body = await readBody(req);
    const theme = body.theme === 'light' || body.theme === 'dark' || body.theme === 'system' ? body.theme : undefined;
    const accent = body.accent as string | undefined;
    const customAccent = body.customAccent ? String(body.customAccent) : undefined;
    let s = getSettings(db, user.id);
    if (!s) {
      s = { userId: user.id, appearance: { theme: 'dark', accent: 'royal-purple' }, notify: {}, workspaceId: '' };
      db.userSettings.push(s);
    }
    if (theme) s.appearance.theme = theme;
    if (accent) s.appearance.accent = accent as never;
    if (customAccent) s.appearance.customAccent = customAccent;
    persist(db);
    return ok({ settings: s });
  } catch (e) {
    return fromError(e);
  }
}