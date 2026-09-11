import { getOpenAI } from './secrets';
import type { ProviderConfig } from './types';

type ProviderKind = ProviderConfig['kind'];

// Live AI transport. Speaks OpenAI-compatible REST (works against api.openai.com
// or any compatible gateway such as Ollama, LM Studio, Groq, etc. via base URL).
// Every call is real: no fabricated output. Callers decide whether/how to label
// results; if a real provider is not available they fall back to the honest
// baseline simulator, never to a fake "it worked".

export interface LiveModel {
  provider: 'openai';
  kind: ProviderKind;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_BASE = 'https://api.openai.com/v1';

const DEFAULT_MODELS: Record<string, string> = {
  chat: 'gpt-4o-mini',
  content: 'gpt-4o-mini',
  code: 'gpt-4o-mini',
  image: 'dall-e-3',
  speech: 'tts-1',
  transcription: 'whisper-1',
};

export function defaultModelFor(kind: ProviderKind): string {
  return DEFAULT_MODELS[kind] ?? 'gpt-4o-mini';
}

// A live spec is available when an API key exists. Which live provider is used
// follows the explicit providerConfig (openai) if set, else defaults to openai.
export function liveModelFor(kind: ProviderKind, cfgProvider?: string, cfgEnabled?: boolean): LiveModel | null {
  const secrets = getOpenAI();
  if (!secrets.apiKey) return null;
  if (cfgProvider !== undefined && cfgProvider !== 'baseline' && cfgProvider !== 'openai') return null;
  if (cfgEnabled === false) return null;
  if (kind === 'video') return null; // no production video generation here
  return {
    provider: 'openai',
    kind,
    apiKey: secrets.apiKey,
    baseUrl: (secrets.baseUrl || DEFAULT_BASE).replace(/\/+$/, ''),
    model: secrets.model || DEFAULT_MODELS[kind] || 'gpt-4o-mini',
  };
}

async function chatCompletion(lm: LiveModel, messages: { role: string; content: string }[], temperature = 0.7, maxTokens?: number): Promise<string> {
  const res = await fetch(`${lm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lm.apiKey}` },
    body: JSON.stringify({
      model: lm.model,
      messages,
      temperature,
      max_tokens: maxTokens ?? 1600,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('LLM returned no content.');
  return text;
}

export async function liveChat(messages: { role: string; content: string }[]): Promise<string> {
  const lm = liveModelFor('chat');
  if (!lm) throw new Error('NO_LIVE_PROVIDER');
  return chatCompletion(lm, messages);
}

export async function liveComplete(kind: ProviderKind, system: string, prompt: string, params: Record<string, unknown> = {}): Promise<string> {
  const lm = liveModelFor(kind, String(params.provider ?? 'openai'), params.enabled !== false);
  if (!lm) throw new Error('NO_LIVE_PROVIDER');
  return chatCompletion(lm, [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ], typeof params.temperature === 'number' ? params.temperature : 0.7);
}

export async function liveImage(prompt: string, params: Record<string, unknown> = {}): Promise<string> {
  const lm = liveModelFor('image');
  if (!lm) throw new Error('NO_LIVE_PROVIDER');
  const size = String(params.size ?? '1024x1024');
  const res = await fetch(`${lm.baseUrl}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lm.apiKey}` },
    body: JSON.stringify({ model: lm.model, prompt, size, n: 1, response_format: 'b64_json' }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Image ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
  }
  const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const item = json.data?.[0];
  if (!item) throw new Error('Image API returned no data.');
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item.url) return item.url;
  throw new Error('Image API returned an empty image.');
}

export async function liveSpeech(text: string, params: Record<string, unknown> = {}): Promise<string> {
  const lm = liveModelFor('speech');
  if (!lm) throw new Error('NO_LIVE_PROVIDER');
  const voice = String(params.voice ?? 'alloy');
  const res = await fetch(`${lm.baseUrl}/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lm.apiKey}` },
    body: JSON.stringify({ model: lm.model, input: text.slice(0, 2000), voice }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TTS ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString('base64')}`;
}

export async function liveTranscribe(audioB64: string, mime = 'audio/mpeg'): Promise<string> {
  const lm = liveModelFor('transcription');
  if (!lm) throw new Error('NO_LIVE_PROVIDER');
  const bytes = Buffer.from(audioB64, 'base64');
  if (bytes.length < 100) throw new Error('EMPTY_AUDIO');
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), 'audio');
  form.append('model', lm.model);
  const res = await fetch(`${lm.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${lm.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
  }
  const text = (await res.text()).trim();
  if (!text) throw new Error('Transcription returned no text.');
  return text;
}

// Warm-up validation used by the provider settings UI (models list endpoint).
export async function validateOpenAIKey(apiKey: string, baseUrl?: string): Promise<boolean> {
  const base = (baseUrl || DEFAULT_BASE).replace(/\/+$/, '');
  const res = await fetch(`${base}/models`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.ok;
}