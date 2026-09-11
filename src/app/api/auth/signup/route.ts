import { cookies } from 'next/headers';
import { loadDB, uid, persist } from '@/lib/core/db';
import { ok, fail, fromError, readBody, publicUser } from '@/lib/core/api/helpers';
import { getSettings, listWorkspacesForUser, ensureAppUser } from '@/lib/core/engine/core';
import { hydrateGlobalDB, supabaseAuthEnabled, supabaseSignUp, type SupabaseIdentity } from '@/lib/core/supabase';

export async function POST(req: Request) {
  try {
    let db = loadDB();
    db = await hydrateGlobalDB(db);
    const body = await readBody(req);
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    if (!email || !password) return fail('BAD_REQUEST', 'Email and password are required.');
    if (password.length < 8) return fail('BAD_REQUEST', 'Password must be at least 8 characters.');
    if (db.users.some((u) => u.email === email)) return fail('EMAIL_TAKEN', 'An account with this email already exists.', 409);

    let identity: SupabaseIdentity | null = null;
    if (supabaseAuthEnabled()) {
      const res = await supabaseSignUp(email, password, name || email.split('@')[0]);
      if (res.error) return fail('AUTH_ERROR', res.error, 400);
      if (res.needsVerification) return ok({ needsVerification: true });
      identity = res.identity;
    }

    const user = ensureAppUser(db, email, name || email.split('@')[0], identity?.id);
    const token = uid();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    persist(db);
    const cs = await cookies();
    cs.set('nexus_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
    const workspaces = listWorkspacesForUser(db, user.id);
    const settings = getSettings(db, user.id);
    return ok({
      needsVerification: false,
      user: publicUser(user),
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      activeWorkspaceId: settings?.workspaceId ?? workspaces[0]?.id ?? null,
      settings: settings ?? null,
    });
  } catch (e) {
    return fromError(e);
  }
}