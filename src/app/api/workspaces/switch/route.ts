import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { setActiveWorkspace, listWorkspacesForUser, workspaceMembers } from '@/lib/core/engine/core';

export async function POST(req: Request) {
  try {
    const { db, user } = await requireSession();
    const body = await readBody(req);
    const workspaceId = String(body.workspaceId ?? '');
    const ws = db.workspaces.find((w) => w.id === workspaceId);
    if (!ws || !ws.memberIds.includes(user.id)) return fail('FORBIDDEN', 'You do not belong to this workspace.', 403);
    setActiveWorkspace(db, user.id, workspaceId);
    const workspaces = listWorkspacesForUser(db, user.id);
    return ok({
      activeWorkspaceId: workspaceId,
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
      members: workspaceMembers(db, workspaceId).map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
    });
  } catch (e) {
    return fromError(e);
  }
}