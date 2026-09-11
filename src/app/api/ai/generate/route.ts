import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { runGenerationLive } from '@/lib/core/engine/misc';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const kind = String(body.kind ?? 'content');
    const allowed = ['content', 'image', 'video', 'voice', 'code', 'transcription', 'speech'];
    if (!allowed.includes(kind)) return fail('BAD_REQUEST', `kind must be one of ${allowed.join(', ')}`);
    const prompt = String(body.prompt ?? '');
    if (!prompt.trim()) return fail('BAD_REQUEST', 'Prompt is required.');
    const { generation, outcome } = await runGenerationLive(ctx, db, { kind: kind as never, prompt, params: (body.params as Record<string, unknown>) ?? {} });
    return ok({ generation, outcome });
  } catch (e) {
    return fromError(e);
  }
}