import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { listLiveStatus, providerNameLabel } from '@/lib/core/providers';
import { getProviderSecrets, setProviderSecrets, clearProviderSecrets, maskKey, isProviderName, PROVIDER_NAMES, type ProviderName } from '@/lib/core/secrets';
import { requireRole } from '@/lib/core/engine/core';
import { validateProviderKey } from '@/lib/core/router';

function providerStatus(p: ProviderName) {
  const s = getProviderSecrets(p);
  return {
    provider: p,
    label: providerNameLabel(p),
    hasKey: !!s.apiKey,
    maskedKey: s.apiKey ? maskKey(s.apiKey) : '',
    baseUrl: s.baseUrl ?? '',
    model: s.model ?? '',
  };
}

export async function GET() {
  try {
    const { db, ctx } = await requireSession();
    const providers = PROVIDER_NAMES.map(providerStatus);
    return ok({
      providers,
      hasAnyKey: providers.some((p) => p.hasKey),
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
    const provider: ProviderName = isProviderName(body.provider) ? body.provider : 'openai';
    const apiKey = body.apiKey ? String(body.apiKey).trim() : undefined;
    const baseUrl = body.baseUrl ? String(body.baseUrl).trim() : undefined;
    const model = body.model ? String(body.model).trim() : undefined;
    if (apiKey) {
      const live = await validateProviderKey(provider, apiKey, baseUrl ?? getProviderSecrets(provider).baseUrl);
      if (!live) return fail('INVALID_KEY', 'The API key could not be validated against the given base URL.');
    }
    if (apiKey || baseUrl || model) {
      setProviderSecrets(provider, {
        apiKey: apiKey ?? undefined,
        baseUrl: baseUrl ?? undefined,
        model: model ?? undefined,
      });
    }
    return ok({
      providers: PROVIDER_NAMES.map(providerStatus),
      hasAnyKey: PROVIDER_NAMES.some((p) => !!getProviderSecrets(p).apiKey),
      kinds: listLiveStatus(db, ctx.workspaceId),
    });
  } catch (e) {
    return fromError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    requireRole(ctx, 'manager');
    const body = await readBody(req);
    const provider: ProviderName = isProviderName(body.provider) ? body.provider : 'openai';
    clearProviderSecrets(provider);
    return ok({ cleared: provider, providers: PROVIDER_NAMES.map(providerStatus), hasAnyKey: PROVIDER_NAMES.some((p) => !!getProviderSecrets(p).apiKey), kinds: listLiveStatus(db, ctx.workspaceId) });
  } catch (e) {
    return fromError(e);
  }
}