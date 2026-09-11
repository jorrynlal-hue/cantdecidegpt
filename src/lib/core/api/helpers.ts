import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DB, Ctx, User } from '../types';
import { loadDB } from '../db';
import { getSettings } from '../engine/core';
import { hydrateGlobalDB } from '../supabase';

export interface SessionBag {
  db: DB;
  ctx: Ctx;
  user: User;
}

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function fromError(e: unknown): NextResponse {
  const err = e as { code?: string; message?: string; status?: number };
  const code = err?.code ?? 'INTERNAL';
  const message = err?.message ?? 'Unexpected error';
  const status = typeof err?.status === 'number' ? err.status : code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' ? 404 : 400;
  return fail(code, message, status);
}

export function publicUser(u: User) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar, createdAt: u.createdAt };
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const json = (await req.json()) as Record<string, unknown>;
    return json ?? {};
  } catch {
    throw new Error('INVALID_JSON');
  }
}

export async function requireSession(): Promise<SessionBag> {
  let db = loadDB();
  db = await hydrateGlobalDB(db);
  const cs = await cookies();
  const token = cs.get('nexus_session')?.value;
  if (!token) throw { code: 'UNAUTHORIZED', status: 401, message: 'Not authenticated.' };
  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    cs.delete('nexus_session');
    throw { code: 'UNAUTHORIZED', status: 401, message: 'Session expired.' };
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) throw { code: 'UNAUTHORIZED', status: 401, message: 'Not authenticated.' };

  let workspaceId = getSettings(db, user.id)?.workspaceId;
  const memberWorkspaces = db.workspaces.filter((w) => w.memberIds.includes(user.id));
  if (!workspaceId || !memberWorkspaces.some((w) => w.id === workspaceId)) {
    workspaceId = memberWorkspaces[0]?.id;
  }
  if (!workspaceId) throw { code: 'FORBIDDEN', status: 403, message: 'You are not part of any workspace.' };

  return {
    db,
    ctx: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      workspaceId,
    },
    user,
  };
}