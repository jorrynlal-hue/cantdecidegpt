import { requireSession, ok, readBody, fromError } from '@/lib/core/api/helpers';
import { updateWorkProfile, deleteWorkProfile } from '@/lib/core/engine/board';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    const body = await readBody(req);
    const profile = updateWorkProfile(ctx, db, id, {
      role: body.role !== undefined ? String(body.role) : undefined,
      name: body.name !== undefined ? String(body.name) : undefined,
      email: body.email !== undefined ? String(body.email) : undefined,
      fields: body.fields !== undefined ? (body.fields as string[]) : undefined,
      details: body.details !== undefined ? String(body.details) : undefined,
      resume: body.resume !== undefined ? String(body.resume) : undefined,
      socials: body.socials !== undefined ? (body.socials as string[]) : undefined,
      availability: body.availability !== undefined ? String(body.availability) : undefined,
    });
    return ok({ profile });
  } catch (e) {
    return fromError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, ctx } = await requireSession();
    const { id } = await params;
    deleteWorkProfile(ctx, db, id);
    return ok({ deleted: true });
  } catch (e) {
    return fromError(e);
  }
}