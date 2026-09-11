import { cookies } from 'next/headers';
import { loadDB, hashPassword, uid, persist } from '@/lib/core/db';
import { ok, fail, fromError, readBody, publicUser } from '@/lib/core/api/helpers';
import { getSettings, setActiveWorkspace, listWorkspacesForUser, workspaceMembers } from '@/lib/core/engine/core';
import { hydrateGlobalDB } from '@/lib/core/supabase';

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
    return ok({
      user: publicUser(user),
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      activeWorkspaceId: active ?? null,
      settings: settings ?? null,
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
    const user = db.users.find((u) => u.email === email);
    if (!user || user.passwordHash !== hashPassword(password)) return fail('UNAUTHORIZED', 'Invalid email or password.', 401);
    const token = uid();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    persist(db);
    const cs = await cookies();
    cs.set('nexus_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: sessionExpiry() });
    const workspaces = listWorkspacesForUser(db, user.id);
    const settings = getSettings(db, user.id);
    const active = settings?.workspaceId && workspaces.some((w) => w.id === settings.workspaceId) ? settings.workspaceId : workspaces[0]?.id;
    return ok({
      user: publicUser(user),
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      activeWorkspaceId: active ?? null,
      settings: settings ?? null,
    });
  } catch (e) {
    return fromError(e);
  }
}