import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { listLiveStatus } from '@/lib/core/providers';
import { getOpenAI, setOpenAI, clearOpenAI, maskKey } from '@/lib/core/secrets';
import { requireRole } from '@/lib/core/engine/core';
import { validateOpenAIKey } from '@/lib/core/ai';

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const secrets = getOpenAI();
    return ok({
      hasKey: !!secrets.apiKey,
      maskedKey: secrets.apiKey ? maskKey(secrets.apiKey) : '',
      baseUrl: secrets.baseUrl ?? '',
      model: secrets.model ?? '',
      kinds: listLiveStatus(db, ctx.workspaceId),
    });
  } catch (e) {
    return fromError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    requireRole(ctx, 'manager');
    const body = await readBody(req);
    const apiKey = body.apiKey ? String(body.apiKey).trim() : undefined;
    const baseUrl = body.baseUrl ? String(body.baseUrl).trim() : undefined;
    const model = body.model ? String(body.model).trim() : undefined;
    if (apiKey) {
      const okLive = await validateOpenAIKey(apiKey, baseUrl ?? getOpenAI().baseUrl);
      if (!okLive) return fail('INVALID_KEY', 'The API key could not be validated against the given base URL.');
    }
    if (apiKey || baseUrl || model) {
      setOpenAI({
        apiKey: apiKey ?? undefined,
        baseUrl: baseUrl ?? undefined,
        model: model ?? undefined,
      });
    }
    const secrets = getOpenAI();
    void db;
    return ok({
      hasKey: !!secrets.apiKey,
      maskedKey: secrets.apiKey ? maskKey(secrets.apiKey) : '',
      baseUrl: secrets.baseUrl ?? '',
      model: secrets.model ?? '',
      kinds: listLiveStatus(db, ctx.workspaceId),
    });
  } catch (e) {
    return fromError(e);
  }
}

export async function DELETE() {
  try {
    const { db, ctx } = await requireSession();
    requireRole(ctx, 'manager');
    clearOpenAI();
    return ok({ cleared: true, kinds: listLiveStatus(db, ctx.workspaceId) });
  } catch (e) {
    return fromError(e);
  }
}