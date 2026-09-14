import { requireSession, ok, readBody, fromError } from '@/lib/core/api/helpers';
import { listProfiles, createWorkProfile, WORK_FIELDS } from '@/lib/core/engine/board';

export async function GET(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const url = new URL(req.url);
    const role = url.searchParams.get('role') ?? undefined;
    const field = url.searchParams.get('field') ?? undefined;
    const mine = url.searchParams.get('mine') === '1';
    const search = url.searchParams.get('q') ?? undefined;
    const profiles = listProfiles(db, { role, field, mine, search, userId: ctx.user.id });
    return ok({ profiles, fields: WORK_FIELDS });
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const profile = createWorkProfile(ctx, db, {
      role: String(body.role ?? 'finder'),
      name: body.name !== undefined ? String(body.name) : undefined,
      email: String(body.email ?? ''),
      fields: Array.isArray(body.fields) ? (body.fields as string[]) : [],
      details: String(body.details ?? ''),
      resume: body.resume !== undefined ? String(body.resume) : undefined,
      socials: Array.isArray(body.socials) ? (body.socials as string[]) : [],
      availability: body.availability !== undefined ? String(body.availability) : undefined,
    });
    return ok({ profile }, 201);
  } catch (e) {
    return fromError(e);
  }
}