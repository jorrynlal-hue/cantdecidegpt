import { cookies } from 'next/headers';
import { loadDB, hashPassword, uid, persist } from '@/lib/core/db';
import { ok, fail, fromError, readBody, publicUser } from '@/lib/core/api/helpers';
import { getSettings, setActiveWorkspace, listWorkspacesForUser, workspaceMembers, ensureAppUser } from '@/lib/core/engine/core';
import { hydrateGlobalDB, supabaseAuthEnabled, supabaseSignIn, supabaseAdminCreateUser } from '@/lib/core/supabase';
import { getWorkspacePlan, DEFAULT_PLAN_ID } from '@/lib/plans';

function sessionExpiry(): Date {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
}

export async function GET() {
  try {
    let db = loadDB();
    db = await hydrateGlobalDB(db);
    const cs = await cookies();
    const token = cs.get('nexus_session')?.value;
    if (!token) return fail('UNAUTHORIZED', 'Not authenticated.', 401);
    const session = db.sessions.find((s) => s.token === token);
    if (!session) return fail('UNAUTHORIZED', 'Session expired.', 401);
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) return fail('UNAUTHORIZED', 'Not authenticated.', 401);
    const workspaces = listWorkspacesForUser(db, user.id);
    const settings = getSettings(db, user.id);
    const active = settings?.workspaceId && workspaces.some((w) => w.id === settings.workspaceId) ? settings.workspaceId : workspaces[0]?.id;
    if (active && settings?.workspaceId !== active) setActiveWorkspace(db, user.id, active);
    const members = active ? workspaceMembers(db, active) : [];
    const unread = db.notifications.filter((n) => n.workspaceId === active && n.userId === user.id && !n.read).length;
    const ws = active ? db.workspaces.find((w) => w.id === active) : undefined;
    return ok({
      user: publicUser(user),
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      activeWorkspaceId: active ?? null,
      settings: settings ?? null,
      plan: ws ? getWorkspacePlan(ws) : DEFAULT_PLAN_ID,
      unread,
      members: members.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
    });
  } catch (e) {
    return fromError(e);
  }
}

export async function DELETE() {
  try {
    const db = loadDB();
    const cs = await cookies();
    const token = cs.get('nexus_session')?.value;
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      persist(db);
    }
    cs.delete('nexus_session');
    return ok({ signedOut: true });
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request) {
  try {
    let db = loadDB();
    db = await hydrateGlobalDB(db);
    const body = await readBody(req);
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!email || !password) return fail('BAD_REQUEST', 'Email and password are required.');

    let name = '';
    if (supabaseAuthEnabled()) {
      let identity = await supabaseSignIn(email, password);
      if (!identity) {
        // Seed/pre-existing local accounts don't exist in Supabase yet — provision
        // once (email_confirm: true) so they authenticate through cloud auth too.
        const local = db.users.find((u) => u.email === email);
        if (local) {
          const created = await supabaseAdminCreateUser(email, password, local.name);
          if (created) identity = await supabaseSignIn(email, password);
        }
      }
      if (!identity) return fail('UNAUTHORIZED', 'Invalid email or password.', 401);
      name = identity.name;
    } else {
      const user = db.users.find((u) => u.email === email);
      if (!user || user.passwordHash !== hashPassword(password)) return fail('UNAUTHORIZED', 'Invalid email or password.', 401);
      name = user.name;
    }

    const user = ensureAppUser(db, email, name);
    const token = uid();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    persist(db);
    const cs = await cookies();
    cs.set('nexus_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: sessionExpiry() });
    const workspaces = listWorkspacesForUser(db, user.id);
    const settings = getSettings(db, user.id);
    const active = settings?.workspaceId && workspaces.some((w) => w.id === settings.workspaceId) ? settings.workspaceId : workspaces[0]?.id;
    const ws = active ? db.workspaces.find((w) => w.id === active) : undefined;
    return ok({
      user: publicUser(user),
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      activeWorkspaceId: active ?? null,
      settings: settings ?? null,
      plan: ws ? getWorkspacePlan(ws) : DEFAULT_PLAN_ID,
    });
  } catch (e) {
    return fromError(e);
  }
}