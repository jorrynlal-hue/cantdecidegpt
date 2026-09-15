import fs from 'node:fs';
import path from 'node:path';

// Server-side live-provider credentials. Stored outside the document DB so they
// are never mixed with business records, and masked (never echoed) in every
// API response. File lives under .data/ which is gitignored.

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'secrets.json');

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral';

export const PROVIDER_NAMES: ProviderName[] = ['openai', 'anthropic', 'google', 'groq', 'mistral'];

export interface ProviderSecrets {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface Secrets {
  openai: ProviderSecrets;
  anthropic: ProviderSecrets;
  google: ProviderSecrets;
  groq: ProviderSecrets;
  mistral: ProviderSecrets;
}

export type OpenAISecrets = ProviderSecrets;

const EMPTY: Secrets = {
  openai: {},
  anthropic: {},
  google: {},
  groq: {},
  mistral: {},
};

const ENV_KEYS: Record<ProviderName, { key: string; base: string; model: string }> = {
  openai: { key: 'OPENAI_API_KEY', base: 'OPENAI_BASE_URL', model: 'OPENAI_MODEL' },
  anthropic: { key: 'ANTHROPIC_API_KEY', base: 'ANTHROPIC_BASE_URL', model: 'ANTHROPIC_MODEL' },
  google: { key: 'GOOGLE_API_KEY', base: 'GOOGLE_BASE_URL', model: 'GOOGLE_MODEL' },
  groq: { key: 'GROQ_API_KEY', base: 'GROQ_BASE_URL', model: 'GROQ_MODEL' },
  mistral: { key: 'MISTRAL_API_KEY', base: 'MISTRAL_BASE_URL', model: 'MISTRAL_MODEL' },
};

function readFile(): Secrets {
  try {
    if (!fs.existsSync(FILE)) return { ...EMPTY };
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Secrets>;
    const out = { ...EMPTY };
    for (const p of PROVIDER_NAMES) out[p] = { ...(parsed[p] ?? {}) };
    return out;
  } catch {
    return { ...EMPTY };
  }
}

function writeFile(s: Secrets): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

export function isProviderName(v: unknown): v is ProviderName {
  return PROVIDER_NAMES.includes(v as ProviderName);
}

export function getProviderSecrets(provider: ProviderName): ProviderSecrets {
  const env = ENV_KEYS[provider];
  const s = readFile()[provider];
  return {
    apiKey: s.apiKey || process.env[env.key] || undefined,
    baseUrl: s.baseUrl || process.env[env.base] || undefined,
    model: s.model || process.env[env.model] || undefined,
  };
}

export function setProviderSecrets(provider: ProviderName, input: ProviderSecrets): void {
  const s = readFile();
  s[provider] = { ...s[provider], ...input };
  writeFile(s);
}

export function clearProviderSecrets(provider: ProviderName): void {
  const s = readFile();
  s[provider] = {};
  writeFile(s);
}

export function getOpenAI(): ProviderSecrets {
  return getProviderSecrets('openai');
}

export function setOpenAI(input: ProviderSecrets): void {
  setProviderSecrets('openai', input);
}

export function clearOpenAI(): void {
  clearProviderSecrets('openai');
}

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}