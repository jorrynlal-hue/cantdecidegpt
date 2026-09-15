import { getProviderSecrets, isProviderName, type ProviderName } from './secrets';
import type { ProviderConfig } from './types';

type ProviderKind = ProviderConfig['kind'];

export type { ProviderName };

export type TextKind = 'chat' | 'content' | 'code' | 'voice';

const TEXT_KINDS: TextKind[] = ['chat', 'content', 'code', 'voice'];

export function isTextKind(kind: ProviderKind): kind is TextKind {
  return TEXT_KINDS.includes(kind as TextKind);
}

const DEFAULT_BASE: Record<ProviderName, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
};

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-1.5-pro',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
};

const STRENGTH_ORDER: ProviderName[] = ['anthropic', 'openai', 'google', 'groq', 'mistral'];
const SPEED_ORDER: ProviderName[] = ['groq', 'openai', 'google', 'anthropic', 'mistral'];

export function configuredTextProviders(): ProviderName[] {
  return STRENGTH_ORDER.filter((p) => !!getProviderSecrets(p).apiKey);
}

export function providerBaseUrl(p: ProviderName): string {
  return (getProviderSecrets(p).baseUrl || DEFAULT_BASE[p]).replace(/\/+$/, '');
}

export function providerModel(p: ProviderName, kind?: ProviderKind): string {
  const override = getProviderSecrets(p).model;
  if (override) return override;
  if (kind) {
    if (p === 'google') return kind === 'code' ? 'gemini-1.5-flash' : DEFAULT_MODELS.google;
    if (p === 'groq') return kind === 'code' ? 'llama-3.1-8b-instant' : DEFAULT_MODELS.groq;
  }
  return DEFAULT_MODELS[p];
}

export interface RouteOpts {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  speed?: boolean;
}

export interface RoutedText {
  text: string;
  provider: ProviderName;
  model: string;
}

function throwHttp(name: string, res: Response): Promise<Error> {
  return res.text().then((detail) => new Error(`${name} ${res.status}: ${detail.slice(0, 300) || res.statusText}`));
}

async function openaiCompatText(base: string, apiKey: string, model: string, messages: { role: string; content: string }[], temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw await throwHttp('LLM', res);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = j.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('LLM returned no content.');
  return text;
}

async function anthropicText(base: string, apiKey: string, model: string, system: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, temperature, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw await throwHttp('Anthropic', res);
  const j = (await res.json()) as { content?: { type?: string; text?: string }[] };
  const text = (j.content ?? []).map((c) => c.text ?? '').join('').trim();
  if (!text) throw new Error('Anthropic returned no content.');
  return text;
}

async function googleText(base: string, apiKey: string, model: string, system: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(`${base}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw await throwHttp('Google', res);
  const j = (await res.json()) as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] };
  const text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
  if (!text) throw new Error('Google returned no content.');
  return text;
}

async function callProvider(p: ProviderName, kind: TextKind, system: string, prompt: string, o: { model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
  const s = getProviderSecrets(p);
  if (!s.apiKey) throw new Error(`NO_KEY_${p.toUpperCase()}`);
  const base = providerBaseUrl(p);
  const model = o.model || providerModel(p, kind);
  const temperature = o.temperature ?? 0.7;
  const maxTokens = Math.min(o.maxTokens ?? 2000, 8000);
  if (p === 'anthropic') return anthropicText(base, s.apiKey, model, system, prompt, temperature, maxTokens);
  if (p === 'google') return googleText(base, s.apiKey, model, system, prompt, temperature, maxTokens);
  return openaiCompatText(base, s.apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ], temperature, maxTokens);
}

export async function routeText(kind: TextKind, system: string, prompt: string, opts: RouteOpts = {}): Promise<RoutedText> {
  const configured = configuredTextProviders();
  if (configured.length === 0) throw new Error('NO_LIVE_PROVIDER');
  let desired: ProviderName | undefined;
  if (opts.provider && isProviderName(opts.provider) && getProviderSecrets(opts.provider).apiKey) desired = opts.provider;
  const chain = desired
    ? [desired, ...configured.filter((p) => p !== desired)]
    : opts.speed
      ? SPEED_ORDER.filter((p) => configured.includes(p))
      : configured;
  let lastErr: Error | null = null;
  for (const p of chain) {
    try {
      const text = await callProvider(p, kind, system, prompt, { model: opts.model, temperature: opts.temperature, maxTokens: opts.maxTokens });
      return { text, provider: p, model: opts.model || providerModel(p, kind) };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('ALL_PROVIDERS_FAILED');
}

export async function validateProviderKey(provider: ProviderName, apiKey: string, baseUrl?: string): Promise<boolean> {
  const base = (baseUrl || DEFAULT_BASE[provider]).replace(/\/+$/, '');
  try {
    if (provider === 'anthropic') {
      const r = await fetch(`${base}/v1/models`, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
      return r.ok;
    }
    if (provider === 'google') {
      const r = await fetch(`${base}/models`, { headers: { 'x-goog-api-key': apiKey } });
      return r.ok;
    }
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
    return r.ok;
  } catch {
    return false;
  }
}

export function extractJsonObject(raw: string): Record<string, unknown> | null {
  let s = (raw ?? '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as unknown;
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}