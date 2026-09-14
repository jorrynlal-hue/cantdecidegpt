import { ok, fail, readBody, fromError } from '@/lib/core/api/helpers';
import { generatePost, generateHooksVariant } from '@/lib/postmaker/generate';
import type { GenerateInput } from '@/lib/postmaker/types';

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const kind = String(body.kind ?? 'post');
    const input: GenerateInput = { brief: String(body.brief ?? '').trim() };
    if (kind === 'hooks') {
      const result = await generateHooksVariant(input);
      return ok(result);
    }
    if (!input.brief) {
      return fail('BAD_REQUEST', 'Paste a short instructive paragraph about your product first, then I can write the post.');
    }
    const result = await generatePost(input);
    return ok(result);
  } catch (e) {
    return fromError(e);
  }
}