import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import { createPlatformUser, workspaceMembers } from '@/lib/core/engine/core';

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const members = workspaceMembers(db, ctx.workspaceId);
    return ok(members.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role, createdAt: m.createdAt })));
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await req.json().catch(() => ({}));
    if (!db.workspaces.some((w) => w.id === ctx.workspaceId)) return fail('FORBIDDEN', 'No workspace.', 403);
    const user = createPlatformUser(ctx, db, {
      email: String(body.email ?? ''),
      name: String(body.name ?? ''),
      password: String(body.password ?? 'password'),
      role: (body.role as never) ?? 'member',
    }, ctx.workspaceId);
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (e) {
    return fromError(e);
  }
}